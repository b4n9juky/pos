"use client"

import { useState, useRef, useCallback } from "react"
import * as XLSX from "xlsx"
import { Upload, Download, FileSpreadsheet, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "sonner"

interface ImportResult {
  success: number
  failed: number
  errors: { row: number; errors: string[] }[]
}

interface ImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  templateUrl: string
  importUrl: string
  onSuccess?: () => void
}

export function ImportModal({ open, onOpenChange, title, templateUrl, importUrl, onSuccess }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [parsedRows, setParsedRows] = useState<Record<string, unknown>[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((f: File) => {
    setFile(f)
    setResult(null)

    const reader = new FileReader()
    reader.onload = (ev) => {
      const data = new Uint8Array(ev.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: "array" })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" })
      setParsedRows(json)
    }
    reader.readAsArrayBuffer(f)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    handleFile(f)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (!f) return
    handleFile(f)
  }

  const handleImport = async () => {
    if (parsedRows.length === 0) return
    setImporting(true)
    setResult(null)
    try {
      const res = await fetch(importUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: parsedRows }),
      })
      const data: ImportResult = await res.json()
      setResult(data)
      if (data.success > 0 && onSuccess) onSuccess()
      if (data.success > 0) toast.success(`${data.success} ${title.toLowerCase()} imported`)
      if (data.failed > 0) toast.error(`${data.failed} rows failed`)
    } catch {
      toast.error("Import failed")
    } finally {
      setImporting(false)
    }
  }

  const reset = () => {
    setFile(null)
    setParsedRows([])
    setResult(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) reset()
    onOpenChange(open)
  }

  const fileRows = parsedRows.length > 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Import {title}</DialogTitle>
          <DialogDescription>
            Upload an Excel file to bulk import {title.toLowerCase()}. Download the template first to ensure correct format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <a
            href={templateUrl}
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <Download className="h-4 w-4" />
            Download template
          </a>

          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
            />
            {file ? (
              <div className="flex items-center justify-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                <p className="text-sm font-medium">{file.name}</p>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground mt-1">.xlsx or .xls files only</p>
              </>
            )}
          </div>

          {fileRows && !result && (
            <p className="text-sm text-muted-foreground">{parsedRows.length} rows parsed from file</p>
          )}

          {result && (
            <div className="space-y-2 rounded-lg border p-4">
              <div className="flex gap-4 text-sm">
                <span className="flex items-center gap-1.5 text-green-600 font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  {result.success} imported
                </span>
                {result.failed > 0 && (
                  <span className="flex items-center gap-1.5 text-destructive font-medium">
                    <XCircle className="h-4 w-4" />
                    {result.failed} failed
                  </span>
                )}
              </div>
              {result.errors.length > 0 && (
                <div className="max-h-40 overflow-y-auto rounded border bg-muted/50 p-2 text-xs space-y-1 font-mono">
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-destructive">
                      Row {e.row}: {e.errors.join("; ")}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {result ? "Done" : "Cancel"}
          </Button>
          {fileRows && !result && (
            <Button onClick={handleImport} disabled={importing}>
              {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {importing ? "Importing..." : `Import ${parsedRows.length} rows`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
