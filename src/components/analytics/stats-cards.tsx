"use client"

import { DollarSign, ShoppingCart, Receipt, Package } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"
import { t } from "@/lib/translate"

interface StatsCardsProps {
  data: {
    totalSales: number
    orderCount: number
    avgOrderValue: number
    itemsSold: number
  }
  previousPeriod: {
    totalSales: number
    orderCount: number
  }
}

function TrendIndicator({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) {
    return <span className="text-xs text-muted-foreground">—</span>
  }
  const pct = ((current - previous) / previous) * 100
  const isUp = pct >= 0
  return (
    <span className={cn("text-xs font-medium flex items-center gap-0.5", isUp ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
      {isUp ? "↑" : "↓"} {Math.abs(pct).toFixed(1)}%
    </span>
  )
}

export function StatsCards({ data, previousPeriod }: StatsCardsProps) {
  const cards = [
    {
      title: t("Total Sales"),
      value: formatCurrency(data.totalSales),
      icon: DollarSign,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      trend: <TrendIndicator current={data.totalSales} previous={previousPeriod.totalSales} />,
    },
    {
      title: t("Orders"),
      value: String(data.orderCount),
      icon: ShoppingCart,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/30",
      trend: <TrendIndicator current={data.orderCount} previous={previousPeriod.orderCount} />,
    },
    {
      title: t("Avg Order Value"),
      value: formatCurrency(data.avgOrderValue),
      icon: Receipt,
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-50 dark:bg-violet-950/30",
      trend: null,
    },
    {
      title: t("Items Sold"),
      value: String(data.itemsSold),
      icon: Package,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/30",
      trend: null,
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.title} className="shadow-sm border-muted/80">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", card.bg)}>
                <Icon className={cn("h-4 w-4", card.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums">{card.value}</p>
              {card.trend && <div className="mt-1">{card.trend}</div>}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
