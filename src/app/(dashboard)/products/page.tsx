"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Plus, Search, Package, Edit, MoreHorizontal, EyeOff, Eye, Trash2, ChevronLeft, ChevronRight, Upload, Barcode, AlertTriangle } from "lucide-react"
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
import { t } from "@/lib/translate"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

const PAGE_SIZE = 50
type StatusFilter = "all" | "active" | "inactive"

export default function ProductsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "admin"
  const canWrite = isAdmin || session?.user?.role === "warehouse"
  const [importOpen, setImportOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const debouncedSearch = useDebounce(search, 200)
  const [page, setPage] = useState(0)

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description: string
    confirmLabel: string
    variant?: "destructive" | "default"
    action: () => Promise<void>
  } | null>(null)

  const offset = page * PAGE_SIZE
  const limit = PAGE_SIZE + 1

  const activeParam = statusFilter === "all" ? undefined : statusFilter === "active" ? "true" : "false"

  const { data: rawProducts = [], isLoading } = useQuery({
    queryKey: ["products", debouncedSearch, page, statusFilter],
    queryFn: () =>
      fetch(`/api/products?limit=${limit}&offset=${offset}${debouncedSearch ? `&search=${debouncedSearch}` : ""}${activeParam ? `&active=${activeParam}` : ""}`).then((r) => r.json()),
  })

  const hasMore = rawProducts.length > PAGE_SIZE
  const products = hasMore ? rawProducts.slice(0, PAGE_SIZE) : rawProducts

  const handleFilterChange = useCallback((filter: StatusFilter) => {
    setStatusFilter(filter)
    setPage(0)
  }, [])

  const closeConfirm = useCallback(() => setConfirmDialog(null), [])

  return (
    <DashboardShell title={t("Products")}>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="relative flex-1 max-w-sm min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input
              placeholder={t("Search products...")}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(0)
              }}
              className="pl-9 h-9"
            />
          </div>
          {canWrite && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setImportOpen(true)} className="h-9">
                <Upload className="mr-2 h-4 w-4" />
                {t("Import")}
              </Button>
              <Link href="/products/new" className={cn(buttonVariants({ variant: "default", size: "sm" }), "h-9")}>
                <Plus className="mr-2 h-4 w-4" />
                {t("Add Product")}
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {(["all", "active", "inactive"] as const).map((f) => (
            <button
              key={f}
              onClick={() => handleFilterChange(f)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                statusFilter === f
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {f === "all" ? t("All") : f === "active" ? t("Active") : t("Inactive")}
            </button>
          ))}
        </div>

        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-medium">{t("Name")}</TableHead>
                <TableHead className="font-medium">{t("SKU")}</TableHead>
                <TableHead className="font-medium">{t("Category")}</TableHead>
                <TableHead className="text-right font-medium">{t("Price")}</TableHead>
                <TableHead className="text-right font-medium">{t("Cost")}</TableHead>
                <TableHead className="text-right font-medium">{t("Stock")}</TableHead>
                <TableHead className="font-medium">{t("Status")}</TableHead>
                {canWrite && <TableHead className="w-12"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={canWrite ? 8 : 7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span className="text-sm">{t("Loading...")}</span>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50">
                        <Package className="h-5 w-5 text-muted-foreground/40" />
                      </div>
                      <p className="text-sm font-medium">{t("No products found")}</p>
                      <p className="text-xs">{t("Add a product or adjust your search")}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product: any) => (
                  <TableRow key={product.id} className="group hover:bg-muted/20 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-b from-muted/60 to-muted/30 group-hover:from-primary/5 group-hover:to-primary/10 transition-colors",
                          !product.active && "opacity-50"
                        )}>
                          <Package className="h-4 w-4 text-muted-foreground/50" />
                        </div>
                        <div>
                          <p className={cn("font-medium text-sm", !product.active && "text-muted-foreground")}>{product.name}</p>
                          {product.barcode && (
                            <p className="text-[11px] text-muted-foreground font-mono">{product.barcode}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{product.sku}</TableCell>
                    <TableCell>
                      <span className="text-sm">{product.categoryName || <span className="text-muted-foreground">-</span>}</span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{formatCurrency(Number(product.price))}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground text-sm">
                      {product.costPrice ? formatCurrency(Number(product.costPrice)) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={product.stock <= product.minStock ? "destructive" : "secondary"}
                        className="font-mono text-xs"
                      >
                        {product.stock}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.active ? "default" : "secondary"} className="text-xs">
                        {product.active ? t("Active") : t("Inactive")}
                      </Badge>
                    </TableCell>
                    {canWrite && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex shrink-0 items-center justify-center rounded-md h-8 w-8 hover:bg-muted transition-colors">
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuGroup>
                              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">{t("Actions")}</DropdownMenuLabel>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => router.push(`/products/${product.id}`)} className="text-sm gap-2">
                              <Edit className="h-4 w-4" />
                              {t("Edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => router.push(
                                `/products/barcode-print?name=${encodeURIComponent(product.name)}&sku=${encodeURIComponent(product.sku)}&price=${encodeURIComponent(product.price || "")}&barcode=${encodeURIComponent(product.barcode || "")}`
                              )}
                              className="text-sm gap-2"
                            >
                              <Barcode className="h-4 w-4" />
                              Print Barcode
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {product.active ? (
                              <DropdownMenuItem
                                className="text-sm gap-2 text-destructive focus:text-destructive"
                                onClick={() =>
                                  setConfirmDialog({
                                    open: true,
                                    title: t("Deactivate product"),
                                    description: t("Are you sure you want to deactivate") + ` "${product.name}"? ${t("It will be hidden from POS.")}`,
                                    confirmLabel: t("Deactivate"),
                                    variant: "destructive",
                                    action: async () => {
                                      const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" })
                                      if (!res.ok) {
                                        const err = await res.json().catch(() => ({}))
                                        throw new Error(err.error || t("Failed to deactivate product"))
                                      }
                                    },
                                  })
                                }
                              >
                                <EyeOff className="h-4 w-4" />
                                {t("Deactivate")}
                              </DropdownMenuItem>
                            ) : (
                              <>
                                <DropdownMenuItem
                                  className="text-sm gap-2"
                                  onClick={() =>
                                    setConfirmDialog({
                                      open: true,
                                      title: t("Reactivate product"),
                                      description: t("Are you sure you want to reactivate") + ` "${product.name}"? ${t("It will be available in POS again.")}`,
                                      confirmLabel: t("Reactivate"),
                                      action: async () => {
                                        const res = await fetch(`/api/products/${product.id}`, { method: "POST" })
                                        if (!res.ok) {
                                          const err = await res.json().catch(() => ({}))
                                          throw new Error(err.error || t("Failed to reactivate product"))
                                        }
                                      },
                                    })
                                  }
                                >
                                  <Eye className="h-4 w-4" />
                                  {t("Reactivate")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-sm gap-2 text-destructive focus:text-destructive"
                                  onClick={() =>
                                    setConfirmDialog({
                                      open: true,
                                      title: t("Delete product"),
                                      description: t("Are you sure you want to delete") + ` "${product.name}"? ${t("The product will be hidden from the system and can be restored later.")}`,
                                      confirmLabel: t("Delete"),
                                      variant: "destructive",
                                      action: async () => {
                                        const res = await fetch(`/api/products/${product.id}?hard=true`, { method: "DELETE" })
                                        if (!res.ok) {
                                          const err = await res.json().catch(() => ({}))
                                          throw new Error(err.error || t("Failed to delete product"))
                                        }
                                      },
                                    })
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                  {t("Delete")}
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t("Page")} {page + 1}
            {products.length > 0 && (
              <span className="ml-1">({offset + 1}&ndash;{offset + products.length})</span>
            )}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="h-8 text-xs">
              <ChevronLeft className="mr-1 h-4 w-4" />
              {t("Previous")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={!hasMore} className="h-8 text-xs">
              {t("Next")}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {canWrite && (
        <ImportModal
          open={importOpen}
          onOpenChange={setImportOpen}
          title={t("Products")}
          templateUrl="/api/products/template"
          importUrl="/api/products/import"
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["products"] })}
        />
      )}

      <Dialog
        open={confirmDialog?.open ?? false}
        onOpenChange={(open) => {
          if (!open) closeConfirm()
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                confirmDialog?.variant === "destructive" ? "bg-destructive/10" : "bg-primary/10"
              )}>
                <AlertTriangle className={cn(
                  "h-5 w-5",
                  confirmDialog?.variant === "destructive" ? "text-destructive" : "text-primary"
                )} />
              </div>
              <div>
                <DialogTitle>{confirmDialog?.title}</DialogTitle>
                <DialogDescription className="mt-1">
                  {confirmDialog?.description}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeConfirm}>
              {t("Cancel")}
            </Button>
            <Button
              variant={confirmDialog?.variant === "destructive" ? "destructive" : "default"}
              onClick={async () => {
                if (!confirmDialog) return
                try {
                  await confirmDialog.action()
                  toast.success(confirmDialog.title)
                  queryClient.invalidateQueries({ queryKey: ["products"] })
                  closeConfirm()
                } catch (e: any) {
                  toast.error(e.message || t("Action failed"))
                }
              }}
            >
              {confirmDialog?.confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}
