"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Search, Eye, ChevronLeft, ChevronRight, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/format"
import { useDebounce } from "@/hooks/use-debounce"
import { useQuery } from "@tanstack/react-query"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { t } from "@/lib/translate"

const PAGE_SIZE = 50

const statusBadge: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  completed: "default",
  cancelled: "destructive",
  refunded: "secondary",
}

export default function OrdersPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 200)
  const [page, setPage] = useState(0)

  const offset = page * PAGE_SIZE
  const limit = PAGE_SIZE + 1
  const isAdmin = session?.user?.role === "admin"
  const userId = !isAdmin && session?.user?.id ? Number(session.user.id) : undefined

  const { data: rawOrders = [], isLoading } = useQuery({
    queryKey: ["orders", debouncedSearch, page, session?.user?.id, isAdmin],
    queryFn: () => {
      const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
      if (debouncedSearch) params.set("search", debouncedSearch)
      if (userId) params.set("userId", String(userId))
      return fetch(`/api/orders?${params}`).then((r) => r.json())
    },
  })

  const hasMore = rawOrders.length > PAGE_SIZE
  const orders = hasMore ? rawOrders.slice(0, PAGE_SIZE) : rawOrders

  const goNext = () => setPage((p) => p + 1)
  const goPrev = () => setPage((p) => Math.max(0, p - 1))

  return (
    <DashboardShell title={t("Orders")}>
      <div className="space-y-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
          <Input
            placeholder={t("Search by order number or customer...")}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(0)
            }}
            className="pl-9 h-9"
          />
        </div>

        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-medium">{t("Order #")}</TableHead>
                <TableHead className="font-medium">{t("Customer")}</TableHead>
                <TableHead className="font-medium">{t("Cashier")}</TableHead>
                <TableHead className="font-medium">{t("Payment")}</TableHead>
                <TableHead className="text-right font-medium">{t("Total")}</TableHead>
                <TableHead className="font-medium">{t("Status")}</TableHead>
                <TableHead className="font-medium">{t("Date")}</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
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
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50">
                        <FileText className="h-5 w-5 text-muted-foreground/40" />
                      </div>
                      <p className="text-sm font-medium">{t("No orders found")}</p>
                      <p className="text-xs">{t("Orders will appear here once created")}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order: any) => (
                  <TableRow key={order.id} className="group hover:bg-muted/20 transition-colors">
                    <TableCell className="font-mono text-xs font-medium">{order.orderNumber}</TableCell>
                    <TableCell className="text-sm">{order.customerName || <span className="text-muted-foreground">{t("Walk-in")}</span>}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{order.userName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize text-xs font-mono">{t(order.paymentMethod)}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">{formatCurrency(Number(order.total))}</TableCell>
                    <TableCell>
                      <Badge variant={statusBadge[order.status] ?? "secondary"} className="text-xs capitalize">
                        {t(order.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/orders/${order.id}`)}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t("Page")} {page + 1}
            {orders.length > 0 && (
              <span className="ml-1">({offset + 1}&ndash;{offset + orders.length})</span>
            )}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={goPrev} disabled={page === 0} className="h-8 text-xs">
              <ChevronLeft className="mr-1 h-4 w-4" />
              {t("Previous")}
            </Button>
            <Button variant="outline" size="sm" onClick={goNext} disabled={!hasMore} className="h-8 text-xs">
              {t("Next")}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
