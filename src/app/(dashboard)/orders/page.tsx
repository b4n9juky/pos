"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Eye, ChevronLeft, ChevronRight } from "lucide-react"
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

const PAGE_SIZE = 50

const statusBadge: Record<string, "default" | "secondary" | "destructive"> = {
  completed: "default",
  cancelled: "destructive",
  refunded: "secondary",
}

export default function OrdersPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 200)
  const [page, setPage] = useState(0)

  const offset = page * PAGE_SIZE
  const limit = PAGE_SIZE + 1

  const { data: rawOrders = [], isLoading } = useQuery({
    queryKey: ["orders", debouncedSearch, page],
    queryFn: () =>
      fetch(`/api/orders?limit=${limit}&offset=${offset}${debouncedSearch ? `&search=${debouncedSearch}` : ""}`).then((r) => r.json()),
  })

  const hasMore = rawOrders.length > PAGE_SIZE
  const orders = hasMore ? rawOrders.slice(0, PAGE_SIZE) : rawOrders

  const goNext = () => setPage((p) => p + 1)
  const goPrev = () => setPage((p) => Math.max(0, p - 1))

  return (
    <DashboardShell title="Orders">
      <div className="space-y-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order number or customer..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(0)
            }}
            className="pl-8"
          />
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Cashier</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
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
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs font-medium">{order.orderNumber}</TableCell>
                    <TableCell>{order.customerName || "Walk-in"}</TableCell>
                    <TableCell className="text-muted-foreground">{order.userName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{order.paymentMethod}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{formatCurrency(Number(order.total))}</TableCell>
                    <TableCell>
                      <Badge variant={statusBadge[order.status] ?? "secondary"}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/orders/${order.id}`)}
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
            Page {page + 1}
            {orders.length > 0 && (
              <span className="ml-1">({offset + 1}–{offset + orders.length})</span>
            )}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={goPrev} disabled={page === 0}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={goNext} disabled={!hasMore}>
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
