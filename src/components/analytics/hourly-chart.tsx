"use client"

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"
import { t } from "@/lib/translate"

const chartColors = {
  fill: "var(--chart-2)",
  grid: "var(--border)",
  text: "var(--muted-foreground)",
  tooltipBg: "var(--popover)",
  tooltipText: "var(--popover-foreground)",
}

interface HourlyChartProps {
  data: Array<{ hour: number; total: number; count: number }>
}

export function HourlyChart({ data }: HourlyChartProps) {
  const padded = Array.from({ length: 24 }, (_, i) => {
    const found = data.find((d) => d.hour === i)
    return {
      hour: `${String(i).padStart(2, "0")}:00`,
      total: found?.total ?? 0,
      count: found?.count ?? 0,
    }
  })

  return (
    <Card className="shadow-sm border-muted/80">
      <CardHeader>
        <CardTitle className="text-base">{t("Hourly Sales")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={padded} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
              <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 10, fill: chartColors.text }}
                tickLine={false}
                axisLine={false}
                interval={2}
              />
              <YAxis
                tick={{ fontSize: 11, fill: chartColors.text }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => {
                  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}jt`
                  if (v >= 1000) return `${(v / 1000).toFixed(0)}rb`
                  return String(v)
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: chartColors.tooltipBg,
                  color: chartColors.tooltipText,
                  borderRadius: 8,
                  border: `1px solid ${chartColors.grid}`,
                  fontSize: 12,
                }}
                formatter={(value) => [formatCurrency(Number(value)), t("Revenue")]}
                labelFormatter={(label) => `${label}`}
              />
              <Bar dataKey="total" fill={chartColors.fill} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
