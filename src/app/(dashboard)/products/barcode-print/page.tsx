"use client"

import { useState, useEffect, useRef, useMemo, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Download, Copy, Printer, Search, Plus, Trash2, ChevronDown, ChevronUp, ChevronLeft,
} from "lucide-react"
import JsBarcode from "jsbarcode"
import QRCode from "qrcode"

// ─── Types ───────────────────────────────────────────────────────────

interface LabelItem {
  price: string
  barcode: string
}

interface PrinterDevice {
  name: string
  uid: string
}

// ─── Constants ───────────────────────────────────────────────────────

const DPI = 8
const BP_URL = "http://localhost:9100"
const SIZE_PRESETS: Record<string, { w: number; h: number }> = {
  "33x15": { w: 33, h: 15 },
  "50x30": { w: 50, h: 30 },
  "40x30": { w: 40, h: 30 },
  "58x40": { w: 58, h: 40 },
  "100x50": { w: 100, h: 50 },
}
const STORAGE_KEY = "zebraLabelSettings"
const FONT_NAMES: Record<string, string> = {
  "sans-serif": "0",
  serif: "N",
}

// ─── Helpers ─────────────────────────────────────────────────────────

function escZPL(s: string): string {
  return String(s).replace(/\^/g, "").replace(/~/g, "").trim()
}

function getEAN13Digits(val: string): string | null {
  const digits = String(val || "").replace(/\D/g, "")
  return digits.length < 12 ? null : digits.slice(0, 12)
}

function getLabelSize(preset: string, cw: number, ch: number): { w: number; h: number } {
  if (preset === "custom") return { w: cw || 50, h: ch || 30 }
  return SIZE_PRESETS[preset] || { w: 33, h: 15 }
}

// ─── BarcodeCell ─────────────────────────────────────────────────────

function BarcodeCell({ value, type, moduleWidth, heightDots, compact, bcModuleWidth, bcHeight, bcShowValue, bcValueFontSize }: {
  value: string; type: string; moduleWidth: number; heightDots: number; compact: boolean; bcModuleWidth?: number; bcHeight?: number; bcShowValue?: boolean; bcValueFontSize?: number
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scaleFactor = 5.2 / 8

  useEffect(() => {
    if (type === "qrcode") {
      if (!canvasRef.current) return
      QRCode.toCanvas(canvasRef.current, value || " ", {
        width: compact ? 50 : 96,
        margin: 1,
      }).catch(() => {})
      return
    }
    if (!svgRef.current) return
    try {
      const w = bcModuleWidth && bcModuleWidth > 0 ? bcModuleWidth : Math.max(1, moduleWidth)
      const h = bcHeight && bcHeight > 0 ? bcHeight : heightDots
      const dv = bcShowValue !== false
      const fs = bcValueFontSize && bcValueFontSize > 0 ? bcValueFontSize : Math.round(h * 0.3)
      if (type === "ean13") {
        const digits = getEAN13Digits(value)
        if (!digits) throw new Error("Invalid EAN")
        JsBarcode(svgRef.current, digits, {
          format: "EAN13", lineColor: "#111", width: w, height: h, displayValue: dv, fontSize: fs, margin: 0,
        })
      } else {
        JsBarcode(svgRef.current, value || " ", {
          format: "CODE128", lineColor: "#111", width: w, height: h, displayValue: dv, fontSize: fs, margin: 0,
        })
      }
    } catch { /* ignore */ }
  }, [value, type, moduleWidth, heightDots, compact, bcModuleWidth, bcHeight, bcShowValue, bcValueFontSize])

  if (type === "qrcode") return <canvas ref={canvasRef} className="max-w-full" />
  return <svg ref={svgRef} style={{ transform: `scale(${scaleFactor})`, transformOrigin: "top left" }} />
}

// ─── PrintLog ────────────────────────────────────────────────────────

function PrintLog({ logs }: { logs: string[] }) {
  const bottomRef = useRef<HTMLDivElement>(null)
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [logs])
  return (
    <div className="bg-muted/40 border rounded-md p-3 text-xs font-mono max-h-[120px] overflow-y-auto space-y-0.5">
      {logs.length === 0 ? (
        <span className="text-muted-foreground">Menunggu koneksi ke Zebra Browser Print&hellip;</span>
      ) : (
        logs.map((l, i) => {
          const isErr = l.startsWith("ERR:")
          const isOk = l.startsWith("OK:")
          return (
            <div key={i} className={isErr ? "text-destructive" : isOk ? "text-emerald-600" : "text-muted-foreground"}>
              {l}
            </div>
          )
        })
      )}
      <div ref={bottomRef} />
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────

export default function BarcodePrintPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Memuat&hellip;</div>}>
      <BarcodePrintContent />
    </Suspense>
  )
}

function BarcodePrintContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const previewRef = useRef<HTMLDivElement>(null)

  // ── Items ──
  const urlPrice = searchParams.get("price")
  const defaultItems: LabelItem[] = urlPrice
    ? [{ price: searchParams.get("price") || "", barcode: searchParams.get("barcode") || "" }]
    : []
  const [items, setItems] = useState<LabelItem[]>(defaultItems)

  // ── Barcode settings ──
  const [bcType, setBcType] = useState("code128")
  const [bcOffsetX, setBcOffsetX] = useState(0)
  const [bcOffsetY, setBcOffsetY] = useState(0)
  const [bcHeight, setBcHeight] = useState(0)
  const [bcModuleWidth, setBcModuleWidth] = useState(0)
  const [bcShowValue, setBcShowValue] = useState(true)
  const [bcValueFontSize, setBcValueFontSize] = useState(0)

  // ── Price text settings ──
  const [priceFontSize, setPriceFontSize] = useState(28)
  const [priceFont, setPriceFont] = useState("sans-serif")
  const [pricePosition, setPricePosition] = useState<"right" | "left" | "above" | "below">("right")
  const [priceAlign, setPriceAlign] = useState<"left" | "center" | "right">("right")
  const [priceGap, setPriceGap] = useState(1)

  // ── Label size ──
  const [sizePreset, setSizePreset] = useState("33x15")
  const [customW, setCustomW] = useState(50)
  const [customH, setCustomH] = useState(30)

  // ── Layout ──
  const [cols, setCols] = useState(3)
  const [rowsPerSheet, setRowsPerSheet] = useState(1)
  const [gapX, setGapX] = useState(2)
  const [gapY, setGapY] = useState(4)
  const [copies, setCopies] = useState(1)

  // ── Printer ──
  const [printerStatus, setPrinterStatus] = useState<"off" | "on" | "connecting">("off")
  const [printerName, setPrinterName] = useState("")
  const [availableDevices, setAvailableDevices] = useState<PrinterDevice[]>([])
  const [selectedDeviceIdx, setSelectedDeviceIdx] = useState(0)
  const [printing, setPrinting] = useState(false)

  // ── UI ──
  const [logs, setLogs] = useState<string[]>([])
  const [zplShown, setZplShown] = useState(false)
  const [initialized, setInitialized] = useState(false)

  const isCustom = sizePreset === "custom"
  const { w: labelW, h: labelH } = getLabelSize(sizePreset, customW, customH)
  const compact = labelH <= 20
  const previewScale = 5.2
  const marginDots = compact ? 8 : 16
  const zplMarginPx = marginDots / DPI * previewScale
  const cwDots = Math.round(labelW * DPI)
  const availWDots = cwDots - marginDots * 2
  const bcOffPxY = bcOffsetY * previewScale
  const bcOffPxX = bcOffsetX * previewScale

  // ── Log helper ──
  const addLog = useCallback((msg: string, kind?: "err" | "ok") => {
    const t = new Date().toLocaleTimeString("id-ID")
    const prefix = kind === "err" ? "ERR:" : kind === "ok" ? "OK:" : ""
    setLogs(prev => [...prev, `[${t}] ${prefix}${msg}`])
  }, [])

  // ── Init ──
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        const data = JSON.parse(raw)
        if (data.items?.length && items.length === 0) setItems(data.items)
        if (data.bcType) setBcType(data.bcType)
        if (data.bcOffsetX != null) setBcOffsetX(data.bcOffsetX)
        if (data.bcOffsetY != null) setBcOffsetY(data.bcOffsetY)
        if (data.sizePreset) setSizePreset(data.sizePreset)
        if (data.customW != null) setCustomW(data.customW)
        if (data.customH != null) setCustomH(data.customH)
        if (data.cols != null) setCols(data.cols)
        if (data.rows != null) setRowsPerSheet(data.rows)
        if (data.gapX != null) setGapX(data.gapX)
        if (data.gapY != null) setGapY(data.gapY)
        if (data.copies != null) setCopies(data.copies)
        if (data.priceFontSize != null) setPriceFontSize(data.priceFontSize)
        if (data.bcHeight != null) setBcHeight(data.bcHeight)
        if (data.bcModuleWidth != null) setBcModuleWidth(data.bcModuleWidth)
        if (data.bcShowValue != null) setBcShowValue(data.bcShowValue)
        if (data.bcValueFontSize != null) setBcValueFontSize(data.bcValueFontSize)
        if (data.pricePosition != null) setPricePosition(data.pricePosition)
        if (data.priceAlign != null) setPriceAlign(data.priceAlign)
        if (data.priceGap != null) setPriceGap(data.priceGap)
        if (data.priceFont != null) setPriceFont(data.priceFont)
      } catch { /* ignore */ }
    }
    if (items.length === 0 && !raw) {
      setItems([{ price: "Rp 25.000", barcode: "8991234567890" }])
    }
    setInitialized(true)
    connectDefaultPrinter()
  }, [])

  // ── Save to localStorage ──
  useEffect(() => {
    if (!initialized) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        items, bcType, bcOffsetX, bcOffsetY, priceFontSize, priceFont, pricePosition, priceAlign, priceGap,
        bcHeight, bcModuleWidth, bcShowValue, bcValueFontSize,
        sizePreset, customW, customH, cols, rows: rowsPerSheet, gapX, gapY, copies,
      }))
    } catch { /* ignore */ }
  }, [initialized, items, bcType, bcOffsetX, bcOffsetY, priceFontSize, priceFont, pricePosition, priceAlign, priceGap,
      bcHeight, bcModuleWidth, bcShowValue, bcValueFontSize,
      sizePreset, customW, customH, cols, rowsPerSheet, gapX, gapY, copies])

  // ── Build ZPL ──
  const buildZPL = useCallback(() => {
    const fn = FONT_NAMES[priceFont] || "0"
    const bcValFS = bcValueFontSize > 0 ? bcValueFontSize : 0

    function labelZPL(xOff: number, yOff: number, cw: number, rh: number, item: LabelItem | null): string {
      if (!item) return ""
      const price = item.price || ""
      const displayPrice = price.startsWith("Rp") ? price : `Rp ${price}`
      const bcVal = item.barcode || ""
      const pFont = priceFontSize > 0 ? priceFontSize : 28
      const bcOffXD = Math.round(bcOffsetX * DPI)
      const bcOffYD = Math.round(bcOffsetY * DPI)
      let y = yOff + marginDots
      let block = ""

      const availW = cw - marginDots * 2
      const autoBcH = Math.max(60, Math.min(rh - marginDots * 2 - (compact ? 0 : pFont + 8), Math.round(rh * 0.65)))
      const finalBcH = bcHeight > 0 ? Math.max(10, bcHeight) : autoBcH
      const bcShowVal = bcShowValue !== false ? "Y" : "N"
      const bcTextFS = bcValFS > 0 ? bcValFS : Math.round(finalBcH * 0.3)
      const estPriceW = Math.round(pFont * String(displayPrice).length * 0.55)

      function addPrice(priceX: number, priceY: number) {
        block += `^FO${priceX},${priceY}\n`
        block += `^A${fn},${pFont},${pFont}\n^FD${escZPL(displayPrice)}^FS\n\n`
      }

      function pricePos(bcLeft: number, bcTop: number, bcW: number, bcH: number) {
        if (!price) return
        const pGapDots = Math.round(priceGap * DPI)
        function alignX(): number {
          if (pricePosition === "left") return bcLeft - estPriceW - pGapDots
          if (pricePosition === "right") return bcLeft + bcW + pGapDots
          switch (priceAlign) {
            case "left": return bcLeft
            case "right": return bcLeft + bcW - estPriceW
            default: return bcLeft + Math.round(bcW / 2) - Math.round(estPriceW / 2)
          }
        }
        function alignY(): number {
          if (pricePosition === "above") return bcTop - pFont - pGapDots
          if (pricePosition === "below") return bcTop + bcH + pGapDots
          return bcTop + Math.round(bcH * 0.4)
        }
        addPrice(alignX(), alignY())
      }

      if (bcType === "qrcode") {
        const qrW = Math.round(cw * 0.5)
        const qrMag = Math.max(2, Math.min(8, Math.round(cw / 140)))
        const bcLeft = xOff + marginDots + bcOffXD + Math.round((availW - qrW) / 2)
        const bcTop = y + bcOffYD
        block += `^FO${bcLeft},${bcTop}\n^BQN,2,${qrMag}\n^FDQA,${escZPL(bcVal)}^FS\n\n`
        pricePos(bcLeft, bcTop, qrW, finalBcH)
      } else if (bcType === "ean13") {
        const ean = getEAN13Digits(bcVal) || bcVal.replace(/\D/g, "").padEnd(12, "0").slice(0, 12)
        const eanW = 220
        const centerOff = Math.max(0, Math.floor((availW - eanW) / 2))
        const mw = bcModuleWidth > 0 ? Math.max(1, bcModuleWidth) : 2
        const bcLeft = xOff + marginDots + centerOff + bcOffXD
        const bcTop = y + bcOffYD
        block += `^BY${mw},3\n^FO${bcLeft},${bcTop}\n^A${fn},${bcTextFS},${bcTextFS}\n^BEN,${finalBcH},${bcShowVal},N\n^FD${escZPL(ean)}^FS\n\n`
        pricePos(bcLeft, bcTop, eanW, finalBcH)
      } else {
        const estModules = (bcVal.length * 11) + 35
        let moduleW = bcModuleWidth > 0 ? Math.max(1, bcModuleWidth) : Math.max(1, Math.min(3, Math.floor((availW - 8) / Math.max(estModules, 50))))
        if (bcModuleWidth <= 0) {
          while (moduleW < 3 && (moduleW + 1) * Math.max(estModules, 50) + 8 <= availW) moduleW++
        }
        const bcW = estModules * moduleW
        const centerOff = Math.max(0, Math.floor((availW - bcW) / 2))
        const bcLeft = xOff + marginDots + centerOff + bcOffXD
        const bcTop = y + bcOffYD
        block += `^BY${moduleW},3\n^FO${bcLeft},${bcTop}\n^A${fn},${bcTextFS},${bcTextFS}\n^BCN,${finalBcH},${bcShowVal},N,N\n^FD${escZPL(bcVal)}^FS\n\n`
        pricePos(bcLeft, bcTop, bcW, finalBcH)
      }
      return block
    }

    const colWidth = Math.round(labelW * DPI)
    const gapXDots = Math.round(gapX * DPI)
    const rowHeight = Math.round(labelH * DPI)
    const gapYDots = Math.round(gapY * DPI)
    const totalW = cols * colWidth + (cols - 1) * gapXDots
    const totalH = rowHeight * rowsPerSheet + (rowsPerSheet - 1) * gapYDots

    const sheets: (LabelItem | null)[][] = []
    if (items.length === 0) sheets.push([])
    else for (let i = 0; i < items.length; i += rowsPerSheet) sheets.push(items.slice(i, i + rowsPerSheet))

    let full = ""
    for (const sheet of sheets) {
      let zpl = "^XA\n^CI28\n"
      zpl += `^PW${totalW}\n^LL${totalH}\n\n`
      for (let row = 0; row < rowsPerSheet; row++) {
        const item = sheet[row] || null
        const yOff = row * (rowHeight + gapYDots)
        for (let col = 0; col < cols; col++) {
          const xOff = col * (colWidth + gapXDots)
          zpl += labelZPL(xOff, yOff, colWidth, rowHeight, item)
        }
      }
      zpl += `^PQ${copies},0,1,Y\n^XZ\n\n`
      full += zpl
    }
    return full
  }, [items, labelW, labelH, cols, rowsPerSheet, gapX, gapY, copies, bcType, compact, bcOffsetX, bcOffsetY,
      priceFontSize, priceFont, pricePosition, priceAlign, priceGap, bcHeight, bcModuleWidth, bcShowValue, bcValueFontSize])

  // ── Derive ZPL code (memoized) ──
  const zplCode = useMemo(() => {
    if (!initialized) return ""
    return buildZPL()
  }, [initialized, buildZPL])

  // ── Item handlers ──
  function updateItem(idx: number, field: keyof LabelItem, value: string) {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it))
  }

  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  function addItem() {
    setItems(prev => [...prev, { price: "", barcode: "" }])
  }

  // ── Printer ──
  async function connectDefaultPrinter(): Promise<boolean> {
    setPrinterStatus("connecting")
    try {
      const res = await fetch(`${BP_URL}/default?type=printer`)
      if (!res.ok) throw new Error("Tidak dapat terhubung")
      const dev = await res.json()
      if (!dev?.name) throw new Error("Printer default tidak ditemukan")
      setPrinterStatus("on")
      setPrinterName(dev.name)
      addLog(`Printer default: ${dev.name}`, "ok")
      return true
    } catch (err) {
      setPrinterStatus("off")
      setPrinterName("")
      addLog(`Gagal: ${err instanceof Error ? err.message : String(err)}`, "err")
      addLog("Pastikan Zebra Browser Print berjalan (system tray) dan printer ZD230 USB menyala.")
      tryListAvailable()
      return false
    }
  }

  async function tryListAvailable() {
    try {
      const res = await fetch(`${BP_URL}/available`)
      if (!res.ok) return
      const data = await res.json()
      const list: PrinterDevice[] = (data?.printer) || []
      if (list.length > 0) {
        setAvailableDevices(list)
        setSelectedDeviceIdx(0)
        setPrinterStatus("on")
        setPrinterName(list[0].name)
        addLog(`Ditemukan ${list.length} printer`, "ok")
      }
    } catch { /* ignore */ }
  }

  async function handlePrint() {
    const zpl = buildZPL()
    if (!zpl) return
    if (printerStatus !== "on") {
      addLog("Mencari printer…")
      const connected = await connectDefaultPrinter()
      if (!connected) { addLog("Printer belum siap.", "err"); return }
    }
    setPrinting(true)
    addLog("Mengirim ke printer…")
    try {
      const device = availableDevices.length > 0 ? availableDevices[selectedDeviceIdx] : { name: printerName, uid: "" }
      const res = await fetch(`${BP_URL}/write`, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: JSON.stringify({ device, data: zpl }),
      })
      if (!res.ok) throw new Error("Gagal mengirim")
      addLog(`Berhasil: ${items.length} item × ${copies} kopi`, "ok")
    } catch (err) {
      addLog(`Cetak gagal: ${err instanceof Error ? err.message : String(err)}`, "err")
      addLog("Coba: pastikan Zebra Browser Print berjalan & kabel USB tersambung.")
    } finally { setPrinting(false) }
  }

  function handleDownload() {
    const zpl = buildZPL()
    const blob = new Blob([zpl], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "barcode.zpl"
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    addLog("File .ZPL diunduh.", "ok")
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(buildZPL())
      addLog("Kode ZPL disalin ke clipboard.", "ok")
    } catch { addLog("Gagal menyalin otomatis.", "err") }
  }

  // ── Alignment Test ──
  function buildAlignmentZPL(): string {
    const cw = Math.round(labelW * DPI)
    const rh = Math.round(labelH * DPI)
    const totalW = cols * cw + (cols - 1) * Math.round(gapX * DPI)
    const totalH = rh * rowsPerSheet + (rowsPerSheet - 1) * Math.round(gapY * DPI)
    const cx = Math.round(cw / 2)
    const cy = Math.round(rh / 2)
    let zpl = "^XA\n^CI28\n^LS0\n"
    zpl += `^PW${totalW}\n^LL${totalH}\n\n`
    for (let row = 0; row < rowsPerSheet; row++) {
      const yOff = row * (rh + Math.round(gapY * DPI))
      for (let col = 0; col < cols; col++) {
        const xOff = col * (cw + Math.round(gapX * DPI))
        for (const [hx, hy] of [[4, 4], [cw - 4, 4], [4, rh - 4], [cw - 4, rh - 4], [cx, cy]]) {
          zpl += `^FO${xOff + hx - 10},${yOff + hy - 1}\n^A0N,8,8\n^FD+^FS\n`
          zpl += `^FO${xOff + hx - 1},${yOff + hy - 6}\n^GB2,12,2,B,0\n^FS\n`
          zpl += `^FO${xOff + hx - 6},${yOff + hy - 1}\n^GB12,2,2,B,0\n^FS\n`
        }
        zpl += `^FO${xOff + 2},${yOff + 2}\n^GB${cw - 4},${rh - 4},2,B,0\n^FS\n`
        const m = 16
        zpl += `^FO${xOff + m},${yOff + m}\n^GB${cw - m * 2},${rh - m * 2},1,B,0\n^FS\n`
        zpl += `^FO${xOff + cx - Math.round(cw * 0.15)},${yOff + cy - 12}\n^A0N,16,16\n^FD${labelW}x${labelH}mm^FS\n`
      }
    }
    zpl += `^PQ1,0,1,Y\n^XZ`
    return zpl
  }

  async function handlePrintAlignment() {
    const zpl = buildAlignmentZPL()
    if (printerStatus !== "on") {
      addLog("Mencari printer…")
      const connected = await connectDefaultPrinter()
      if (!connected) { addLog("Printer belum siap.", "err"); return }
    }
    setPrinting(true)
    try {
      const device = availableDevices.length > 0 ? availableDevices[selectedDeviceIdx] : { name: printerName, uid: "" }
      const res = await fetch(`${BP_URL}/write`, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: JSON.stringify({ device, data: zpl }),
      })
      if (!res.ok) throw new Error("Gagal")
      addLog("Kalibrasi terkirim. Periksa posisi crosshair di label.", "ok")
    } catch (err) {
      addLog(`Kalibrasi gagal: ${err instanceof Error ? err.message : String(err)}`, "err")
    } finally { setPrinting(false) }
  }

  // ── Derived ──
  const totalItems = items.length
  const copiesTotal = totalItems * copies
  const gridGapX = gapX * previewScale
  const gridGapY = gapY * previewScale
  const previewW = labelW * previewScale
  const previewH = labelH * previewScale

  const bcHintText = bcType === "ean13"
    ? "Wajib 12–13 digit angka."
    : bcType === "qrcode"
    ? "Bisa teks, URL, atau kode apa saja."
    : "Boleh huruf, angka, dan simbol."

  // ── Render ──
  return (
    <DashboardShell title="Cetak Label Barcode">
      <div className="flex h-[calc(100vh-4rem)] -m-6">
        <div className="w-[380px] shrink-0 border-r overflow-y-auto p-5 space-y-4">
          <button onClick={() => router.push("/products")} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-1">
            <ChevronLeft className="h-3.5 w-3.5" /> Kembali ke Produk
          </button>

          {/* ── Items ── */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Daftar Item</h3>
              <div className="flex-1 border-t" />
            </div>
            <div className="grid gap-1.5 mb-1.5 px-1 text-[10px] uppercase tracking-wider text-muted-foreground font-medium grid-cols-[20px_1fr_1fr_24px]">
              <span>#</span><span>Harga</span><span>Barcode</span><span />
            </div>
            <div className="space-y-1.5 max-h-[320px] overflow-y-auto">
              {items.map((item, idx) => (
                <div key={idx} className="grid gap-1.5 grid-cols-[20px_1fr_1fr_24px]">
                  <span className="text-[11px] text-muted-foreground text-center leading-8">{idx + 1}</span>
                  <Input className="h-8 text-xs px-2" value={item.price} onChange={(e) => updateItem(idx, "price", e.target.value)} placeholder="Rp 0" maxLength={16} />
                  <Input className="h-8 text-xs px-2 font-mono" value={item.barcode} onChange={(e) => updateItem(idx, "barcode", e.target.value)} placeholder="Nilai barcode" />
                  <button onClick={() => removeItem(idx)} className="h-8 w-6 inline-flex items-center justify-center text-destructive hover:bg-destructive/10 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={addItem} className="mt-2 h-7 text-xs w-full"><Plus className="h-3 w-3 mr-1" /> Tambah Item</Button>
          </div>

          {/* ── Barcode Settings ── */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Barcode</h3>
              <div className="flex-1 border-t" />
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Jenis Barcode</Label>
                <Select value={bcType} onValueChange={(v) => v && setBcType(v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="code128">Code 128</SelectItem>
                    <SelectItem value="ean13">EAN-13</SelectItem>
                    <SelectItem value="qrcode">QR Code</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">{bcHintText}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Geser X (mm)</Label>
                  <Input type="number" className="h-8 text-xs" value={bcOffsetX} onChange={(e) => setBcOffsetX(parseFloat(e.target.value) || 0)} step={0.5} min={-30} max={30} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Geser Y (mm)</Label>
                  <Input type="number" className="h-8 text-xs" value={bcOffsetY} onChange={(e) => setBcOffsetY(parseFloat(e.target.value) || 0)} step={0.5} min={-30} max={30} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Tinggi Barcode (dots)</Label>
                  <Input type="number" className="h-8 text-xs" value={bcHeight} onChange={(e) => setBcHeight(Math.max(0, Math.min(500, parseInt(e.target.value) || 0)))} step={10} min={0} max={500} />
                  <p className="text-[10px] text-muted-foreground">0 = otomatis. Min ZPL 10.</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Lebar Modul (dots)</Label>
                  <Input type="number" className="h-8 text-xs" value={bcModuleWidth} onChange={(e) => setBcModuleWidth(Math.max(0, Math.min(5, parseInt(e.target.value) || 0)))} step={1} min={0} max={5} />
                  <p className="text-[10px] text-muted-foreground">0 = otomatis. Min ZPL 1.</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox id="bcShowValue" checked={bcShowValue} onCheckedChange={(v) => setBcShowValue(v === true)} />
                <Label htmlFor="bcShowValue" className="text-xs text-muted-foreground cursor-pointer">Tampilkan teks nilai barcode</Label>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Font Nilai Barcode (dots)</Label>
                <Input type="number" className="h-8 text-xs" value={bcValueFontSize} onChange={(e) => setBcValueFontSize(Math.max(0, Math.min(50, parseInt(e.target.value) || 0)))} step={1} min={0} max={50} />
                <p className="text-[10px] text-muted-foreground">0 = otomatis proporsional.</p>
              </div>
            </div>
          </div>

          {/* ── Price Text Settings ── */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Teks Harga</h3>
              <div className="flex-1 border-t" />
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Jenis Font</Label>
                  <Select value={priceFont} onValueChange={(v) => v && setPriceFont(v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sans-serif">Sans-serif (default)</SelectItem>
                      <SelectItem value="serif">Serif</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">Font serif perlu diupload ke printer.</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Ukuran Font (dots)</Label>
                  <Input type="number" className="h-8 text-xs" value={priceFontSize} onChange={(e) => setPriceFontSize(Math.max(8, Math.min(50, parseInt(e.target.value) || 28)))} step={1} min={8} max={50} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Posisi Harga</Label>
                <Select value={pricePosition} onValueChange={(v) => v && setPricePosition(v as typeof pricePosition)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="right">Kanan barcode</SelectItem>
                    <SelectItem value="left">Kiri barcode</SelectItem>
                    <SelectItem value="above">Atas barcode</SelectItem>
                    <SelectItem value="below">Bawah barcode</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">Posisi "Atas" dan "Bawah" bisa diatur ratanya di bawah.</p>
              </div>

              {(pricePosition === "above" || pricePosition === "below") && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Rata Harga</Label>
                    <Select value={priceAlign} onValueChange={(v) => v && setPriceAlign(v as typeof priceAlign)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Kiri</SelectItem>
                        <SelectItem value="center">Tengah</SelectItem>
                        <SelectItem value="right">Kanan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Jarak (mm)</Label>
                    <Input type="number" className="h-8 text-xs" value={priceGap} onChange={(e) => setPriceGap(Math.max(0, parseFloat(e.target.value) || 1))} step={0.5} min={0} max={20} />
                    <p className="text-[10px] text-muted-foreground">Jarak vertikal barcode ↔ harga.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Label Size ── */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ukuran Label</h3>
              <div className="flex-1 border-t" />
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Preset Ukuran</Label>
                <Select value={sizePreset} onValueChange={(v) => { if (!v) return; setSizePreset(v); if (v !== "custom" && v === "33x15") { setCols(3); setGapX(2); setGapY(4) } }}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="33x15">33 × 15 mm — label kecil</SelectItem>
                    <SelectItem value="50x30">50 × 30 mm — label produk kecil</SelectItem>
                    <SelectItem value="40x30">40 × 30 mm</SelectItem>
                    <SelectItem value="58x40">58 × 40 mm</SelectItem>
                    <SelectItem value="100x50">100 × 50 mm — label besar</SelectItem>
                    <SelectItem value="custom">Kustom&hellip;</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {isCustom && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1"><Label className="text-xs text-muted-foreground">Lebar (mm)</Label><Input type="number" className="h-8 text-xs" value={customW} onChange={(e) => setCustomW(parseFloat(e.target.value) || 50)} min={10} max={150} /></div>
                  <div className="space-y-1"><Label className="text-xs text-muted-foreground">Tinggi (mm)</Label><Input type="number" className="h-8 text-xs" value={customH} onChange={(e) => setCustomH(parseFloat(e.target.value) || 30)} min={8} max={150} /></div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1"><Label className="text-xs text-muted-foreground">Jumlah Kolom</Label><Input type="number" className="h-8 text-xs" value={cols} onChange={(e) => setCols(Math.max(1, parseInt(e.target.value) || 1))} min={1} max={8} /></div>
                <div className="space-y-1"><Label className="text-xs text-muted-foreground">Baris/Lembar</Label><Input type="number" className="h-8 text-xs" value={rowsPerSheet} onChange={(e) => setRowsPerSheet(Math.max(1, parseInt(e.target.value) || 1))} min={1} max={200} /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1"><Label className="text-xs text-muted-foreground">Gap Kolom (mm)</Label><Input type="number" className="h-8 text-xs" value={gapX} onChange={(e) => setGapX(Math.max(0, parseFloat(e.target.value) || 0))} step={0.5} min={0} max={20} /></div>
                <div className="space-y-1"><Label className="text-xs text-muted-foreground">Gap Baris (mm)</Label><Input type="number" className="h-8 text-xs" value={gapY} onChange={(e) => setGapY(Math.max(0, parseFloat(e.target.value) || 0))} step={0.5} min={0} max={20} /></div>
              </div>
              <p className="text-[10px] text-muted-foreground">Total: {totalItems} item × {copies} kopi = {copiesTotal} label</p>
              <p className="text-[10px] text-muted-foreground">Untuk label die-cut roll, gap baris dikontrol oleh sensor printer (kalibrasi sekali). Setting Gap Baris hanya untuk multi-baris di lembaran continuous.</p>
              <div className="space-y-1"><Label className="text-xs text-muted-foreground">Jumlah Cetak (kopi)</Label><Input type="number" className="h-8 text-xs" value={copies} onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))} min={1} max={500} /></div>
            </div>
          </div>

          {/* ── Actions ── */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cetak</h3>
              <div className="flex-1 border-t" />
            </div>
            <div className="space-y-2">
              <Button onClick={handlePrint} disabled={printing} className="w-full h-9 text-sm gap-2">
                <Printer className="h-4 w-4" /> {printing ? "Mengirim…" : "Cetak ke Printer"}
              </Button>
              <div className="flex items-center gap-2">
                <Badge variant={printerStatus === "on" ? "default" : "secondary"} className="text-[10px] px-2 py-0 h-5 shrink-0">
                  {printerStatus === "on" ? "Terhubung" : printerStatus === "connecting" ? "Menghubungi…" : "Offline"}
                </Badge>
                <span className="text-[10px] text-muted-foreground truncate">{printerName || "—"}</span>
              </div>
              <Button variant="outline" size="sm" onClick={connectDefaultPrinter} className="w-full h-7 text-xs gap-1"><Search className="h-3 w-3" /> Cari Ulang Printer</Button>
              {availableDevices.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Pilih Printer</Label>
                  <select className="w-full h-8 text-xs bg-background border rounded-md px-2" value={selectedDeviceIdx} onChange={(e) => { const idx = parseInt(e.target.value); setSelectedDeviceIdx(idx); setPrinterName(availableDevices[idx]?.name || "") }}>
                    {availableDevices.map((d, i) => (<option key={i} value={i}>{d.name}</option>))}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={handleDownload} className="h-8 text-xs gap-1"><Download className="h-3.5 w-3.5" /> Unduh .ZPL</Button>
                <Button variant="outline" size="sm" onClick={handleCopy} className="h-8 text-xs gap-1"><Copy className="h-3.5 w-3.5" /> Salin ZPL</Button>
              </div>
              <Button variant="outline" size="sm" onClick={handlePrintAlignment} disabled={printing} className="w-full h-7 text-xs gap-1 text-amber-600 border-amber-300 hover:bg-amber-50">
                ⊞ Cetak Kalibrasi
              </Button>
            </div>
            <PrintLog logs={logs} />
            <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
              Butuh <strong>Zebra Browser Print</strong> terinstall &amp; berjalan.
            </p>
          </div>
        </div>

        {/* ── Right Panel: Preview ── */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-muted/30 via-background to-muted/20 p-6 flex flex-col items-center">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-4 self-start">
            Pratinjau Label — Skala Layar
          </div>

          <div ref={previewRef} className="grid gap-0" style={{ gridTemplateColumns: `repeat(${cols}, ${previewW}px)`, gap: `${gridGapY}px ${gridGapX}px` }}>
            {Array.from({ length: rowsPerSheet }).map((_, rowIdx) =>
              Array.from({ length: cols }).map((_, colIdx) => {
                const item = items[rowIdx] || null
                const bcVal = item?.barcode || ""
                const estModules = (bcVal.length * 11) + 35
                let bcModuleWDots = bcModuleWidth > 0 ? bcModuleWidth : Math.max(1, Math.min(3, Math.floor((availWDots - 8) / Math.max(estModules, 50))))
                if (bcModuleWidth <= 0) {
                  while (bcModuleWDots < 3 && (bcModuleWDots + 1) * Math.max(estModules, 50) + 8 <= availWDots) bcModuleWDots++
                }
                const pvRemainH = previewH - zplMarginPx - zplMarginPx
                const bcHeightAuto = Math.max(60, Math.min(Math.round(pvRemainH / previewScale * DPI * 0.85), Math.round(labelH * DPI * 0.65)))
                const bcHeightDotsEst = bcHeight > 0 ? bcHeight : bcHeightAuto
                const pFontEst = priceFontSize > 0 ? priceFontSize : 28
                const priceStr = item?.price ? (item.price.startsWith("Rp") ? item.price : `Rp ${item.price}`) : ""

                return (
                  <div key={`${rowIdx}-${colIdx}`} className="relative" style={{ width: previewW, height: previewH }}>
                    <div className="absolute inset-[1px] rounded-[3px] pointer-events-none" style={{ border: "1.5px dashed rgba(0,0,0,0.12)" }} />
                    <div className="absolute pointer-events-none" style={{ top: zplMarginPx, left: zplMarginPx, width: previewW - zplMarginPx * 2, height: previewH - zplMarginPx * 2, border: "0.5px dotted rgba(200,80,80,0.2)" }} />
                    <div className="absolute bg-white text-[#111] shadow-lg overflow-hidden" style={{ top: 1, left: 1, width: previewW - 2, height: previewH - 2, opacity: item ? 1 : 0.25 }}>
                      {item ? (
                        <div style={{ position: "relative", width: "100%", height: "100%", padding: zplMarginPx }}>
                          <div className="absolute" style={{ top: bcOffPxY, left: "50%", transform: `translate(calc(-50% + ${bcOffPxX}px), 0)` }}>
                            <BarcodeCell value={item.barcode} type={bcType} moduleWidth={bcModuleWDots} heightDots={bcHeightDotsEst} compact={compact}
                              bcModuleWidth={bcModuleWidth} bcHeight={bcHeight} bcShowValue={bcShowValue} bcValueFontSize={bcValueFontSize} />
                          </div>
                          {priceStr && (
                            <div className="absolute font-mono text-[#333] whitespace-nowrap" style={{
                              fontSize: pFontEst / DPI * previewScale * 0.75,
                              ...(pricePosition === "right" ? {
                                top: bcOffPxY + bcHeightDotsEst / DPI * previewScale * 0.35,
                                right: zplMarginPx,
                              } : pricePosition === "left" ? {
                                top: bcOffPxY + bcHeightDotsEst / DPI * previewScale * 0.35,
                                left: zplMarginPx,
                              } : pricePosition === "above" ? {
                                top: zplMarginPx,
                                ...(priceAlign === "left" ? { left: zplMarginPx } : priceAlign === "right" ? { right: zplMarginPx } : { left: "50%", transform: "translateX(-50%)" }),
                              } : {
                                top: bcOffPxY + bcHeightDotsEst / DPI * previewScale + priceGap / DPI * previewScale,
                                ...(priceAlign === "left" ? { left: zplMarginPx } : priceAlign === "right" ? { right: zplMarginPx } : { left: "50%", transform: "translateX(-50%)" }),
                              }),
                            }}>
                              {priceStr}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-[10px] text-muted-foreground">(kosong)</div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="text-[10px] text-muted-foreground mt-3">
            {labelW} × {labelH} mm per label · {cols} kolom × {rowsPerSheet} baris per lembar · 203 dpi
          </div>

          <div className="w-full max-w-[520px] mt-5">
            <button onClick={() => setZplShown(!zplShown)} className="w-full flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground pb-2 border-b">
              <span>Kode ZPL yang dikirim ke printer</span>
              {zplShown ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            {zplShown && (
              <pre className="mt-2 text-[10px] leading-relaxed bg-[#0e1116] text-[#a9e7b0] p-3 rounded-md overflow-x-auto whitespace-pre-wrap break-all max-h-[300px] overflow-y-auto">
                {zplCode}
              </pre>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
