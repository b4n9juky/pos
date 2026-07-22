"use client"

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"
import { t } from "@/lib/translate"

const chartColors = {
  fill: "var(--chart-3)",
  grid: "var(--border)",
  text: "var(--muted-foreground)",
  tooltipBg: "var(--popover)",
  tooltipText: "var(--popover-foreground)",
}

interface TopProductsChartProps {
  data: Array<{ name: string; quantity: number; revenue: number }>
}

export function TopProductsChart({ data }: TopProductsChartProps) {
  if (data.length === 0) {
    return (
      <Card className="shadow-sm border-muted/80">
        <CardHeader>
          <CardTitle className="text-base">{t("Top Products")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-60 text-muted-foreground text-sm">
            {t("No data for this period")}
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = [...data].reverse()

  return (
    <Card className="shadow-sm border-muted/80">
      <CardHeader>
        <CardTitle className="text-base">{t("Top Products")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: chartColors.text }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => String(v)}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: chartColors.text }}
                tickLine={false}
                axisLine={false}
                width={120}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: chartColors.tooltipBg,
                  color: chartColors.tooltipText,
                  borderRadius: 8,
                  border: `1px solid ${chartColors.grid}`,
                  fontSize: 12,
                }}
                formatter={(value, name) => {
                  if (name === "revenue") return [formatCurrency(Number(value)), t("Revenue")]
                  return [value, t("Sold:")]
                }}
              />
              <Bar dataKey="quantity" fill={chartColors.fill} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
