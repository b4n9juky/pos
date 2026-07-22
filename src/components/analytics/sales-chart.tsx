"use client"

import { useId } from "react"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"
import { t } from "@/lib/translate"

const chartColors = {
  stroke: "var(--chart-1)",
  fill: "var(--chart-1)",
  grid: "var(--border)",
  text: "var(--muted-foreground)",
  tooltipBg: "var(--popover)",
  tooltipText: "var(--popover-foreground)",
}

interface SalesChartProps {
  data: Array<{ date: string; total: number; count: number }>
}

export function SalesChart({ data }: SalesChartProps) {
  const id = useId()

  if (data.length === 0) {
    return (
      <Card className="shadow-sm border-muted/80">
        <CardHeader>
          <CardTitle className="text-base">{t("Sales Over Time")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
            {t("No data for this period")}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm border-muted/80">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{t("Sales Over Time")}</CardTitle>
          <span className="text-xs text-muted-foreground">
            {data.length} {t("days")}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`gradient-${id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColors.fill} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={chartColors.fill} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: chartColors.text }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => {
                  const s = String(v).split("-")
                  return `${s[2]}/${s[1]}`
                }}
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
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
                formatter={(value) => [formatCurrency(Number(value)), t("Revenue")]}
                labelFormatter={(label) => {
                  if (!label) return ""
                  const parts = String(label).split("-")
                  return `${parts[2]}/${parts[1]}/${parts[0]}`
                }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke={chartColors.stroke}
                strokeWidth={2}
                fill={`url(#gradient-${id})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
