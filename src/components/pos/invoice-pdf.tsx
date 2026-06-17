"use client"

import { useRef, useState, useEffect } from "react"
import { Download, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/format"
import { toast } from "sonner"

interface InvoiceItem {
  name: string
  description?: string
  quantity: number
  unitPrice: number
  subtotal: number
}

interface InvoicePDFProps {
  orderNumber: string
  status?: string
  createdAt?: string | Date
  dueDate?: string | Date
  items: InvoiceItem[]
  subtotal: number
  tax: number
  taxName?: string
  taxRate?: number
  discount: number
  total: number
  paymentMethod: string
  amountPaid?: number
  change?: number
  paymentReference?: string
  storeName?: string
  storeAddress?: string
  storePhone?: string
  storeEmail?: string
  customerName?: string
  customerAddress?: string
  customerEmail?: string
  notes?: string
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    completed: "bg-emerald-100 text-emerald-800",
    paid: "bg-emerald-100 text-emerald-800",
    pending: "bg-amber-100 text-amber-800",
    cancelled: "bg-red-100 text-red-800",
    refunded: "bg-gray-100 text-gray-600",
  }
  const cls = colors[status.toLowerCase()] ?? "bg-gray-100 text-gray-600"
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-sm font-mono text-[10px] uppercase tracking-wider ${cls}`}>
      {status}
    </span>
  )
}

export function InvoicePDF({
  orderNumber,
  status = "paid",
  createdAt,
  dueDate,
  items,
  subtotal,
  tax,
  taxName = "Tax",
  taxRate,
  discount,
  total,
  paymentMethod,
  amountPaid,
  change,
  paymentReference,
  storeName = "Your Store",
  storeAddress,
  storePhone,
  storeEmail,
  customerName,
  customerAddress,
  customerEmail,
  notes,
}: InvoicePDFProps) {
  const receiptRef = useRef<HTMLDivElement>(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [fontsLoaded, setFontsLoaded] = useState(false)

  useEffect(() => {
    const link1 = document.createElement("link")
    link1.rel = "preconnect"
    link1.href = "https://fonts.googleapis.com"

    const link2 = document.createElement("link")
    link2.rel = "preconnect"
    link2.href = "https://fonts.gstatic.com"
    link2.crossOrigin = "anonymous"

    const link3 = document.createElement("link")
    link3.rel = "stylesheet"
    link3.href = "https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@500&family=Work+Sans:wght@400;500&display=swap"

    const link4 = document.createElement("link")
    link4.rel = "stylesheet"
    link4.href = "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"

    document.head.append(link1, link2, link3, link4)

    document.fonts.ready.then(() => setFontsLoaded(true))

    return () => {
      link1.remove()
      link2.remove()
      link3.remove()
      link4.remove()
    }
  }, [])

  const issueDate = createdAt ? formatDate(createdAt) : formatDate(new Date())
  const due = dueDate || new Date(Date.now() + 14 * 86400000)
  const dueDateStr = formatDate(due)
  const ref = paymentReference || orderNumber

  const handlePrint = () => {
    const content = receiptRef.current
    if (!content) return
    const win = window.open("", "_blank")
    if (!win) return
    win.document.write(`
      <html>
        <head>
          <title>Invoice ${orderNumber}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@500&family=Work+Sans:wght@400;500&display=swap" rel="stylesheet">
          <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Work Sans', sans-serif; font-size: 14px; line-height: 1.5; color: #191c1e; background: #f7f9fb; padding: 32px 16px; }
            .invoice-canvas { background: #fff; max-width: 800px; margin: 0 auto; padding: 64px; border: 1px solid #c6c6cd; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
            .font-display { font-family: 'Hanken Grotesk', sans-serif; font-size: 48px; line-height: 56px; font-weight: 700; letter-spacing: -0.02em; text-transform: uppercase; }
            .font-headline-md { font-family: 'Hanken Grotesk', sans-serif; font-size: 20px; line-height: 28px; font-weight: 600; }
            .font-headline-lg { font-family: 'Hanken Grotesk', sans-serif; font-size: 32px; line-height: 40px; font-weight: 600; letter-spacing: -0.01em; }
            .font-body-sm { font-family: 'Work Sans', sans-serif; font-size: 14px; line-height: 20px; }
            .font-body-md { font-family: 'Work Sans', sans-serif; font-size: 16px; line-height: 24px; }
            .font-label-md { font-family: 'JetBrains Mono', monospace; font-size: 12px; line-height: 16px; letter-spacing: 0.05em; font-weight: 500; text-transform: uppercase; }
            .font-label-sm { font-family: 'JetBrains Mono', monospace; font-size: 10px; line-height: 14px; letter-spacing: 0.08em; font-weight: 500; text-transform: uppercase; }
            .text-primary { color: #000; }
            .text-on-surface { color: #191c1e; }
            .text-on-surface-variant { color: #45464d; }
            .text-outline { color: #76777d; }
            .border-outline-variant { border-color: #c6c6cd; }
            .border-primary { border-color: #000; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 16px 16px 16px 0; text-align: left; }
            th:last-child, td:last-child { padding-right: 0; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .w-24 { width: 96px; }
            .w-32 { width: 128px; }
            .zebra-stripe:nth-child(even) { background-color: #f8fafc; }
            @media print {
              .no-print { display: none; }
              body { background: white; padding: 0; }
              .invoice-canvas { box-shadow: none; border: none; margin: 0; max-width: 100%; padding: 48px; }
            }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 500)
  }

  const handleDownloadPDF = async () => {
    setPdfLoading(true)
    try {
      const html2canvas = (await import("html2canvas")).default
      const { jsPDF } = await import("jspdf")

      const content = receiptRef.current
      if (!content) return

      const canvas = await html2canvas(content, {
        scale: 2,
        useCORS: true,
        logging: false,
      })
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "mm", "a4")
      const pdfW = 210
      const pdfH = (canvas.height * pdfW) / canvas.width
      pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH)
      pdf.save(`invoice-${orderNumber}.pdf`)
      toast.success("Invoice PDF downloaded")
    } catch {
      toast.error("Failed to generate PDF")
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 justify-end no-print">
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownloadPDF} disabled={pdfLoading}>
          <Download className="mr-2 h-4 w-4" />
          {pdfLoading ? "Generating..." : "PDF"}
        </Button>
      </div>

      <div
        ref={receiptRef}
        className="invoice-canvas"
        style={{
          background: "#fff",
          maxWidth: 800,
          margin: "0 auto",
          padding: "48px 64px",
          border: "1px solid #c6c6cd",
          fontFamily: "'Work Sans', sans-serif",
          fontSize: 14,
          lineHeight: 1.5,
          color: "#191c1e",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 48 }}>
          <div>
            <h1 style={{
              fontFamily: "'Hanken Grotesk', sans-serif",
              fontSize: 48,
              lineHeight: "56px",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
              color: "#000",
              margin: 0,
            }}>
              Invoice
            </h1>
            <p style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              lineHeight: "16px",
              letterSpacing: "0.2em",
              fontWeight: 500,
              textTransform: "uppercase",
              color: "#76777d",
              marginTop: 8,
            }}>
              {storeName.toUpperCase()}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{
              width: 64,
              height: 64,
              background: "#000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
              marginLeft: "auto",
            }}>
              <span style={{ color: "#fff", fontSize: 24 }}>📄</span>
            </div>
            <div style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 14, lineHeight: "20px", color: "#45464d" }}>
              {storeAddress && <div>{storeAddress}</div>}
              {storePhone && <div>{storePhone}</div>}
              {storeEmail && <div>{storeEmail}</div>}
            </div>
          </div>
        </div>

        {/* Metadata Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 24,
          padding: "24px 0",
          borderTop: "1px solid #c6c6cd",
          borderBottom: "1px solid #c6c6cd",
          marginBottom: 48,
        }}>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: "16px", letterSpacing: "0.05em", fontWeight: 500, textTransform: "uppercase", color: "#76777d", marginBottom: 4 }}>
              Invoice Number
            </div>
            <div style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 20, lineHeight: "28px", fontWeight: 600, color: "#000" }}>
              {orderNumber}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: "16px", letterSpacing: "0.05em", fontWeight: 500, textTransform: "uppercase", color: "#76777d", marginBottom: 4 }}>
              Issue Date
            </div>
            <div style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 16, lineHeight: "24px", fontWeight: 500, color: "#191c1e" }}>
              {issueDate}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: "16px", letterSpacing: "0.05em", fontWeight: 500, textTransform: "uppercase", color: "#76777d", marginBottom: 4 }}>
              Due Date
            </div>
            <div style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 16, lineHeight: "24px", fontWeight: 500, color: "#191c1e" }}>
              {dueDateStr}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: "16px", letterSpacing: "0.05em", fontWeight: 500, textTransform: "uppercase", color: "#76777d", marginBottom: 4 }}>
              Status
            </div>
            <StatusBadge status={status} />
          </div>
        </div>

        {/* Bill To */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, marginBottom: 48 }}>
          <div>
            <h3 style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              lineHeight: "16px",
              letterSpacing: "0.05em",
              fontWeight: 500,
              textTransform: "uppercase",
              color: "#76777d",
              paddingBottom: 8,
              borderBottom: "1px solid #c6c6cd",
              marginBottom: 16,
            }}>
              Bill To
            </h3>
            <div style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 16, lineHeight: "24px" }}>
              {customerName ? (
                <>
                  <p style={{ fontWeight: 700, fontSize: 18, color: "#191c1e", margin: 0 }}>{customerName}</p>
                  {customerAddress && <p style={{ color: "#45464d", margin: 0 }}>{customerAddress}</p>}
                  {customerEmail && <p style={{ color: "#45464d", marginTop: 8, textDecoration: "underline" }}>{customerEmail}</p>}
                </>
              ) : (
                <p style={{ color: "#45464d", margin: 0 }}>Walk-in Customer</p>
              )}
            </div>
          </div>
          <div style={{
            background: "#f7f9fb",
            padding: 24,
            border: "1px solid #c6c6cd",
          }}>
            <h3 style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              lineHeight: "16px",
              letterSpacing: "0.05em",
              fontWeight: 500,
              textTransform: "uppercase",
              color: "#76777d",
              paddingBottom: 8,
              borderBottom: "1px solid #c6c6cd",
              marginBottom: 16,
            }}>
              Payment
            </h3>
            <div style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 14, lineHeight: "20px", color: "#45464d" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span>Method:</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: "16px", fontWeight: 500, color: "#191c1e", textTransform: "capitalize" }}>
                  {paymentMethod}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span>Reference:</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: "16px", fontWeight: 500, color: "#191c1e" }}>
                  {ref}
                </span>
              </div>
              {amountPaid != null && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span>Amount Paid:</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: "16px", fontWeight: 500, color: "#191c1e" }}>
                    {formatCurrency(amountPaid)}
                  </span>
                </div>
              )}
              {change != null && change > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Change:</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: "16px", fontWeight: 500, color: "#191c1e" }}>
                    {formatCurrency(change)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #000" }}>
                <th style={{ padding: "16px 16px 16px 0", textAlign: "left", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: "16px", letterSpacing: "0.05em", fontWeight: 500, textTransform: "uppercase", color: "#000" }}>
                  Description
                </th>
                <th style={{ padding: "16px 16px 16px 0", width: 96, textAlign: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: "16px", letterSpacing: "0.05em", fontWeight: 500, textTransform: "uppercase", color: "#000" }}>
                  Qty
                </th>
                <th style={{ padding: "16px 16px 16px 0", width: 128, textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: "16px", letterSpacing: "0.05em", fontWeight: 500, textTransform: "uppercase", color: "#000" }}>
                  Unit Price
                </th>
                <th style={{ padding: "16px 0", width: 128, textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: "16px", letterSpacing: "0.05em", fontWeight: 500, textTransform: "uppercase", color: "#000" }}>
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} style={i % 2 === 0 ? { background: "#f8fafc", borderBottom: "1px solid #c6c6cd" } : { borderBottom: "1px solid #c6c6cd" }}>
                  <td style={{ padding: "24px 16px 24px 0" }}>
                    <div style={{ fontWeight: 700, color: "#191c1e" }}>{item.name}</div>
                    {item.description && (
                      <div style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 14, lineHeight: "20px", color: "#45464d" }}>
                        {item.description}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "24px 16px 24px 0", textAlign: "center", color: "#191c1e" }}>{item.quantity}</td>
                  <td style={{ padding: "24px 16px 24px 0", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: "16px", fontWeight: 500, color: "#191c1e" }}>
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td style={{ padding: "24px 0", textAlign: "right", fontWeight: 500, color: "#191c1e" }}>
                    {formatCurrency(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Summary */}
        <div style={{ marginTop: 48, display: "flex", justifyContent: "flex-end" }}>
          <div style={{ width: 320 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "'Work Sans', sans-serif", fontSize: 16, lineHeight: "24px", marginBottom: 12 }}>
              <span style={{ color: "#45464d" }}>Subtotal</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: "16px", fontWeight: 500 }}>{formatCurrency(subtotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "'Work Sans', sans-serif", fontSize: 16, lineHeight: "24px", marginBottom: 12 }}>
              <span style={{ color: "#45464d" }}>{taxName}{taxRate != null ? ` (${taxRate}%)` : ""}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: "16px", fontWeight: 500 }}>{formatCurrency(tax)}</span>
            </div>
            {discount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "'Work Sans', sans-serif", fontSize: 16, lineHeight: "24px", marginBottom: 12 }}>
                <span style={{ color: "#45464d" }}>Discount</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: "16px", fontWeight: 500 }}>-{formatCurrency(discount)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 16, borderTop: "1px solid #76777d", fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 20, lineHeight: "28px", fontWeight: 600, color: "#000", marginBottom: 16 }}>
              <span>Total Amount</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <div style={{ padding: 16, background: "#f7f9fb", borderLeft: "4px solid #000" }}>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, lineHeight: "14px", letterSpacing: "0.08em", fontWeight: 500, textTransform: "uppercase", color: "#45464d", margin: 0, marginBottom: 4 }}>
                Balance Due (USD)
              </p>
              <p style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 32, lineHeight: "40px", fontWeight: 600, letterSpacing: "-0.01em", color: "#000", margin: 0 }}>
                {formatCurrency(total)}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Notes */}
        <div style={{ marginTop: 80, paddingTop: 24, borderTop: "1px solid #c6c6cd" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>
            <div>
              <h4 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: "16px", letterSpacing: "0.05em", fontWeight: 500, textTransform: "uppercase", color: "#000", marginBottom: 12 }}>
                Notes &amp; Terms
              </h4>
              <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 14, lineHeight: "20px", color: "#45464d", margin: 0 }}>
                {notes || "Please make checks payable to the store. All payments are due within 14 days of the invoice date."}
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "flex-end" }}>
              <p style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 20, lineHeight: "28px", fontWeight: 600, color: "#000", margin: 0, marginBottom: 8 }}>
                Thank you for your business.
              </p>
              <div style={{ width: 192, height: 1, background: "#c6c6cd", marginBottom: 8 }} />
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: "16px", letterSpacing: "0.05em", fontWeight: 500, textTransform: "uppercase", color: "#76777d", margin: 0 }}>
                Authorized Signature
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
