"use client"

import { useState } from "react"
import { CircleDollarSign, Clock, Play, Square, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatCurrency, formatDate } from "@/lib/format"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { t } from "@/lib/translate"

export default function RegisterPage() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const [openDialog, setOpenDialog] = useState(false)
  const [openingBalance, setOpeningBalance] = useState("500000")
  const [closingBalance, setClosingBalance] = useState("")
  const [saving, setSaving] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ["registers"],
    queryFn: () => fetch("/api/registers").then((r) => r.json()),
  })

  const registers = data?.registers ?? []
  const activeRegister = data?.active ?? null

  const handleOpen = async () => {
    if (!session?.user?.id) return
    setSaving(true)
    try {
      const res = await fetch("/api/registers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: Number(session.user.id), openingBalance: Number(openingBalance) }),
      })
      if (!res.ok) throw new Error()
      toast.success(t("Register opened"))
      queryClient.invalidateQueries({ queryKey: ["registers"] })
      setOpenDialog(false)
    } catch {
      toast.error(t("Failed to open register"))
    } finally {
      setSaving(false)
    }
  }

  const handleClose = async () => {
    if (!activeRegister) return
    setSaving(true)
    try {
      const res = await fetch(`/api/registers/${activeRegister.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ closingBalance: Number(closingBalance) }),
      })
      if (!res.ok) throw new Error()
      toast.success(t("Register closed"))
      queryClient.invalidateQueries({ queryKey: ["registers"] })
      setOpenDialog(false)
      setClosingBalance("")
    } catch {
      toast.error(t("Failed to close register"))
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardShell title={t("Cash Register")}>
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
    <DashboardShell title={t("Cash Register")}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="shadow-sm border-muted/80">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("Status")}</CardTitle>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${activeRegister ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-muted"}`}>
                <CircleDollarSign className={`h-4 w-4 ${activeRegister ? "text-emerald-600" : "text-muted-foreground"}`} />
              </div>
            </CardHeader>
            <CardContent>
              <Badge variant={activeRegister ? "default" : "secondary"} className="text-xs">
                {activeRegister ? t("Open") : t("Closed")}
              </Badge>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-muted/80">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("Opened By")}</CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">{activeRegister?.user_name || "-"}</p>
              {activeRegister && (
                <p className="text-xs text-muted-foreground mt-0.5">{formatDate(activeRegister.openedAt)}</p>
              )}
            </CardContent>
          </Card>
          <Card className="shadow-sm border-muted/80">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("Opening Balance")}</CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950/30">
                <CircleDollarSign className="h-4 w-4 text-violet-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums">
                {activeRegister ? formatCurrency(activeRegister.openingBalance) : "-"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-3">
          {activeRegister ? (
            <Button variant="destructive" onClick={() => setOpenDialog(true)} className="shadow-sm">
              <Square className="mr-2 h-4 w-4" />
              {t("Close Register")}
            </Button>
          ) : (
            <Button onClick={() => setOpenDialog(true)} className="shadow-sm">
              <Play className="mr-2 h-4 w-4" />
              {t("Open Register")}
            </Button>
          )}
        </div>

        <Card className="shadow-sm border-muted/80">
          <CardHeader className="flex flex-row items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">{t("Register History")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-medium">{t("User")}</TableHead>
                    <TableHead className="font-medium">{t("Opened")}</TableHead>
                    <TableHead className="font-medium">{t("Closed")}</TableHead>
                    <TableHead className="text-right font-medium">{t("Opening")}</TableHead>
                    <TableHead className="text-right font-medium">{t("Closing")}</TableHead>
                    <TableHead className="font-medium">{t("Status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registers.map((reg: any) => (
                    <TableRow key={reg.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="font-medium text-sm">{reg.userName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(reg.openedAt)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{reg.closedAt ? formatDate(reg.closedAt) : <span className="text-muted-foreground/50">-</span>}</TableCell>
                      <TableCell className="text-right tabular-nums text-sm">{formatCurrency(reg.openingBalance)}</TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {reg.closingBalance ? formatCurrency(reg.closingBalance) : <span className="text-muted-foreground/50">-</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={reg.status === "open" ? "default" : "secondary"} className="text-xs capitalize">
                          {t(reg.status)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{activeRegister ? t("Close Register") : t("Open Register")}</DialogTitle>
            <DialogDescription>
              {activeRegister
                ? t("Enter the closing balance to close the register")
                : t("Enter the opening balance to start the register")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("Opening Balance")}</Label>
              <Input
                type="number"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                disabled={!!activeRegister}
              />
            </div>
            {activeRegister && (
              <div className="space-y-2">
                <Label>{t("Closing Balance")}</Label>
                <Input
                  type="number"
                  value={closingBalance}
                  onChange={(e) => setClosingBalance(e.target.value)}
                  placeholder={t("Enter closing balance")}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>{t("Cancel")}</Button>
            <Button onClick={activeRegister ? handleClose : handleOpen} disabled={saving || (activeRegister && !closingBalance)}>
              {saving ? t("Saving...") : activeRegister ? t("Close Register") : t("Open Register")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}
