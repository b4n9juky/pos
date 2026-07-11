"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus, Search, Package, Edit, MoreHorizontal, EyeOff, ChevronLeft, ChevronRight, Upload } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/format"
import { ImportModal } from "@/components/import-modal"
import { useDebounce } from "@/hooks/use-debounce"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const PAGE_SIZE = 50

export default function ProductsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [importOpen, setImportOpen] = useState(false)
  const debouncedSearch = useDebounce(search, 200)
  const [page, setPage] = useState(0)

  const offset = page * PAGE_SIZE
  const limit = PAGE_SIZE + 1

  const { data: rawProducts = [], isLoading } = useQuery({
    queryKey: ["products", debouncedSearch, page],
    queryFn: () =>
      fetch(`/api/products?limit=${limit}&offset=${offset}${debouncedSearch ? `&search=${debouncedSearch}` : ""}`).then((r) => r.json()),
  })

  const hasMore = rawProducts.length > PAGE_SIZE
  const products = hasMore ? rawProducts.slice(0, PAGE_SIZE) : rawProducts

  return (
    <DashboardShell title="Products">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(0)
              }}
              className="pl-8"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Link href="/products/new" className={cn(buttonVariants({ variant: "default" }))}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Link>
          </div>
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No products found
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product: any) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          {product.barcode && (
                            <p className="text-xs text-muted-foreground">{product.barcode}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                    <TableCell>{product.categoryName || "-"}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(Number(product.price))}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {product.costPrice ? formatCurrency(Number(product.costPrice)) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={product.stock <= product.minStock ? "destructive" : "secondary"}>
                        {product.stock}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.active ? "default" : "secondary"}>
                        {product.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <span className="flex items-center justify-center [&>svg]:h-4 [&>svg]:w-4 cursor-pointer">
                            <MoreHorizontal />
                          </span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuGroup>
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          </DropdownMenuGroup>
                          <DropdownMenuItem onClick={() => router.push(`/products/${product.id}`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={async () => {
                            const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" })
                            if (res.ok) {
                              toast.success("Product deactivated")
                              queryClient.invalidateQueries({ queryKey: ["products"] })
                            } else {
                              toast.error("Failed to deactivate product")
                            }
                          }}>
                            <EyeOff className="mr-2 h-4 w-4" />
                            Deactivate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page + 1}
            {products.length > 0 && (
              <span className="ml-1">({offset + 1}–{offset + products.length})</span>
            )}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={!hasMore}>
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <ImportModal
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Products"
        templateUrl="/api/products/template"
        importUrl="/api/products/import"
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["products"] })}
      />
    </DashboardShell>
  )
}
