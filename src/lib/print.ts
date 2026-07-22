const LOCAL_PRINT_AGENT_URL = "http://localhost:8090"

export async function isLocalAgentAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${LOCAL_PRINT_AGENT_URL}/status`, {
      signal: AbortSignal.timeout(3000),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function sendToLocalPrinter(data: ThermalPrintPayload): Promise<boolean> {
  try {
    const res = await fetch(`${LOCAL_PRINT_AGENT_URL}/print`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(30000),
    })
    return res.ok
  } catch (err) {
    console.error("Local print agent failed:", err)
    return false
  }
}

export function printReceipt(html: string) {
  const iframe = document.createElement("iframe")
  iframe.style.position = "absolute"
  iframe.style.width = "0"
  iframe.style.height = "0"
  iframe.style.border = "none"
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow?.document
  if (!doc) {
    document.body.removeChild(iframe)
    return
  }

  doc.open()
  doc.write(html)
  doc.close()

  setTimeout(() => {
    iframe.contentWindow?.focus()
    iframe.contentWindow?.print()
  }, 500)

  setTimeout(() => {
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe)
    }
  }, 5000)
}

export interface ThermalPrintPayload {
  printerName: string
  paperWidth: number
  autoCut: boolean
  storeName?: string
  storeAddress?: string
  storePhone?: string
  receiptFooter?: string
  orderNumber: string
  date: string
  customerName?: string
  cashierName?: string
  paymentMethod: string
  amountPaid?: number
  change?: number
  items: Array<{
    name: string
    quantity: number
    price: number
    subtotal: number
  }>
  subtotal: number
  tax: number
  discount: number
  total: number
}

export async function sendToThermalPrinter(data: ThermalPrintPayload): Promise<boolean> {
  try {
    const res = await fetch(`/api/print-receipt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(40000),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || `Server error (${res.status})`)
    }
    return true
  } catch (err) {
    console.error("Thermal print failed:", err)
    return false
  }
}

export async function detectPrinters(): Promise<string[]> {
  try {
    const res = await fetch(`/api/print-receipt/detect`, {
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.printers || []
  } catch {
    return []
  }
}

export async function testPrint(printerName: string, paperWidth: number): Promise<boolean> {
  try {
    const res = await fetch(`/api/print-receipt/test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ printerName, paperWidth }),
      signal: AbortSignal.timeout(30000),
    })
    return res.ok
  } catch {
    return false
  }
}
