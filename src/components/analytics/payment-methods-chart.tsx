"use client"

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"
import { t } from "@/lib/translate"
import { PAYMENT_METHODS } from "@/lib/constants"

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
]

const tooltipStyle = {
  backgroundColor: "var(--popover)",
  color: "var(--popover-foreground)",
  borderRadius: 8,
  border: "1px solid var(--border)",
  fontSize: 12,
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
}

const methodLabels: Record<string, string> = {}
for (const m of PAYMENT_METHODS) {
  methodLabels[m.value] = m.label
}

interface PaymentMethodsChartProps {
  data: Array<{ method: string; total: number; count: number }>
}

export function PaymentMethodsChart({ data }: PaymentMethodsChartProps) {
  if (data.length === 0) {
    return (
      <Card className="shadow-sm border-muted/80">
        <CardHeader>
          <CardTitle className="text-base">{t("Payment Methods")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-60 text-muted-foreground text-sm">
            {t("No data for this period")}
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = data.map((d) => ({
    name: methodLabels[d.method] ?? d.method,
    value: d.total,
    count: d.count,
  }))

  return (
    <Card className="shadow-sm border-muted/80">
      <CardHeader>
        <CardTitle className="text-base">{t("Payment Methods")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="45%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => [formatCurrency(Number(value)), t("Total")]}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                iconSize={8}
                formatter={(label: string) => (
                  <span style={{ color: "var(--muted-foreground)", fontSize: 12 }}>{label}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
