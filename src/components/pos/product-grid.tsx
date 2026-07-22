"use client"

import { useState, useMemo, useEffect, useRef, type RefObject } from "react"
import { Search, Package } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { t } from "@/lib/translate"
import { formatCurrency } from "@/lib/format"
import { useQuery } from "@tanstack/react-query"
import type { Product } from "@/types"
import { useCart } from "@/hooks/use-cart"
import { useDebounce } from "@/hooks/use-debounce"

interface ProductGridProps {
  compact?: boolean
  searchInputRef?: RefObject<HTMLInputElement | null>
  onFilteredProducts?: (products: Product[]) => void
}

export function ProductGrid({ compact, searchInputRef, onFilteredProducts }: ProductGridProps) {
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const debouncedSearch = useDebounce(search, 200)
  const { addItem } = useCart()

  const { data: products = [] } = useQuery({
    queryKey: ["pos-products"],
    queryFn: () => fetch("/api/products?limit=200&active=true").then((r) => r.json()),
  })

  const { data: categories = [] } = useQuery({
    queryKey: ["pos-categories"],
    queryFn: () => fetch("/api/categories").then((r) => r.json()),
  })

  const filtered = useMemo(() => {
    let result = products.filter((p: any) => p.active)
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      result = result.filter(
        (p: any) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.includes(q))
      )
    }
    if (selectedCategory !== null) {
      result = result.filter((p: any) => p.categoryId === selectedCategory)
    }
    return result
  }, [debouncedSearch, selectedCategory, products])

  const filteredKey = useMemo(() => (filtered as Product[]).map(p => p.id).join(","), [filtered])
  const onFilteredProductsRef = useRef(onFilteredProducts)
  onFilteredProductsRef.current = onFilteredProducts

  useEffect(() => {
    onFilteredProductsRef.current?.(filtered)
  }, [filteredKey])

  const handleAdd = (product: any) => {
    if (product.stock <= 0) return
    addItem(product as Product)
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="space-y-3 p-4 border-b bg-muted/20">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
          <Input
            ref={searchInputRef as any}
            placeholder={t("Search by name, SKU, or barcode...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 bg-background"
            autoFocus
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "shrink-0 h-7 text-xs rounded-full px-3",
              selectedCategory === null && "shadow-sm"
            )}
          >
            {t("All")}
          </Button>
          {categories.map((cat: any) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "shrink-0 h-7 text-xs rounded-full px-3",
                selectedCategory === cat.id && "shadow-sm"
              )}
            >
              {cat.name}
            </Button>
          ))}
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className={cn(
          "grid gap-3 p-4",
          compact
            ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
            : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
        )}>
          {filtered.map((product: any) => (
            <button
              key={product.id}
              onClick={() => handleAdd(product)}
              disabled={product.stock <= 0}
              className={cn(
                "group relative flex flex-col items-center justify-center rounded-xl border bg-card p-3 text-center transition-all duration-200",
                "hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5",
                "active:scale-[0.98]",
                product.stock <= 0 && "cursor-not-allowed opacity-40"
              )}
            >
              <div className="mb-2.5 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-b from-muted/60 to-muted/30 group-hover:from-primary/5 group-hover:to-primary/10 transition-colors duration-200">
                <Package className="h-8 w-8 text-muted-foreground/30 group-hover:text-primary/40 transition-colors duration-200" />
              </div>
              <p className="line-clamp-2 text-xs font-semibold leading-snug">{product.name}</p>
              <p className="mt-1 text-sm font-bold text-primary">{formatCurrency(Number(product.price))}</p>
              <Badge
                variant={product.stock <= product.minStock ? "destructive" : "secondary"}
                className="mt-1.5 text-[9px] h-4 px-1.5"
              >
                {product.stock <= 0
                  ? t("Out of stock")
                  : t("{stock} left", { stock: product.stock })}
              </Badge>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50 mb-3">
                <Package className="h-6 w-6 text-muted-foreground/30" />
              </div>
              <p className="text-sm font-medium">{t("No products found")}</p>
              <p className="text-xs mt-0.5">{t("Try adjusting your search or filters")}</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
