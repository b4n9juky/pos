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
import { t } from "@/lib/translate"
import type { DashboardData, DateRange } from "@/components/analytics/types"
import { useState } from "react"
import { RefreshCw } from "lucide-react"

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
      )}
    </DashboardShell>
  )
}
