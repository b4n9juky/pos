"use client"

import { useState } from "react"
import { Trash2, Minus, Plus, ShoppingCart, Percent, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/format"
import { useCart } from "@/hooks/use-cart"
import { useQuery } from "@tanstack/react-query"
import { CheckoutModal } from "./checkout-modal"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function CartPanel() {
  const { items, discount, subtotal, tax, total, itemCount, taxRate, updateQuantity, removeItem, setDiscount, clearCart } = useCart()
  const [customerId, setCustomerId] = useState<string>("")
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  const { data: customers = [] } = useQuery({
    queryKey: ["pos-customers"],
    queryFn: () => fetch("/api/customers").then((r) => r.json()),
  })

  return (
    <>
      <div className="flex w-96 flex-col border-l bg-background">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            <span className="font-semibold">Cart</span>
            {itemCount > 0 && (
              <Badge variant="secondary" className="ml-1">{itemCount}</Badge>
            )}
          </div>
          {itemCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearCart} className="text-destructive h-8">
              Clear
            </Button>
          )}
        </div>

        <div className="border-b px-4 py-2">
          <Select value={customerId} onValueChange={(v) => setCustomerId(v ?? "")}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Walk-in customer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Walk-in customer</SelectItem>
              {customers.map((c: any) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {itemCount === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground">
            <ShoppingCart className="mb-2 h-12 w-12" />
            <p className="text-sm">Cart is empty</p>
            <p className="text-xs">Click products to add them</p>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1">
              <div className="space-y-1 p-2">
                {items.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(item.product.price)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="flex h-7 w-8 items-center justify-center text-sm font-medium tabular-nums">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="w-20 text-right text-sm font-medium tabular-nums">
                      {formatCurrency(item.product.price * item.quantity)}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-destructive"
                      onClick={() => removeItem(item.product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="border-t p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="Discount"
                  value={discount || ""}
                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                  className="h-8 text-sm"
                />
              </div>
              <Separator />
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax ({taxRate}%)</span>
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
              <Button
                className="w-full h-11 text-base mt-2"
                size="lg"
                onClick={() => setCheckoutOpen(true)}
              >
                Checkout ({formatCurrency(total)})
              </Button>
            </div>
          </>
        )}
      </div>

      <CheckoutModal
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        customerId={customerId ? Number(customerId) : null}
      />
    </>
  )
}
