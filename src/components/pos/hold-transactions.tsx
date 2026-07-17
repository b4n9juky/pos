"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Pause, Play, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/format"
import { useCart } from "@/hooks/use-cart"
import { useKeyboard } from "@/hooks/use-keyboard"
import { toast } from "sonner"
import { t } from "@/lib/translate"
import type { CartItem, Product } from "@/types"

interface HoldTransactionsProps {
  onRecallCustomer?: (customerId: string) => void
  itemCount: number
  disabled?: boolean
}

export function HoldTransactions({ onRecallCustomer, itemCount, disabled = false }: HoldTransactionsProps) {
  const { items, discount, loadCart, clearCart } = useCart()
  const queryClient = useQueryClient()

  const { data: heldList = [], isLoading } = useQuery({
    queryKey: ["held-transactions"],
    queryFn: () => fetch("/api/held-transactions").then((r) => r.json()),
  })

  const handleHold = async () => {
    if (itemCount === 0) return

    const payload = {
      items: items.map((i) => ({
        productId: i.product.id,
        quantity: i.quantity,
        price: i.product.price,
        name: i.product.name,
        taxable: i.product.taxable,
        taxRate: i.product.taxRate ?? null,
      })),
      discount,
    }

    try {
      const res = await fetch("/api/held-transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      clearCart()
      queryClient.invalidateQueries({ queryKey: ["held-transactions"] })
      toast.success(t("Transaction held as {ref}", { ref: data.reference }))
    } catch {
      toast.error(t("Failed to hold transaction"))
    }
  }

  const handleRecall = async (held: any) => {
    try {
      const [deleteRes, productsRes] = await Promise.all([
        fetch(`/api/held-transactions/${held.id}`, { method: "DELETE" }),
        fetch("/api/products?limit=200"),
      ])

      if (!deleteRes.ok) throw new Error("Failed to recall")
      const data = await deleteRes.json()

      const allProducts: Product[] = await productsRes.json()
      const productMap = new Map(allProducts.map((p: any) => [p.id, p]))

      const restored: CartItem[] = []
      const warnings: string[] = []

      for (const heldItem of data.items) {
        const freshProduct = productMap.get(heldItem.productId)

        if (!freshProduct || !freshProduct.active) {
          warnings.push(`${heldItem.name}: ${t("Product no longer available")}`)
          continue
        }

        if (freshProduct.stock < heldItem.quantity) {
          warnings.push(`${heldItem.name}: ${t("Only {stock} left", { stock: freshProduct.stock })}`)
          heldItem.quantity = Math.min(heldItem.quantity, freshProduct.stock)
        }

        if (freshProduct.stock > 0) {
          restored.push({ product: freshProduct, quantity: heldItem.quantity })
        }
      }

      if (restored.length === 0) {
        toast.error(t("No items could be restored"))
        return
      }

      loadCart(restored, Number(data.discount))

      if (data.customerId && onRecallCustomer) {
        onRecallCustomer(String(data.customerId))
      }

      queryClient.invalidateQueries({ queryKey: ["held-transactions"] })

      if (warnings.length > 0) {
        warnings.forEach((w) => toast.warning(w))
      } else {
        toast.success(t("Transaction {ref} restored", { ref: data.reference }))
      }

      if (restored.length < data.items.length) {
        toast.warning(t("Some items could not be restored"))
      }
    } catch {
      toast.error(t("Failed to recall transaction"))
    }
  }

  useKeyboard(
    [
      {
        key: "F6",
        handler: (e) => {
          e.preventDefault()
          handleHold()
        },
        ignoreWhenInput: false,
      },
      {
        key: "F7",
        handler: (e) => {
          e.preventDefault()
          if (heldList.length > 0) handleRecall(heldList[0])
        },
        ignoreWhenInput: false,
      },
    ],
    !disabled
  )

  if (heldList.length === 0 && itemCount === 0) return null

  return (
    <div className="border-b bg-muted/10 shrink-0">
      <div className="flex items-center gap-2 px-5 max-md:px-4 py-2">
        {itemCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleHold}
            className="h-7 text-xs gap-1.5 shrink-0"
          >
            <Pause className="h-3.5 w-3.5" />
            {t("Hold")}
          </Button>
        )}

        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
        ) : heldList.length > 0 ? (
          <div className="flex items-center gap-1.5 overflow-x-auto flex-1 scrollbar-none">
            {heldList.map((held: any) => {
              const itemArray = Array.isArray(held.items) ? held.items : []
              const totalItems = itemArray.reduce((s: number, i: any) => s + (i.quantity || 0), 0)
              const totalAmount = itemArray.reduce(
                (s: number, i: any) => s + (i.price || 0) * (i.quantity || 0),
                0
              )
              return (
                <button
                  key={held.id}
                  onClick={() => handleRecall(held)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-muted-foreground/20 bg-background px-2.5 py-1 text-xs hover:border-primary/40 hover:bg-primary/5 transition-colors shrink-0 group"
                  title={t("Click to recall")}
                >
                  <Play className="h-3 w-3 text-primary/60 group-hover:text-primary" />
                  <span className="font-mono font-medium text-[10px]">{held.reference}</span>
                  <span className="text-muted-foreground">{totalItems} item</span>
                  <span className="font-semibold tabular-nums">{formatCurrency(totalAmount)}</span>
                </button>
              )
            })}
          </div>
        ) : null}
      </div>
    </div>
  )
}
