"use client"

import { useQuery } from "@tanstack/react-query"
import { useCart } from "@/hooks/use-cart"
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"
import { formatCurrency } from "@/lib/format"
import { Package } from "lucide-react"
import { t } from "@/lib/translate"
import type { Product } from "@/types"

interface ProductSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProductSearch({ open, onOpenChange }: ProductSearchProps) {
  const { addItem } = useCart()

  const { data: products = [] } = useQuery({
    queryKey: ["pos-products-search"],
    queryFn: () => fetch("/api/products").then((r) => r.json()),
    enabled: open,
  })

  const handleSelect = (product: Product) => {
    if (product.stock <= 0) return
    addItem(product)
    onOpenChange(false)
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("Search Products")}
      description={t("Search products by name, SKU, or barcode")}
      showCloseButton
    >
      <Command>
        <CommandInput placeholder={t("Search products...")} />
        <CommandList>
          <CommandEmpty>{t("No products found")}</CommandEmpty>
          <CommandGroup>
            {products
              .filter((p: any) => p.active)
              .map((product: any) => (
                <CommandItem
                  key={product.id}
                  value={`${product.name} ${product.sku} ${product.barcode || ""}`}
                  onSelect={() => handleSelect(product)}
                  disabled={product.stock <= 0}
                  className="flex items-center gap-3 py-2.5"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60">
                    <Package className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                  </div>
                  <div className="flex flex-1 items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-sm font-medium truncate block">{product.name}</span>
                      <span className="text-[11px] text-muted-foreground">{product.sku}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={product.stock <= 0 ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
                        {product.stock <= 0
                          ? t("Out of stock")
                          : t("{stock} left", { stock: product.stock })}
                      </span>
                      <span className="font-semibold text-sm tabular-nums text-primary">
                        {formatCurrency(Number(product.price))}
                      </span>
                    </div>
                  </div>
                </CommandItem>
              ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
