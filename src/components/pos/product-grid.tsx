"use client"

import { useState, useMemo, useEffect, useRef, type RefObject } from "react"
import { Search, Package } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
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
    queryFn: () => fetch("/api/products").then((r) => r.json()),
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
      <div className="space-y-3 p-4 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef as any}
            placeholder="Search by name, SKU, or barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
            autoFocus
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className="shrink-0"
          >
            All
          </Button>
          {categories.map((cat: any) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              className="shrink-0"
            >
              {cat.name}
            </Button>
          ))}
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className={cn("grid gap-3 p-4", compact ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5")}>
          {filtered.map((product: any) => (
            <button
              key={product.id}
              onClick={() => handleAdd(product)}
              disabled={product.stock <= 0}
              className={cn(
                "group flex flex-col items-center justify-center rounded-xl border p-3 text-center hover:border-primary hover:shadow-md",
                product.stock <= 0 && "cursor-not-allowed opacity-50"
              )}
            >
              <div className="mb-2 flex h-20 w-20 items-center justify-center rounded-xl bg-muted">
                <Package className="h-10 w-10 text-muted-foreground/40" />
              </div>
              <p className="line-clamp-2 text-sm font-medium leading-tight">{product.name}</p>
              <p className="mt-1 text-sm font-bold text-primary">{formatCurrency(Number(product.price))}</p>
              <Badge
                variant={product.stock <= product.minStock ? "destructive" : "secondary"}
                className="mt-1 text-[10px]"
              >
                {product.stock} left
              </Badge>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Package className="mb-2 h-12 w-12" />
              <p>No products found</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
