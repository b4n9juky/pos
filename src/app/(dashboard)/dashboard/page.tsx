"use client"

import { useQuery } from "@tanstack/react-query"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { DateRangeFilter } from "@/components/analytics/date-range-filter"
import { StatsCards } from "@/components/analytics/stats-cards"
import { SalesChart } from "@/components/analytics/sales-chart"
import { HourlyChart } from "@/components/analytics/hourly-chart"
import { TopProductsChart } from "@/components/analytics/top-products-chart"
import { PaymentMethodsChart } from "@/components/analytics/payment-methods-chart"
import { RecentTransactions } from "@/components/analytics/recent-transactions"
import { LowStockAlerts } from "@/components/analytics/low-stock-alerts"
import { DashboardSkeleton } from "@/components/analytics/dashboard-skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"
import { t } from "@/lib/translate"
import type { DashboardData, DateRange } from "@/components/analytics/types"
import { useState } from "react"
import { RefreshCw, BarChart3, TrendingUp, ShoppingCart, Users, DollarSign, Package, ArrowUpRight } from "lucide-react"

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date().toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
    label: "Hari Ini",
  })

  const { data, isLoading, refetch, isRefetching } = useQuery<DashboardData>({
    queryKey: ["dashboard", dateRange.from, dateRange.to],
    queryFn: () =>
      fetch(`/api/dashboard?from=${dateRange.from}&to=${dateRange.to}`).then(
        (r) => r.json()
      ),
    refetchInterval: 30_000,
  })

  const { data: reportsSummary } = useQuery({
    queryKey: ["dashboard-reports"],
    queryFn: () => fetch("/api/reports").then((r) => r.json()),
    staleTime: 60_000,
  })

  return (
    <DashboardShell
      title={t("Dashboard")}
      actions={
        <div className="flex items-center gap-2">
          <DateRangeFilter onChange={setDateRange} />
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`}
            />
            {t("Refresh")}
          </button>
        </div>
      }
    >
      {isLoading || !data ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div className="space-y-6">
            <StatsCards
              data={data.currentPeriod}
              previousPeriod={data.previousPeriod}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <SalesChart data={data.salesOverTime} />
              </div>
              <HourlyChart data={data.hourlySales} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TopProductsChart data={data.topProducts} />
              <PaymentMethodsChart data={data.paymentMethods} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentTransactions data={data.recentOrders} />
              <LowStockAlerts data={data.lowStockProducts} />
            </div>
          </div>

          {reportsSummary && (
            <div className="mt-8 space-y-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">{t("Ringkasan Laporan")}</h2>
              </div>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {[
                  { title: t("Total Sales"), value: formatCurrency(Number(reportsSummary.total_sales) || 0), icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
                  { title: t("Orders"), value: String(reportsSummary.total_orders ?? 0), icon: ShoppingCart, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
                  { title: t("Products Sold"), value: String(reportsSummary.total_products_sold ?? 0), icon: Package, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/30" },
                  { title: t("Customers"), value: String(reportsSummary.total_customers ?? 0), icon: Users, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
                ].map((stat) => {
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
                    {(reportsSummary.daily_sales ?? []).map((day: any) => {
                      const totals = (reportsSummary.daily_sales ?? []).map((d: any) => d.total)
                      const maxTotal = Math.max(...totals, 1)
                      const width = maxTotal > 0 ? Math.max(1, (day.total / maxTotal) * 100) : 0
                      return (
                        <div key={day.date} className="flex items-center gap-2 md:gap-4">
                          <span className="w-16 md:w-24 text-[11px] md:text-sm text-muted-foreground shrink-0 truncate">{day.date}</span>
                          <div className="flex-1 h-4 md:h-5 rounded-full bg-muted/50 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary transition-all duration-500"
                              style={{ width: `${width}%` }}
                            />
                          </div>
                          <span className="w-20 md:w-28 text-right text-[11px] md:text-sm tabular-nums font-semibold shrink-0">
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
                      {(reportsSummary.top_products ?? []).length > 0 ? (
                        (reportsSummary.top_products ?? []).map((product: any, i: number) => (
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
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground py-4 text-center">{t("No data")}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-muted/80">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">{t("Recent Orders")}</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {(reportsSummary.recent_orders ?? []).length > 0 ? (
                      <div className="space-y-3">
                        {(reportsSummary.recent_orders ?? []).map((order: any) => (
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
          )}
        </>
      )}
    </DashboardShell>
  )
}
