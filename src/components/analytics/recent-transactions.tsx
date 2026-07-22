"use client"

import { FileText, ArrowUpRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, formatTime } from "@/lib/format"
import { t } from "@/lib/translate"
import { PAYMENT_METHODS } from "@/lib/constants"

const methodLabels: Record<string, string> = {}
for (const m of PAYMENT_METHODS) {
  methodLabels[m.value] = m.label
}

interface RecentTransactionsProps {
  data: Array<{
    id: number
    orderNumber: string
    customerName: string
    userName: string
    total: number
    paymentMethod: string
    createdAt: Date
  }>
}

export function RecentTransactions({ data }: RecentTransactionsProps) {
  return (
    <Card className="shadow-sm border-muted/80">
      <CardHeader>
        <CardTitle className="text-base">{t("Recent Transactions")}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <FileText className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm">{t("No recent orders")}</p>
          </div>
        ) : (
          <div className="space-y-1">
            {data.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between group hover:bg-muted/20 rounded-lg px-2 py-2 -mx-2 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-full bg-muted/50 shrink-0">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-mono font-medium truncate">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {order.customerName}
                      <span className="mx-1">·</span>
                      {formatTime(order.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    {methodLabels[order.paymentMethod] ?? order.paymentMethod}
                  </span>
                  <span className="text-sm tabular-nums font-semibold">{formatCurrency(order.total)}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/30" />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
