"use client"

import { useRef, useEffect } from "react"
import { Trash2, Minus, Plus, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/format"
import { t } from "@/lib/translate"
import { useCart } from "@/hooks/use-cart"
import { cn } from "@/lib/utils"

export function CartPanel() {
  const { items, updateQuantity, removeItem } = useCart()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [items.length])

  if (items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
          <ShoppingCart className="h-8 w-8 text-muted-foreground/40" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground/60">{t("Cart is empty")}</p>
          <p className="text-xs mt-0.5">{t("Scan a barcode to add products")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="divide-y divide-border/50">
        <div className="flex items-center gap-4 px-5 max-md:px-4 py-2 text-xs font-medium text-muted-foreground/60 uppercase tracking-wider bg-muted/20 sticky top-0 z-10">
          <span className="flex-1">{t("Product")}</span>
          <span className="w-28 text-center">{t("Qty")}</span>
          <span className="w-28 text-right">{t("Subtotal")}</span>
          <span className="w-8" />
        </div>
        {items.map((item, idx) => (
          <div
            key={item.product.id}
            className={cn(
              "flex items-center gap-4 px-5 max-md:px-4 py-2.5 transition-all duration-150",
              "hover:bg-muted/30 hover:shadow-[inset_0_1px_0_rgba(0,0,0,0.02)]"
            )}
            style={{ animationDelay: `${idx * 30}ms` }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{item.product.name}</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">
                {formatCurrency(item.product.price)}{t(" / u")}
              </p>
            </div>

            <div className="flex items-center justify-center gap-0.5 w-28">
              <button
                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-l-md transition-colors",
                  "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                )}
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="flex h-7 w-10 items-center justify-center text-sm font-semibold tabular-nums bg-muted/30 border-y border-border/30">
                {item.quantity}
              </span>
              <button
                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                disabled={item.quantity >= item.product.stock}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-r-md transition-colors",
                  "text-muted-foreground hover:text-foreground hover:bg-muted/80",
                  item.quantity >= item.product.stock && "opacity-30 cursor-not-allowed"
                )}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="w-28 text-right">
              <span className="text-sm font-bold text-primary tabular-nums">
                {formatCurrency(item.product.price * item.quantity)}
              </span>
            </div>

            <div className="w-8 flex justify-end">
              <button
                onClick={() => removeItem(item.product.id)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div ref={scrollRef} />
    </div>
  )
}
