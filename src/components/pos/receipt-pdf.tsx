"use client"

import { useRef, useState, useEffect } from "react"
import { Download, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/format"
import { printReceipt, sendToThermalPrinter } from "@/lib/print"
import { toast } from "sonner"
import { t } from "@/lib/translate"
import type { PaymentMethod } from "@/types"

const PRINT_STYLE = `
  body { font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; margin: 0 auto; padding: 10px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 4px 0; text-align: left; }
  th { border-bottom: 1px dashed #000; }
  .text-right { text-align: right; }
  .text-center { text-align: center; }
  .font-bold { font-weight: bold; }
  .border-t { border-top: 1px dashed #000; }
  .mt-2 { margin-top: 8px; }
  .mb-2 { margin-bottom: 8px; }
  .pt-2 { padding-top: 8px; }
  .text-sm { font-size: 10px; }
  @media print { body { width: 80mm; } }
`

function wrapReceiptHTML(innerHTML: string, orderNumber: string): string {
  return `
    <html>
      <head>
        <title>Receipt ${orderNumber}</title>
        <style>${PRINT_STYLE}</style>
      </head>
      <body>${innerHTML}</body>
    </html>
  `
}

interface ReceiptItem {
  name: string
  quantity: number
  price: number
  subtotal: number
  taxable?: boolean
}

interface ReceiptPDFProps {
  orderNumber: string
  items: ReceiptItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  paymentMethod: PaymentMethod
  amountPaid?: number
  change?: number
  storeName?: string
  storeAddress?: string
  storePhone?: string
  receiptFooter?: string
  customerName?: string
  cashierName?: string
  autoPrint?: boolean
  printerEnabled?: boolean
  printerName?: string
  printerPaperWidth?: number
  printerAutoCut?: boolean
}

export function ReceiptPDF({
  orderNumber,
  items,
  subtotal,
  tax,
  discount,
  total,
  paymentMethod,
  amountPaid,
  change,
  storeName = t("My Store"),
  storeAddress,
  storePhone,
  receiptFooter,
  customerName,
  cashierName,
  autoPrint,
  printerEnabled,
  printerName,
  printerPaperWidth = 58,
  printerAutoCut = true,
}: ReceiptPDFProps) {
  const receiptRef = useRef<HTMLDivElement>(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const printedRef = useRef(false)
  const printDataRef = useRef({
    items, subtotal, tax, discount, total, paymentMethod, amountPaid, change,
    storeName, storeAddress, storePhone, receiptFooter, customerName, cashierName,
    autoPrint, printerEnabled, printerName, printerPaperWidth, printerAutoCut, orderNumber,
  })

  useEffect(() => {
    printDataRef.current = {
      items, subtotal, tax, discount, total, paymentMethod, amountPaid, change,
      storeName, storeAddress, storePhone, receiptFooter, customerName, cashierName,
      autoPrint, printerEnabled, printerName, printerPaperWidth, printerAutoCut, orderNumber,
    }
  })

  useEffect(() => {
    if (printedRef.current) return
    if (!receiptRef.current) return
    printedRef.current = true

    const d = printDataRef.current
    const el = receiptRef.current
    const doPrint = async () => {
      if (d.printerEnabled && d.printerName) {
        const ok = await sendToThermalPrinter({
          printerName: d.printerName,
          paperWidth: d.printerPaperWidth,
          autoCut: d.printerAutoCut,
          storeName: d.storeName === t("My Store") ? undefined : d.storeName,
          storeAddress: d.storeAddress,
          storePhone: d.storePhone,
          receiptFooter: d.receiptFooter,
          orderNumber: d.orderNumber,
          date: new Date().toISOString(),
          customerName: d.customerName,
          cashierName: d.cashierName,
          paymentMethod: d.paymentMethod,
          amountPaid: d.amountPaid,
          change: d.change,
          items: d.items.map((i) => ({
            name: i.name,
            quantity: i.quantity,
            price: i.price,
            subtotal: i.subtotal,
          })),
          subtotal: d.subtotal,
          tax: d.tax,
          discount: d.discount,
          total: d.total,
        })
        if (ok) {
          toast.success(t("Receipt printed"))
        } else {
          toast.error(t("Failed to print receipt via printer. Using browser print."))
          if (d.autoPrint) {
            const html = wrapReceiptHTML(el.innerHTML, d.orderNumber)
            printReceipt(html)
          }
        }
      } else if (d.autoPrint) {
        const html = wrapReceiptHTML(el.innerHTML, d.orderNumber)
        printReceipt(html)
      }
    }
    doPrint()
  }, [])

  const handlePrint = () => {
    const content = receiptRef.current
    if (!content) return
    const html = wrapReceiptHTML(content.innerHTML, orderNumber)
    const win = window.open("", "_blank")
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 300)
  }

  const handleDownloadPDF = async () => {
    setPdfLoading(true)
    try {
      const html2canvas = (await import("html2canvas")).default
      const { jsPDF } = await import("jspdf")

      const content = receiptRef.current
      if (!content) return

      const canvas = await html2canvas(content, {
        scale: 1,
        useCORS: true,
        logging: false,
      })
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "mm", [80, canvas.height * 0.264])
      pdf.addImage(imgData, "PNG", 0, 0, 80, canvas.height * 0.264)
      pdf.save(`receipt-${orderNumber}.pdf`)
      toast.success(t("PDF downloaded"))
    } catch {
      toast.error(t("Failed to generate PDF"))
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          {t("Print")}
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownloadPDF} disabled={pdfLoading}>
          <Download className="mr-2 h-4 w-4" />
          {pdfLoading ? t("Generating...") : t("PDF")}
        </Button>
      </div>

      <div ref={receiptRef} className="bg-white text-black p-4 font-mono text-xs leading-tight" style={{ width: 300 }}>
        <div className="text-center mb-3">
          <p className="text-sm font-bold">{storeName}</p>
          {storeAddress && <p className="text-[10px]">{storeAddress}</p>}
          {storePhone && <p className="text-[10px]">{t("Telp:")} {storePhone}</p>}
          <p className="text-[10px] mt-1">{formatDate(new Date())}</p>
          <p className="text-[10px] font-bold">{orderNumber}</p>
        </div>

        <div className="border-t border-dashed border-black mb-2" />

        {customerName && (
          <p className="text-[10px] mb-1">{t("Customer:")} {customerName}</p>
        )}

        <table className="w-full text-[10px]">
          <thead>
            <tr className="border-b border-dashed border-black">
              <th className="text-left">{t("Item")}</th>
              <th className="text-right">{t("Qty")}</th>
              <th className="text-right">{t("Price")}</th>
              <th className="text-right">{t("Subtotal")}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i}>
                <td>{item.name}{item.taxable === false ? <span className="ml-1">{t("(NT)")}</span> : ""}</td>
                <td className="text-right">{item.quantity}</td>
                <td className="text-right">{formatCurrency(item.price)}</td>
                <td className="text-right">{formatCurrency(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t border-dashed border-black mt-2 pt-2 text-[10px]">
          <div className="flex justify-between">
            <span>{t("Subtotal")}</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>{t("Tax")}</span>
            <span>{formatCurrency(tax)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between">
              <span>{t("Discount")}</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-xs mt-1 pt-1 border-t border-dashed border-black">
            <span>{t("Total")}</span>
            <span>{formatCurrency(total)}</span>
          </div>
          {paymentMethod === "cash" && amountPaid != null && (
            <>
              <div className="flex justify-between">
                <span>{t("Cash")}</span>
                <span>{formatCurrency(amountPaid)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("Change")}</span>
                <span>{formatCurrency(change ?? 0)}</span>
              </div>
            </>
          )}
          {paymentMethod !== "cash" && (
            <div className="flex justify-between">
              <span>{t("Payment")}</span>
              <span className="capitalize">{t(paymentMethod)}</span>
            </div>
          )}
        </div>

        {receiptFooter && (
          <>
            <div className="border-t border-dashed border-black mt-2 pt-2" />
            <p className="text-center text-[10px] mt-2">{receiptFooter}</p>
          </>
        )}
      </div>
    </div>
  )
}
