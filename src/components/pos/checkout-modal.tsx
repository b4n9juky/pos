"use client"

import { useState } from "react"
import { Banknote, CreditCard, QrCode, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { formatCurrency, generateOrderNumber } from "@/lib/format"
import { useCart } from "@/hooks/use-cart"
import { useSession } from "next-auth/react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ReceiptPDF } from "./receipt-pdf"
import type { PaymentMethod } from "@/types"

const paymentIcons: Record<PaymentMethod, React.ReactNode> = {
  cash: <Banknote className="h-4 w-4" />,
  card: <CreditCard className="h-4 w-4" />,
  qris: <QrCode className="h-4 w-4" />,
  transfer: <Building2 className="h-4 w-4" />,
}

interface CheckoutModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerId: number | null
}

export function CheckoutModal({ open, onOpenChange, customerId }: CheckoutModalProps) {
  const { items, subtotal, tax, discount, total, taxRate, clearCart } = useCart()
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash")
  const [amountPaid, setAmountPaid] = useState("")
  const [step, setStep] = useState<"payment" | "success">("payment")
  const [submitting, setSubmitting] = useState(false)
  const [orderResult, setOrderResult] = useState<{ orderNumber: string } | null>(null)
  const [settings, setSettings] = useState<any>(null)

  const change = Math.max(0, Number(amountPaid) - total)
  const orderNumber = orderResult?.orderNumber ?? generateOrderNumber()

  const handlePay = async () => {
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
          discount,
          total,
          paymentMethod,
          items: items.map((i) => ({
            productId: i.product.id,
            quantity: i.quantity,
            unitPrice: Number(i.product.price),
            subtotal: Number(i.product.price) * i.quantity,
          })),
        }),
      })

      if (!res.ok) throw new Error("Failed to create order")

      const result = await res.json()
      setOrderResult(result)
      queryClient.invalidateQueries({ queryKey: ["pos-products"] })
      queryClient.invalidateQueries({ queryKey: ["orders"] })

      const settingsRes = await fetch("/api/settings")
      if (settingsRes.ok) {
        setSettings(await settingsRes.json())
      }

      setStep("success")
    } catch {
      toast.error("Failed to process payment")
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
    onOpenChange(false)
  }

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={step === "payment"}>
        {step === "payment" ? (
          <>
            <DialogHeader>
              <DialogTitle>Checkout</DialogTitle>
              <DialogDescription>Review and complete the order</DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span className="flex-1 truncate">
                      {item.product.name} x{item.quantity}
                    </span>
                    <span className="tabular-nums">{formatCurrency(item.product.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax ({taxRate}%)</span>
                  <span className="tabular-nums">{formatCurrency(tax)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-destructive">
                    <span>Discount</span>
                    <span className="tabular-nums">-{formatCurrency(discount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="tabular-nums">{formatCurrency(total)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">
                      <span className="flex items-center gap-2">
                        <Banknote className="h-4 w-4" />
                        Cash
                      </span>
                    </SelectItem>
                    <SelectItem value="card">
                      <span className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Card
                      </span>
                    </SelectItem>
                    <SelectItem value="qris">
                      <span className="flex items-center gap-2">
                        <QrCode className="h-4 w-4" />
                        QRIS
                      </span>
                    </SelectItem>
                    <SelectItem value="transfer">
                      <span className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Bank Transfer
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {paymentMethod === "cash" && (
                <div className="space-y-2">
                  <Label>Amount Paid</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount..."
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                  />
                  {Number(amountPaid) >= total && (
                    <p className="text-sm text-muted-foreground">
                      Change: <span className="font-medium text-foreground">{formatCurrency(change)}</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handlePay} disabled={submitting || (paymentMethod === "cash" && Number(amountPaid) < total)}>
                {submitting ? "Processing..." : `Pay ${formatCurrency(total)}`}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Payment Successful</DialogTitle>
              <DialogDescription>
                Order {orderNumber} has been completed
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center gap-4 py-4">
              <div className="text-center space-y-1">
                <p className="text-2xl font-bold">{formatCurrency(total)}</p>
                <p className="text-sm text-muted-foreground">
                  {paymentMethod === "cash" ? `Paid: ${formatCurrency(Number(amountPaid))} | Change: ${formatCurrency(change)}` : `Paid via ${paymentMethod}`}
                </p>
              </div>
            </div>

            <ReceiptPDF
              orderNumber={orderNumber}
              items={items.map((i) => ({
                name: i.product.name,
                quantity: i.quantity,
                price: i.product.price,
                subtotal: i.product.price * i.quantity,
              }))}
              subtotal={subtotal}
              tax={tax}
              discount={discount}
              total={total}
              paymentMethod={paymentMethod}
              amountPaid={Number(amountPaid)}
              change={change}
              storeName={settings?.storeName}
              storeAddress={settings?.storeAddress}
              storePhone={settings?.storePhone}
              receiptFooter={settings?.receiptFooter}
            />

            <DialogFooter>
              <Button className="flex-1" onClick={handleDone}>
                New Order
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
