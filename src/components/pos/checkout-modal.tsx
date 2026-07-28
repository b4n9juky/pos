"use client"

import { useState, useRef, useEffect } from "react"
import { Banknote, CreditCard, QrCode, Building2, CheckCircle2, Circle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { formatCurrency, generateOrderNumber } from "@/lib/format"
import { useCart } from "@/hooks/use-cart"
import { useKeyboard } from "@/hooks/use-keyboard"
import { useSession } from "next-auth/react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { t } from "@/lib/translate"
import { ReceiptPDF } from "./receipt-pdf"
import { cn } from "@/lib/utils"
import type { PaymentMethod } from "@/types"

const paymentOptions: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { value: "cash", label: "Cash", icon: <Banknote className="h-5 w-5" /> },
  { value: "card", label: "Card", icon: <CreditCard className="h-5 w-5" /> },
  { value: "qris", label: "QRIS", icon: <QrCode className="h-5 w-5" /> },
  { value: "transfer", label: "Bank Transfer", icon: <Building2 className="h-5 w-5" /> },
]

interface CheckoutModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerId: number | null
}

function formatThousands(value: string): string {
  const digits = value.replace(/\D/g, "")
  if (!digits) return ""
  return Number(digits).toLocaleString("id-ID")
}

export function CheckoutModal({ open, onOpenChange, customerId }: CheckoutModalProps) {
  const { items, subtotal, taxableSubtotal, tax, discount, discountAmount, total, taxRate, membershipSettings, clearCart } = useCart()
  const nonTaxableSubtotal = subtotal - taxableSubtotal
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash")
  const [amountPaid, setAmountPaid] = useState("")
  const [step, setStep] = useState<"payment" | "success">("payment")
  const [submitting, setSubmitting] = useState(false)
  const [orderResult, setOrderResult] = useState<{ orderNumber: string } | null>(null)
  const [settings, setSettings] = useState<any>(null)
  const [printerSettings, setPrinterSettings] = useState<any>(null)
  const amountInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && step === "payment" && paymentMethod === "cash") {
      const timer = setTimeout(() => amountInputRef.current?.focus(), 100)
      return () => clearTimeout(timer)
    }
  }, [open, step, paymentMethod])

  useKeyboard(
    [
      {
        key: "Enter",
        handler: () => {
          if (paymentMethod === "cash" && (!amountPaid || Number(amountPaid) === 0)) {
            handlePay({ amountPaid: total })
          } else {
            handlePay()
          }
        },
        ignoreWhenInput: false,
      },
    ],
    open && step === "payment"
  )

  useKeyboard(
    [
      {
        key: "Enter",
        handler: () => handleDone(),
        ignoreWhenInput: false,
      },
    ],
    open && step === "success"
  )

  const change = Math.max(0, Number(amountPaid) - total)
  const orderNumber = orderResult?.orderNumber ?? generateOrderNumber()

  const handleOpenChange = (open: boolean) => {
    if (!open && step === "success") return
    onOpenChange(open)
  }

  const handlePay = async (overrides?: { paymentMethod?: PaymentMethod; amountPaid?: number }) => {
    const pm = overrides?.paymentMethod ?? paymentMethod
    const ap = overrides?.amountPaid ?? Number(amountPaid)

    if (pm === "cash" && ap < total) {
      toast.error(t("Amount paid is less than the total"))
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          userId: Number(session?.user?.id) || 1,
          subtotal,
          tax,
          discount: discountAmount,
          discountPercent: discount,
          total,
          paymentMethod: pm,
          items: items.map((i) => ({
            productId: i.product.id,
            quantity: i.quantity,
            unitPrice: Number(i.product.price),
            subtotal: Number(i.product.price) * i.quantity,
          })),
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `Server error (${res.status})`)
      }

      const result = await res.json()
      setOrderResult(result)
      if (overrides) {
        setPaymentMethod(pm)
        setAmountPaid(String(ap))
      }
      queryClient.invalidateQueries({ queryKey: ["pos-products"] })
      queryClient.invalidateQueries({ queryKey: ["orders"] })

      const [settingsRes, printerRes] = await Promise.all([
        fetch("/api/store-info"),
        fetch("/api/printer"),
      ])
      if (settingsRes.ok) {
        setSettings(await settingsRes.json())
      }
      if (printerRes.ok) {
        setPrinterSettings(await printerRes.json())
      }

      setStep("success")
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to process payment"
      console.error("handlePay error:", e)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDone = () => {
    clearCart()
    setStep("payment")
    setAmountPaid("")
    setOrderResult(null)
    setSettings(null)
    setPrinterSettings(null)
    onOpenChange(false)
  }

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl gap-0 p-0 overflow-hidden" showCloseButton={step === "payment"}>
        {step === "payment" ? (
          <>
            <DialogHeader className="px-6 pt-6 pb-0">
              <DialogTitle className="text-lg">{t("Checkout")}</DialogTitle>
              <DialogDescription>{t("Review and complete the order")}</DialogDescription>
            </DialogHeader>

            <div className="px-6 py-4 space-y-4 overflow-y-auto max-h-[60vh]">
              <div className="space-y-2 bg-muted/20 rounded-lg p-3">
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-sm items-center">
                    <span className="flex-1 min-w-0">
                      <span className="font-medium truncate">{item.product.name}</span>
                      <span className="text-muted-foreground ml-1">x{item.quantity}</span>
                      {!item.product.taxable && (
                        <span className="ml-1.5 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {t("non-taxable")}
                        </span>
                      )}
                    </span>
                    <span className="tabular-nums font-medium shrink-0 ml-4">{formatCurrency(item.product.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("Subtotal")}</span>
                  <span className="tabular-nums">{formatCurrency(subtotal)}</span>
                </div>
                {nonTaxableSubtotal > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span className="text-xs pl-4">{t("Non-taxable")}</span>
                    <span className="tabular-nums text-xs">{formatCurrency(nonTaxableSubtotal)}</span>
                  </div>
                )}
                {taxableSubtotal > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span className="text-xs pl-4">{t("Taxable subtotal")}</span>
                    <span className="tabular-nums text-xs">{formatCurrency(taxableSubtotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("Tax ({rate}%)", { rate: taxRate })}</span>
                  <span className="tabular-nums">{formatCurrency(tax)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-destructive/80">
                    <span>{t("Discount ({percent}%)", { percent: discount })}</span>
                    <span className="tabular-nums">-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                {(() => {
                  const eligible = customerId && membershipSettings.membershipEnabled && subtotal >= membershipSettings.membershipThreshold
                  if (!eligible || membershipSettings.membershipThreshold === 0) return null
                  const earned = Math.floor(subtotal / membershipSettings.pointsPerUnit) * membershipSettings.pointsPerAmount
                  if (earned <= 0) return null
                  return (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                      <span>{t("Points earned")}</span>
                      <span className="tabular-nums font-medium">+{earned.toLocaleString("id-ID")}</span>
                    </div>
                  )
                })()}
              </div>

              <Separator />

              <div className="flex flex-col items-center gap-1 py-1">
                <span className="text-xs text-muted-foreground tracking-wide uppercase">{t("Total")}</span>
                <span className="tabular-nums font-bold text-6xl leading-none tracking-tight text-primary">
                  {formatCurrency(total)}
                </span>
              </div>

              <div className="space-y-2.5">
                <span className="text-sm font-medium">{t("Payment Method")}</span>
                <div className="grid grid-cols-4 gap-2">
                  {paymentOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPaymentMethod(opt.value)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 transition-all duration-200",
                        "hover:border-primary/30 hover:bg-primary/5",
                        paymentMethod === opt.value
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border/60 bg-card"
                      )}
                    >
                      <div className={cn(
                        "transition-colors duration-200",
                        paymentMethod === opt.value ? "text-primary" : "text-muted-foreground"
                      )}>
                        {opt.icon}
                      </div>
                      <span className={cn(
                        "text-[11px] font-medium leading-tight transition-colors duration-200",
                        paymentMethod === opt.value ? "text-primary" : "text-muted-foreground"
                      )}>
                        {t(opt.label)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === "cash" && (
                <div className="space-y-2">
                  <span className="text-sm font-medium">{t("Amount Paid")}</span>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground/30">
                      Rp
                    </span>
                    <Input
                      ref={amountInputRef}
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={formatThousands(amountPaid)}
                      style={{ fontSize: 48 }}
                      className="h-20 text-center font-bold tracking-tight tabular-nums pl-14 rounded-xl border-2 border-muted-foreground/20 focus-visible:border-primary/40"
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, "")
                        setAmountPaid(raw)
                        const el = e.target
                        requestAnimationFrame(() => {
                          el.setSelectionRange(el.value.length, el.value.length)
                        })
                      }}
                    />
                  </div>
                  {Number(amountPaid) >= total && (
                    <div className="flex items-center justify-between px-1">
                      <span className="text-sm text-muted-foreground">{t("Change:")}</span>
                      <span className="text-lg font-bold text-primary tabular-nums">{formatCurrency(change)}</span>
                    </div>
                  )}
                  {Number(amountPaid) > total && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <Circle className="h-3 w-3 fill-amber-600" />
                      {t("Amount exceeds total")}
                    </p>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="px-6 py-4 border-t bg-muted/20 gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none">
                {t("Cancel")}
              </Button>
              <Button
                onClick={() => handlePay()}
                disabled={submitting || (paymentMethod === "cash" && Number(amountPaid) < total)}
                className="flex-1 sm:flex-none gap-2 shadow-sm"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {t("Processing...")}
                  </>
                ) : (
                  t("Pay {amount}", { amount: formatCurrency(total) })
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader className="px-6 pt-6 pb-0">
              <DialogTitle className="text-lg">{t("Payment Successful")}</DialogTitle>
              <DialogDescription>
                {t("Order {number} has been completed", { number: orderNumber })}
              </DialogDescription>
            </DialogHeader>

            <div className="px-6 py-6 flex flex-col items-center gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 animate-in zoom-in-50 duration-300">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>

              <div className="text-center space-y-1">
                <p className="text-3xl font-bold tabular-nums">{formatCurrency(total)}</p>
                <p className="text-sm text-muted-foreground">
                  {paymentMethod === "cash"
                    ? t("Paid: {amount} | Change: {change}", {
                        amount: formatCurrency(Number(amountPaid)),
                        change: formatCurrency(change),
                      })
                    : t("Paid via {method}", { method: t(paymentMethod) })}
                </p>
              </div>
            </div>

            <div className="px-6 pb-6">
              <ReceiptPDF
                orderNumber={orderNumber}
                items={items.map((i) => ({
                  name: i.product.name,
                  quantity: i.quantity,
                  price: i.product.price,
                  subtotal: i.product.price * i.quantity,
                  taxable: i.product.taxable,
                }))}
                subtotal={subtotal}
                tax={tax}
                discount={discountAmount}
                total={total}
                paymentMethod={paymentMethod}
                amountPaid={Number(amountPaid)}
                change={change}
                storeName={settings?.storeName}
                storeAddress={settings?.storeAddress}
                storePhone={settings?.storePhone}
                receiptFooter={settings?.receiptFooter}
                autoPrint={settings?.autoPrint}
                cashierName={session?.user?.name ?? undefined}
                printerEnabled={printerSettings?.enabled}
                printerName={printerSettings?.printerName}
                printerPaperWidth={printerSettings?.paperWidth}
                printerAutoCut={printerSettings?.autoCut}
                connectionType={printerSettings?.connectionType}
              />
            </div>

            <DialogFooter className="px-6 py-4 border-t bg-muted/20">
              <Button className="flex-1 gap-2 shadow-sm" onClick={handleDone}>
                <CheckCircle2 className="h-4 w-4" />
                {t("New Order")}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
