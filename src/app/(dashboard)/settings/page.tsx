"use client"

import { useState, useEffect, useRef } from "react"
import { Store, User, Save, Percent, Plus, Edit, Printer, RotateCw, Building2, Receipt, Shield, Users as UsersIcon, Gem, Trash2, AlertTriangle, Database, Download, Upload } from "lucide-react"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { t } from "@/lib/translate"

function RoleBadge({ role }: { role: string }) {
  const cls = role === "admin"
    ? "bg-primary/10 text-primary"
    : "bg-secondary text-secondary-foreground"
  return <span className={`inline-flex h-5 items-center rounded-full px-2 text-xs font-medium ${cls}`}>{role}</span>
}

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()

  const [storeName, setStoreName] = useState("")
  const [storeAddress, setStoreAddress] = useState("")
  const [storePhone, setStorePhone] = useState("")
  const [storeEmail, setStoreEmail] = useState("")
  const [currency, setCurrency] = useState("IDR")
  const [receiptFooter, setReceiptFooter] = useState("")
  const [autoPrint, setAutoPrint] = useState(true)
  const [savingStore, setSavingStore] = useState(false)

  const [taxName, setTaxName] = useState("PPN")
  const [taxRate, setTaxRate] = useState("10")
  const [taxDefault, setTaxDefault] = useState(true)
  const [savingTax, setSavingTax] = useState(false)

  const [userDialog, setUserDialog] = useState(false)
  const [editUserId, setEditUserId] = useState<number | null>(null)
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [userPassword, setUserPassword] = useState("")
  const [userRole, setUserRole] = useState<string>("cashier")
  const [savingUser, setSavingUser] = useState(false)

  const [printerName, setPrinterName] = useState("")
  const [printerPaperWidth, setPrinterPaperWidth] = useState(58)
  const [printerAutoCut, setPrinterAutoCut] = useState(true)
  const [printerEnabled, setPrinterEnabled] = useState(false)
  const [printerConnectionType, setPrinterConnectionType] = useState("usb")
  const [savingPrinter, setSavingPrinter] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [detectedPrinters, setDetectedPrinters] = useState<string[]>([])
  const [testingPrint, setTestingPrint] = useState(false)

  const [membershipEnabled, setMembershipEnabled] = useState(true)
  const [membershipThreshold, setMembershipThreshold] = useState("50000")
  const [pointsPerAmount, setPointsPerAmount] = useState("1")
  const [pointsPerUnit, setPointsPerUnit] = useState("1000")
  const [savingMembership, setSavingMembership] = useState(false)

  const [resetDialog, setResetDialog] = useState(false)
  const [resetting, setResetting] = useState(false)

  const [restoreFile, setRestoreFile] = useState<File | null>(null)
  const [restoreDialog, setRestoreDialog] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const restoreInputRef = useRef<HTMLInputElement>(null)

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => fetch("/api/settings").then((r) => r.json()),
  })

  const { data: taxSettings } = useQuery({
    queryKey: ["tax-settings"],
    queryFn: () => fetch("/api/tax-settings").then((r) => r.json()),
  })

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => fetch("/api/users").then((r) => r.json()),
  })

  useEffect(() => {
    if (settings) {
      setStoreName(settings.storeName ?? "")
      setStoreAddress(settings.storeAddress ?? "")
      setStorePhone(settings.storePhone ?? "")
      setStoreEmail(settings.storeEmail ?? "")
      setCurrency(settings.currency ?? "IDR")
      setReceiptFooter(settings.receiptFooter ?? "")
      setAutoPrint(settings.autoPrint ?? true)
      setMembershipEnabled(settings.membershipEnabled ?? true)
      setMembershipThreshold(String(settings.membershipThreshold ?? 50000))
      setPointsPerAmount(String(settings.pointsPerAmount ?? 1))
      setPointsPerUnit(String(settings.pointsPerUnit ?? 1000))
    }
  }, [settings])

  useEffect(() => {
    if (taxSettings?.length) {
      const def = taxSettings.find((t: any) => t.isDefault) ?? taxSettings[0]
      setTaxName(def.name ?? "PPN")
      setTaxRate(String(def.rate ?? 10))
      setTaxDefault(def.isDefault ?? true)
    }
  }, [taxSettings])

  useEffect(() => {
    fetch("/api/printer")
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setPrinterName(data.printerName ?? "")
          setPrinterPaperWidth(data.paperWidth ?? 58)
          setPrinterAutoCut(data.autoCut ?? true)
          setPrinterEnabled(data.enabled ?? false)
          setPrinterConnectionType(data.connectionType ?? "usb")
        }
      })
      .catch(() => {})
  }, [])

  const handleDetectPrinters = async () => {
    setDetecting(true)
    setDetectedPrinters([])
    try {
      let printers: string[] = []
      if (printerConnectionType === "usb") {
        const res = await fetch("http://localhost:8090/detect", { signal: AbortSignal.timeout(5000) })
        if (res.ok) {
          const data = await res.json()
          printers = data.printers || []
        } else {
          toast.error(t("Local print agent not responding. Run start-agent.bat"))
        }
      } else {
        const res = await fetch("/api/print-receipt/detect", { signal: AbortSignal.timeout(10000) })
        if (res.ok) {
          const data = await res.json()
          printers = data.printers || []
        } else {
          toast.error(t("Failed to detect printers"))
        }
      }
      setDetectedPrinters(printers)
      if (printers.length === 0) {
        toast.error(t("No printers found."))
      }
    } catch {
      toast.error(t("Failed to detect printers"))
    } finally {
      setDetecting(false)
    }
  }

  const handleTestPrint = async () => {
    if (!printerName) {
      toast.error(t("Select a printer first"))
      return
    }
    setTestingPrint(true)
    try {
      let ok = false
      if (printerConnectionType === "usb") {
        const res = await fetch("http://localhost:8090/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ printerName, paperWidth: printerPaperWidth }),
          signal: AbortSignal.timeout(30000),
        })
        ok = res.ok
      } else {
        const res = await fetch("/api/print-receipt/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ printerName, paperWidth: printerPaperWidth }),
          signal: AbortSignal.timeout(30000),
        })
        ok = res.ok
      }
      if (ok) {
        toast.success(t("Test print sent!"))
      } else {
        toast.error(t("Test print failed"))
      }
    } catch {
      toast.error(t("Test print failed"))
    } finally {
      setTestingPrint(false)
    }
  }

  const handleSavePrinter = async () => {
    setSavingPrinter(true)
    try {
      const res = await fetch("/api/printer", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          printerName: printerName || null,
          connectionType: printerConnectionType,
          paperWidth: printerPaperWidth,
          autoCut: printerAutoCut,
          enabled: printerEnabled,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success(t("Printer settings saved"))
      queryClient.invalidateQueries({ queryKey: ["printer"] })
    } catch {
      toast.error(t("Failed to save printer settings"))
    } finally {
      setSavingPrinter(false)
    }
  }

  const handleSaveStore = async () => {
    setSavingStore(true)
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName,
          storeAddress: storeAddress || null,
          storePhone: storePhone || null,
          storeEmail: storeEmail || null,
          taxRate: Number(taxRate),
          currency,
          receiptFooter: receiptFooter || null,
          autoPrint,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success(t("Store settings saved"))
      queryClient.invalidateQueries({ queryKey: ["settings"] })
    } catch {
      toast.error(t("Failed to save settings"))
    } finally {
      setSavingStore(false)
    }
  }

  const handleSaveMembership = async () => {
    setSavingMembership(true)
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName,
          storeAddress: storeAddress || null,
          storePhone: storePhone || null,
          storeEmail: storeEmail || null,
          taxRate: Number(taxRate),
          currency,
          receiptFooter: receiptFooter || null,
          autoPrint,
          membershipEnabled,
          membershipThreshold: Number(membershipThreshold),
          pointsPerAmount: Number(pointsPerAmount),
          pointsPerUnit: Number(pointsPerUnit),
        }),
      })
      if (!res.ok) throw new Error()
      toast.success(t("Membership settings saved"))
      queryClient.invalidateQueries({ queryKey: ["settings"] })
    } catch {
      toast.error(t("Failed to save membership settings"))
    } finally {
      setSavingMembership(false)
    }
  }

  const handleSaveTax = async () => {
    setSavingTax(true)
    try {
      const res = await fetch("/api/tax-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: taxName,
          rate: Number(taxRate),
          type: "percentage",
          isDefault: taxDefault,
          active: true,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success(t("Tax setting saved"))
      queryClient.invalidateQueries({ queryKey: ["tax-settings"] })
      queryClient.invalidateQueries({ queryKey: ["default-tax-rate"] })
    } catch {
      toast.error(t("Failed to save tax setting"))
    } finally {
      setSavingTax(false)
    }
  }

  const openAddUser = () => {
    setEditUserId(null)
    setUserName("")
    setUserEmail("")
    setUserPassword("")
    setUserRole("cashier")
    setUserDialog(true)
  }

  const openEditUser = (user: any) => {
    setEditUserId(user.id)
    setUserName(user.name)
    setUserEmail(user.email)
    setUserPassword("")
    setUserRole(user.role)
    setUserDialog(true)
  }

  const handleSaveUser = async () => {
    setSavingUser(true)
    try {
      if (editUserId) {
        const body: any = { name: userName, email: userEmail, role: userRole }
        if (userPassword) body.password = userPassword
        const res = await fetch(`/api/users/${editUserId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error()
        toast.success(t("User updated"))
      } else {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: userName, email: userEmail, password: userPassword, role: userRole }),
        })
        if (!res.ok) throw new Error()
        toast.success(t("User created"))
      }
      queryClient.invalidateQueries({ queryKey: ["users"] })
      setUserDialog(false)
    } catch {
      toast.error(t("Failed to save user"))
    } finally {
      setSavingUser(false)
    }
  }

  const handleReset = async () => {
    setResetting(true)
    try {
      const res = await fetch("/api/reset", { method: "POST" })
      if (!res.ok) throw new Error()
      toast.success(t("Data reset successfully"))
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["orders"] })
      queryClient.invalidateQueries({ queryKey: ["reports"] })
      setResetDialog(false)
    } catch {
      toast.error(t("Reset failed"))
    } finally {
      setResetting(false)
    }
  }

  const handleRestore = async () => {
    if (!restoreFile) return
    setRestoring(true)
    try {
      const formData = new FormData()
      formData.append("file", restoreFile)
      const res = await fetch("/api/backup/restore", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Unknown error")
      toast.success(t("Database restored successfully"))
      setRestoreDialog(false)
      setRestoreFile(null)
      queryClient.invalidateQueries()
    } catch (e: any) {
      toast.error(e.message || t("Failed to restore database"))
    } finally {
      setRestoring(false)
    }
  }

  const handleToggleActive = async (userId: number) => {
    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(t("User status toggled"))
      queryClient.invalidateQueries({ queryKey: ["users"] })
    } catch (e: any) {
      toast.error(e.message || t("Failed to toggle user status"))
    }
  }

  if (isLoading) {
    return (
      <DashboardShell title={t("Settings")}>
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm">{t("Loading...")}</span>
          </div>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell title={t("Settings")}>
      <div className="space-y-6 max-w-3xl">
        <Card className="shadow-sm border-muted/80">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                <Building2 className="h-4 w-4 text-emerald-600" />
              </div>
              <CardTitle className="text-base">{t("Store Settings")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="store-name" className="text-sm font-medium">{t("Store Name")}</Label>
                <Input id="store-name" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency" className="text-sm font-medium">{t("Currency")}</Label>
                <Input id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium">{t("Address")}</Label>
              <Input id="address" value={storeAddress} onChange={(e) => setStoreAddress(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">{t("Phone")}</Label>
                <Input id="phone" value={storePhone} onChange={(e) => setStorePhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">{t("Email")}</Label>
                <Input id="email" type="email" value={storeEmail} onChange={(e) => setStoreEmail(e.target.value)} placeholder={t("store@example.com")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="footer" className="text-sm font-medium">{t("Receipt Footer")}</Label>
              <Textarea id="footer" value={receiptFooter} onChange={(e) => setReceiptFooter(e.target.value)} placeholder={t("Thank you for your purchase!")} className="resize-none" />
            </div>
            <div className="flex items-center gap-3">
              <Switch id="auto-print" checked={autoPrint} onCheckedChange={setAutoPrint} />
              <Label htmlFor="auto-print" className="text-sm font-medium">{t("Print receipt automatically")}</Label>
            </div>
            <Button onClick={handleSaveStore} disabled={savingStore} className="shadow-sm">
              <Save className="mr-2 h-4 w-4" />
              {savingStore ? t("Saving...") : t("Save Settings")}
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-muted/80">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <Percent className="h-4 w-4 text-blue-600" />
              </div>
              <CardTitle className="text-base">{t("Tax Settings")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tax-name" className="text-sm font-medium">{t("Tax Name")}</Label>
                <Input id="tax-name" value={taxName} onChange={(e) => setTaxName(e.target.value)} placeholder={t("PPN")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax-rate" className="text-sm font-medium">{t("Tax Rate (%)")}</Label>
                <Input id="tax-rate" type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="tax-default" checked={taxDefault} onCheckedChange={setTaxDefault} />
              <Label htmlFor="tax-default" className="text-sm font-medium">{t("Set as default tax rate")}</Label>
            </div>
            <Button onClick={handleSaveTax} disabled={savingTax} className="shadow-sm">
              <Save className="mr-2 h-4 w-4" />
              {savingTax ? t("Saving...") : t("Save Tax Setting")}
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-muted/80">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950/30">
                <Printer className="h-4 w-4 text-violet-600" />
              </div>
              <CardTitle className="text-base">{t("Printer Settings")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Switch id="printer-enabled" checked={printerEnabled} onCheckedChange={setPrinterEnabled} />
              <Label htmlFor="printer-enabled" className="text-sm font-medium">{t("Auto-print to thermal printer after payment")}</Label>
            </div>

            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-2">
                <Label htmlFor="printer-name" className="text-sm font-medium">{t("Printer")}</Label>
                {detectedPrinters.length > 0 ? (
                  <Select value={printerName} onValueChange={(v) => v && setPrinterName(v)}>
                    <SelectTrigger id="printer-name">
                      <SelectValue placeholder={t("Select a printer...")} />
                    </SelectTrigger>
                    <SelectContent>
                      {detectedPrinters.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="printer-name"
                    value={printerName}
                    onChange={(e) => setPrinterName(e.target.value)}
                    placeholder={t("Type printer name or click Detect...")}
                  />
                )}
              </div>
              <Button variant="outline" size="sm" onClick={handleDetectPrinters} disabled={detecting} className="h-9">
                {detecting ? <RotateCw className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
                <span className="ml-1.5">{t("Detect")}</span>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paper-width" className="text-sm font-medium">{t("Paper Width")}</Label>
                <Select value={String(printerPaperWidth)} onValueChange={(v) => setPrinterPaperWidth(Number(v))}>
                  <SelectTrigger id="paper-width">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="58">58 mm</SelectItem>
                    <SelectItem value="76">76 mm</SelectItem>
                    <SelectItem value="80">80 mm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2 pb-0.5">
                <div className="flex items-center gap-3">
                  <Label className="text-sm font-medium">{t("Auto Cut")}</Label>
                  <Switch checked={printerAutoCut} onCheckedChange={setPrinterAutoCut} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">{t("Connection Type")}</Label>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="conn-usb"
                    name="connectionType"
                    value="usb"
                    checked={printerConnectionType === "usb"}
                    onChange={() => setPrinterConnectionType("usb")}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="conn-usb" className="text-sm font-normal">
                    {t("USB (Local Printer via Print Agent)")}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="conn-network"
                    name="connectionType"
                    value="network"
                    checked={printerConnectionType === "network"}
                    onChange={() => setPrinterConnectionType("network")}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="conn-network" className="text-sm font-normal">
                    {t("Network (Shared via Server)")}
                  </Label>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSavePrinter} disabled={savingPrinter} className="shadow-sm">
                <Save className="mr-2 h-4 w-4" />
                {savingPrinter ? t("Saving...") : t("Save Printer Settings")}
              </Button>
              <Button variant="outline" onClick={handleTestPrint} disabled={testingPrint || !printerName}>
                {testingPrint ? <RotateCw className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
                {t("Test Print")}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-muted/80">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/30">
                <Gem className="h-4 w-4 text-rose-600" />
              </div>
              <CardTitle className="text-base">{t("Membership Settings")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Switch id="membership-enabled" checked={membershipEnabled} onCheckedChange={setMembershipEnabled} />
              <Label htmlFor="membership-enabled" className="text-sm font-medium">{t("Enable membership points")}</Label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="membership-threshold" className="text-sm font-medium">{t("Min. Purchase (Rp)")}</Label>
                <Input id="membership-threshold" type="number" value={membershipThreshold} onChange={(e) => setMembershipThreshold(e.target.value)} placeholder="50000" />
                <p className="text-[11px] text-muted-foreground">{t("Minimum subtotal to earn points")}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="points-per-unit" className="text-sm font-medium">{t("Points per Rp")}</Label>
                <Input id="points-per-unit" type="number" value={pointsPerUnit} onChange={(e) => setPointsPerUnit(e.target.value)} placeholder="1000" />
                <p className="text-[11px] text-muted-foreground">{t("Every Rp X spent")}</p>
              </div>
            </div>
            <div className="space-y-2 max-w-[calc(50%-0.5rem)]">
              <Label htmlFor="points-per-amount" className="text-sm font-medium">{t("Points per Unit")}</Label>
              <Input id="points-per-amount" type="number" value={pointsPerAmount} onChange={(e) => setPointsPerAmount(e.target.value)} placeholder="1" />
              <p className="text-[11px] text-muted-foreground">{t("Number of points earned per unit")}</p>
            </div>
            <Button onClick={handleSaveMembership} disabled={savingMembership} className="shadow-sm">
              <Save className="mr-2 h-4 w-4" />
              {savingMembership ? t("Saving...") : t("Save Membership Settings")}
            </Button>
          </CardContent>
        </Card>

        {session?.user?.role === "admin" && (
          <Card className="shadow-sm border-destructive/30 border-2">
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </div>
                <CardTitle className="text-base text-destructive">{t("Reset product & order data")}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {t("This will hide all products and orders from the system. The data stays in the database and can be restored by an admin.")}
              </p>
              <Button variant="destructive" onClick={() => setResetDialog(true)} className="shadow-sm">
                <AlertTriangle className="mr-2 h-4 w-4" />
                {t("Reset Data")}
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-sm border-muted/80">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-950/30">
                <Database className="h-4 w-4 text-sky-600" />
              </div>
              <CardTitle className="text-base">{t("Backup Database")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {t("Download a SQL dump of the entire database for safekeeping.")}
            </p>
            <a
              href="/api/backup"
              className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium shadow-sm hover:bg-primary/90 transition-colors"
            >
              <Download className="h-4 w-4" />
              {t("Download Backup")}
            </a>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-muted/80">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/30">
                <Upload className="h-4 w-4 text-orange-600" />
              </div>
              <CardTitle className="text-base">{t("Restore Database")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {t("Upload a previously downloaded SQL backup to restore the database.")}
            </p>
            <div className="flex flex-col gap-3">
              <input
                ref={restoreInputRef}
                type="file"
                accept=".sql"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null
                  setRestoreFile(f)
                }}
              />
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => restoreInputRef.current?.click()}
                  className="shadow-sm"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {restoreFile ? restoreFile.name : t("Select SQL file")}
                </Button>
                {restoreFile && (
                  <Button
                    variant="destructive"
                    onClick={() => setRestoreDialog(true)}
                    disabled={restoring}
                    className="shadow-sm"
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    {restoring ? t("Restoring...") : t("Restore")}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-muted/80">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/30">
                  <UsersIcon className="h-4 w-4 text-amber-600" />
                </div>
                <CardTitle className="text-base">{t("User Management")}</CardTitle>
              </div>
              <Button size="sm" onClick={openAddUser} className="h-8 shadow-sm">
                <Plus className="mr-2 h-4 w-4" />
                {t("Add User")}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-medium">{t("Name")}</TableHead>
                    <TableHead className="font-medium">{t("Email")}</TableHead>
                    <TableHead className="font-medium">{t("Role")}</TableHead>
                    <TableHead className="font-medium">{t("Active")}</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        <div className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          <span className="text-sm">{t("Loading...")}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <User className="h-5 w-5 text-muted-foreground/40" />
                          <p className="text-sm font-medium">{t("No users found")}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user: any) => (
                      <TableRow key={user.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="font-medium text-sm">{user.name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{user.email}</TableCell>
                        <TableCell>
                          <RoleBadge role={user.role} />
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={user.active}
                            disabled={String(user.id) === session?.user?.id}
                            onCheckedChange={() => handleToggleActive(user.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => openEditUser(user)} className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={resetDialog} onOpenChange={setResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              {t("Reset product & order data")}
            </DialogTitle>
            <DialogDescription>
              {t("This will hide all products and orders from the system. The data stays in the database and can be restored by an admin.")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialog(false)} disabled={resetting}>
              {t("Cancel")}
            </Button>
            <Button variant="destructive" onClick={handleReset} disabled={resetting}>
              {resetting ? t("Resetting...") : t("Reset Data")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={restoreDialog} onOpenChange={setRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              {t("Restore Database")}
            </DialogTitle>
            <DialogDescription>
              {t("This will replace ALL current data with the data from the backup file.")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreDialog(false)} disabled={restoring}>
              {t("Cancel")}
            </Button>
            <Button variant="destructive" onClick={handleRestore} disabled={restoring}>
              {restoring ? t("Restoring...") : t("Restore")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={userDialog} onOpenChange={setUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editUserId ? t("Edit User") : t("Add User")}</DialogTitle>
            <DialogDescription>
              {editUserId ? t("Update user details. Leave password blank to keep current.") : t("Create a new user account.")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-name">{t("Name")}</Label>
              <Input id="user-name" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder={t("Full name")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-email">{t("Email")}</Label>
              <Input id="user-email" type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder={t("user@example.com")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-password">
                {t("Password")} {editUserId ? t("(leave blank to keep current)") : ""}
              </Label>
              <Input id="user-password" type="password" value={userPassword} onChange={(e) => setUserPassword(e.target.value)} placeholder={editUserId ? t("New password") : t("Min 6 characters")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-role">{t("Role")}</Label>
              <Select value={userRole} onValueChange={(v) => v && setUserRole(v)}>
                <SelectTrigger id="user-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cashier">{t("Cashier")}</SelectItem>
                  <SelectItem value="warehouse">{t("Gudang")}</SelectItem>
                  <SelectItem value="admin">{t("Admin")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserDialog(false)}>{t("Cancel")}</Button>
            <Button onClick={handleSaveUser} disabled={savingUser || !userName || !userEmail || (!editUserId && !userPassword)}>
              {savingUser ? t("Saving...") : editUserId ? t("Update") : t("Create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}
