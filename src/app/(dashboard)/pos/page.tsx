"use client"

import { useState, useRef, useCallback } from "react"
import type { Product } from "@/types"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { ProductGrid } from "@/components/pos/product-grid"
import { CartPanel } from "@/components/pos/cart-panel"
import { useCart } from "@/hooks/use-cart"
import { useKeyboard } from "@/hooks/use-keyboard"
import { cn } from "@/lib/utils"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function POSPage() {
  const { itemCount, items, addItem, removeItem } = useCart()
  const cartExpanded = itemCount > 0
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement | null>(null)
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const clearSearch = useCallback(() => {
    if (searchRef.current) {
      searchRef.current.value = ""
      searchRef.current.dispatchEvent(new Event("input", { bubbles: true }))
      searchRef.current.blur()
    }
  }, [])

  useKeyboard(
    [
      { key: "F2", handler: () => searchRef.current?.focus(), ignoreWhenInput: false },
      {
        key: "Escape",
        handler: () => clearSearch(),
        ignoreWhenInput: false,
      },
      {
        key: "Delete",
        handler: () => {
          if (items.length === 0) return
          const last = items[items.length - 1]
          removeItem(last.product.id)
        },
      },
      ...Array.from({ length: 9 }, (_, i) => ({
        key: String(i + 1),
        handler: () => {
          const product = filteredProducts[i]
          if (product && product.stock > 0) addItem(product)
        },
      })),
    ],
    !checkoutOpen
  )

  return (
    <DashboardShell hideSidebar={!sidebarOpen} hideHeader>
      <div className="relative flex flex-1 h-full min-h-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute left-2 top-2 z-50 h-8 w-8"
        >
          {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
        <ProductGrid compact={cartExpanded} searchInputRef={searchRef} onFilteredProducts={setFilteredProducts} />
        <div className={cn("border-l transition-all duration-300 h-full", cartExpanded ? "w-[480px]" : "w-96")}>
          <CartPanel checkoutOpen={checkoutOpen} onCheckoutOpenChange={setCheckoutOpen} />
        </div>
      </div>
    </DashboardShell>
  )
}
