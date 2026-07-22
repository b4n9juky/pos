"use client"

import { AlertTriangle, Package } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/format"
import { t } from "@/lib/translate"

interface LowStockAlertsProps {
  data: Array<{
    id: number
    name: string
    stock: number
    minStock: number
    price: number
  }>
}

export function LowStockAlerts({ data }: LowStockAlertsProps) {
  return (
    <Card className="shadow-sm border-muted/80">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{t("Low Stock Alerts")}</CardTitle>
          {data.length > 0 && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5">
              {data.length}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Package className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm">{t("All products are well-stocked")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5"
              >
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("Stock:")} {product.stock} / {product.minStock}
                  </p>
                </div>
                <span className="text-sm tabular-nums font-semibold text-muted-foreground">
                  {formatCurrency(product.price)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
