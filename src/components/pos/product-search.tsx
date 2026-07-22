"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useCart } from "@/hooks/use-cart"
import { useDebounce } from "@/hooks/use-debounce"
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/format"
import { Package, Loader2 } from "lucide-react"
import { t } from "@/lib/translate"
import type { Product } from "@/types"

interface ProductSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProductSearch({ open, onOpenChange }: ProductSearchProps) {
  const { addItem } = useCart()
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 200)

  const { data: products = [], isPending, isError, refetch } = useQuery({
    queryKey: ["pos-products-search", debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "200", active: "true" })
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim())
      const res = await fetch(`/api/products?${params}`)
      if (!res.ok) throw new Error("Failed to fetch products")
      return res.json()
    },
    enabled: open,
    retry: 1,
    staleTime: 30_000,
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
      className="sm:max-w-xl"
      showCloseButton
    >
      <Command shouldFilter={false}>
        <CommandInput
          placeholder={t("Search products...")}
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          {!isPending && !isError && (
            <CommandEmpty>{t("No products found")}</CommandEmpty>
          )}
          <CommandGroup>
            {isPending ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">{t("Loading...")}</span>
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center gap-2 py-6">
                <p className="text-sm text-destructive">{t("Failed to load products")}</p>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  {t("Retry")}
                </Button>
              </div>
            ) : (
              products.map((product: any) => (
                <CommandItem
                  key={product.id}
                  value={String(product.id)}
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
              ))
            )}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
