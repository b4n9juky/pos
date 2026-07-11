# POS UX Refinement — Layout & Flow

## Problem Statement
How might we make the POS checkout feel fast and natural for a cashier processing orders all day — reducing visual clutter, improving touch targets, and matching the mental model of "grab items → review → pay"?

## Recommended Direction
Cluster B addresses the three highest-leverage UX issues: **remove irrelevant chrome** (full-screen mode), **make every tap fast and accurate** (larger touch targets, faster animations), and **let the interface follow the transaction** (cart becomes primary after items are added). These are mostly CSS and layout changes — high impact, low code cost, zero backend work.

## Key Assumptions to Validate
- [ ] Cashiers notice the sidebar missing and prefer having more product space — test by shipping full-screen mode and watching for complaints
- [ ] Removing hover/scale transitions improves perceived speed — measure with a timed "add 5 items" task before/after
- [ ] Cart-first flow doesn't confuse new cashiers who expect to see products — test with one non-technical person on first use

## MVP Scope
1. **Full-screen POS** — toggle to hide sidebar when on `/pos`. Add a compact "exit POS" indicator.
2. **Touch-optimized grid** — larger tile min-height, category-colored accent strip, remove `active:scale-95` transition, add image slot with `Package` fallback.
3. **Cart-first flow** — when `itemCount > 0`, cart panel grows; items and totals become the primary visual.

## Not Doing (and Why)
- **Barcode scanning** — not ready, no hardware to test against.
- **Quick-change / cash denomination buttons** — deferred until cart layout is settled.
- **One-tap cash** — requires payment flow rework.
- **Mobile/tablet layout** — focus on desktop flow first.
- **Product image upload** — functional feature, not a layout concern.

## Open Questions
- Should full-screen mode be a toggle or auto-detect from URL?
- What's the right breakpoint for cart-first mode? 3+ items? Any items?
