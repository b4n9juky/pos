# Plan: Fix POS partial-payment printing bypass

## Bug
On the POS checkout, when the cash paid is **less than the total**, the receipt still prints and the order still completes. Root cause: the "Pay" button's `disabled` attribute blocks clicking for `amountPaid < total`, but the **Enter-keyboard shortcut** (and the F8 quick-cash `overrides` path) call `handlePay()` directly with **no validation**, so a partial payment bypasses the button guard, hits the server, and prints.

Additionally, the disabled condition at `checkout-modal.tsx:323` wrongly also blocks **overpayment** (`> total`), which should be allowed (it just produces change).

## Decision (confirmed with user)
When cash paid < total → **block** completing the order (no creation, no print). Overpayment is fine.

## Files to change

### `src/components/pos/checkout-modal.tsx` (only file needing a change)

**1. Add a paid-vs-total guard at the top of `handlePay` (lines ~92–96)**
Before `setSubmitting(true)`, add an early-return for cash payments that are insufficient:
```ts
const handlePay = async (overrides?: { paymentMethod?: PaymentMethod; amountPaid?: number }) => {
  const pm = overrides?.paymentMethod ?? paymentMethod
  const ap = overrides?.amountPaid ?? Number(amountPaid)

  // Block completing the order when cash paid is less than the total
  if (pm === "cash" && ap < total) {
    toast.error(t("Amount paid is less than the total"))
    return
  }

  setSubmitting(true)
  ...
```
This protects **all** invocation paths (button click, Enter key at line 67–76, and any future `overrides` call) because the check lives inside `handlePay` itself, not just on the Button's `disabled` prop.

**2. Fix the Pay button `disabled` condition (line 323)**
Change from blocking both `<` and `>`:
```ts
disabled={submitting || (paymentMethod === "cash" && (Number(amountPaid) < total || Number(amountPaid) > total))}
```
to blocking only insufficient payment (allow overpayment → change):
```ts
disabled={submitting || (paymentMethod === "cash" && Number(amountPaid) < total)}
```
(Note: `amountPaid` starts as `""` → `Number("")` is `0`, so `< total` correctly keeps the button disabled until a sufficient amount is entered.)

**3. Non-cash methods**
For card/qris/transfer, `paymentMethod` is not `"cash"`, so the guard does not apply — those are assumed fully paid (current behavior, unchanged).

## Why no backend change is needed
- The order is still hard-coded `paymentStatus: "paid"` in `src/server/actions/orders.ts:110`, but since we now block `amountPaid < total` on the client before the POST ever fires, a completed order always has `amountPaid >= total`. The user chose to **block** (not allow pending), so no `pending`/`partial` status flow is required. Keeping the backend change out minimizes risk.
- If defense-in-depth is desired later, we *could* add `amountPaid` to the payload + schema and validate server-side, but it is out of scope for this fix.

## Verification
1. `npx tsc --noEmit` — confirm no type errors in checkout-modal.tsx.
2. `npx eslint src/components/pos/checkout-modal.tsx` — confirm no new lint errors.
3. Manual check (dev server `npm run dev`):
   - Open POS, add an item, open checkout, choose **Cash**.
   - Enter an amount **less than total** → Pay button is disabled AND pressing **Enter** shows the toast "Amount paid is less than the total" and does NOT print or create an order.
   - Enter amount **equal to / greater than total** → order completes, receipt prints, change shown for overpayment.
   - Choose **Card/Qris/Transfer** → completes normally (no cash check).
   - Confirm no receipt prints for the insufficient-cash case (auto-print disabled).

## Notes / risks
- The guard uses `pm === "cash"`. The F8 quick-cash override passes `paymentMethod: "cash"` with the auto-filled full amount, so it stays allowed (it fills the full total, not a partial).
- `Number(amountPaid)` when empty is `0`; the disabled check `0 < total` correctly disables the button initially.
- No DB/schema/migration changes.
