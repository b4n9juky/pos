"use client"

import { BarChart3, TrendingUp, ShoppingCart, Users, DollarSign, Package, ArrowUpRight } from "lucide-react"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"
import { useQuery } from "@tanstack/react-query"
import { t } from "@/lib/translate"

export default function ReportsPage() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ["reports"],
    queryFn: () => fetch("/api/reports").then((r) => r.json()),
  })

  if (isLoading || !summary) {
    return (
      <DashboardShell title={t("Reports")}>
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm">{t("Loading...")}</span>
          </div>
        </div>
      </DashboardShell>
    )
  }

  const statCards = [
    {
      title: t("Total Sales"),
      value: formatCurrency(summary.total_sales),
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
    },
    {
      title: t("Orders"),
      value: String(summary.total_orders),
      icon: ShoppingCart,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      title: t("Products Sold"),
      value: String(summary.total_products_sold),
      icon: Package,
      color: "text-violet-600",
      bg: "bg-violet-50 dark:bg-violet-950/30",
    },
    {
      title: t("Customers"),
      value: String(summary.total_customers),
      icon: Users,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950/30",
    },
  ]

  return (
    <DashboardShell title={t("Reports")}>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title} className="shadow-sm border-muted/80 hover:shadow-md transition-shadow duration-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.bg}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Card className="shadow-sm border-muted/80">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{t("Daily Sales")}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary.daily_sales.map((day: any) => {
                const maxTotal = Math.max(...summary.daily_sales.map((d: any) => d.total))
                const width = maxTotal > 0 ? Math.max(1, (day.total / maxTotal) * 100) : 0
                return (
                  <div key={day.date} className="flex items-center gap-4">
                    <span className="w-24 text-sm text-muted-foreground shrink-0">{day.date}</span>
                    <div className="flex-1 h-5 rounded-full bg-muted/50 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary transition-all duration-500"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                    <span className="w-28 text-right text-sm tabular-nums font-semibold shrink-0">
                      {formatCurrency(day.total)}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card className="shadow-sm border-muted/80">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{t("Top Products")}</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {summary.top_products.map((product: any, i: number) => (
                  <div key={product.name} className="flex items-center gap-4">
                    <span className={`
                      flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold
                      ${i === 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                        i === 1 ? "bg-slate-100 text-slate-600 dark:bg-slate-800/30 dark:text-slate-400" :
                        i === 2 ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
                        "bg-muted text-muted-foreground"}
                    `}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{t("Sold:")} {product.quantity}</p>
                    </div>
                    <span className="text-sm tabular-nums font-semibold shrink-0">
                      {formatCurrency(product.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-muted/80">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{t("Recent Orders")}</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {summary.recent_orders?.length > 0 ? (
                <div className="space-y-3">
                  {summary.recent_orders.map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between group hover:bg-muted/20 rounded-lg px-2 py-1.5 -mx-2 transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-mono font-medium">{order.order_number}</p>
                        <p className="text-xs text-muted-foreground truncate">{order.customer_name || t("Walk-in")}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm tabular-nums font-semibold">{formatCurrency(order.total)}</span>
                        <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm">{t("No recent orders")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}
