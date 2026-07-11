"use client"

import { use, useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Printer } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { formatCurrency, formatDate } from "@/lib/format"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useQuery } from "@tanstack/react-query"
import { InvoicePDF } from "@/components/pos/invoice-pdf"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { notFound } from "next/navigation"

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [invoiceDate, setInvoiceDate] = useState("")
  const [invoiceTotal, setInvoiceTotal] = useState(0)

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: () => fetch(`/api/orders/${id}`).then((r) => {
      if (!r.ok) throw new Error("Not found")
      return r.json()
    }),
  })

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => fetch("/api/settings").then((r) => r.json()),
  })

  const { data: taxData } = useQuery({
    queryKey: ["default-tax-rate"],
    queryFn: () => fetch("/api/tax-settings/default").then((r) => r.json()),
  })

  const { data: customer } = useQuery({
    queryKey: ["customer", order?.customerId],
    queryFn: () => fetch(`/api/customers/${order.customerId}`).then((r) => r.json()),
    enabled: !!order?.customerId,
  })

  useEffect(() => {
    if (order?.createdAt) {
      const d = new Date(order.createdAt)
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, "0")
      const day = String(d.getDate()).padStart(2, "0")
      setInvoiceDate(`${y}-${m}-${day}`)
    }
    if (order?.total != null) {
      setInvoiceTotal(Number(order.total))
    }
  }, [order?.createdAt, order?.total])

  if (isLoading) {
    return (
      <DashboardShell title="Loading...">
        <p className="text-muted-foreground">Loading...</p>
      </DashboardShell>
    )
  }

  if (!order) notFound()

  return (
    <DashboardShell title={`Order ${order.orderNumber}`}>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/orders" className={cn(buttonVariants({ variant: "outline" }))}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
          <Button variant="outline" onClick={() => setReceiptOpen(true)}>
            <Printer className="mr-2 h-4 w-4" />
            Invoice
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Order Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Number</span>
                <span className="font-medium font-mono text-xs">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span>{formatDate(order.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge>{order.status}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment</span>
                <Badge variant="outline" className="capitalize">{order.paymentMethod}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Status</span>
                <Badge variant="secondary">{order.paymentStatus}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium">{order.customerName || "Walk-in Customer"}</p>
              {customer?.email && <p className="text-xs text-muted-foreground">{customer.email}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cashier</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium">{order.userName}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(Number(item.unitPrice))}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(Number(item.subtotal))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Card className="w-full max-w-xs">
            <CardContent className="space-y-2 pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">{formatCurrency(Number(order.subtotal))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span className="tabular-nums">{formatCurrency(Number(order.tax))}</span>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-destructive">
                  <span>Discount</span>
                  <span className="tabular-nums">-{formatCurrency(Number(order.discount))}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="tabular-nums">{formatCurrency(Number(order.total))}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent className="sm:max-w-[860px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice</DialogTitle>
            <DialogDescription>Print or download the invoice as PDF</DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Label htmlFor="invoice-date">Invoice Date</Label>
            <Input
              id="invoice-date"
              type="date"
              className="w-fit"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
            />
            <Label htmlFor="invoice-total">Total Amount</Label>
            <Input
              id="invoice-total"
              type="number"
              className="w-40"
              value={invoiceTotal}
              onChange={(e) => setInvoiceTotal(Number(e.target.value))}
            />
            {Number(invoiceTotal) !== Number(order.total) && (
              <span className="text-xs text-muted-foreground">
                (original: {formatCurrency(Number(order.total))})
              </span>
            )}
          </div>
          <InvoicePDF
            orderNumber={order.orderNumber}
            status={order.status}
            createdAt={invoiceDate || order.createdAt}
            items={order.items.map((i: any) => ({
              name: i.productName,
              quantity: i.quantity,
              unitPrice: Number(i.unitPrice),
              subtotal: Number(i.subtotal),
              taxable: i.taxable,
            }))}
            subtotal={Number(order.subtotal)}
            tax={Number(order.tax)}
            taxName={taxData?.name}
            taxRate={taxData?.rate}
            discount={Number(order.discount)}
            total={invoiceTotal}
            paymentMethod={order.paymentMethod}
            amountPaid={invoiceTotal}
            change={0}
            paymentReference={order.orderNumber}
            storeName={settings?.storeName}
            storeAddress={settings?.storeAddress}
            storePhone={settings?.storePhone}
            storeEmail={settings?.storeEmail}
            customerName={order.customerName}
            customerAddress={customer?.address}
            customerEmail={customer?.email}
          />
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}
