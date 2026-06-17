"use client"

import { useState } from "react"
import { CircleDollarSign, Clock, Play, Square } from "lucide-react"
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
      toast.success("Register opened")
      queryClient.invalidateQueries({ queryKey: ["registers"] })
      setOpenDialog(false)
    } catch {
      toast.error("Failed to open register")
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
      toast.success("Register closed")
      queryClient.invalidateQueries({ queryKey: ["registers"] })
      setOpenDialog(false)
      setClosingBalance("")
    } catch {
      toast.error("Failed to close register")
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardShell title="Cash Register">
        <p className="text-muted-foreground">Loading...</p>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell title="Cash Register">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant={activeRegister ? "default" : "secondary"}>
                  {activeRegister ? "Open" : "Closed"}
                </Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Opened By</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">{activeRegister?.user_name || "-"}</p>
              {activeRegister && (
                <p className="text-xs text-muted-foreground">{formatDate(activeRegister.openedAt)}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Opening Balance</CardTitle>
              <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {activeRegister ? formatCurrency(activeRegister.openingBalance) : "-"}
              </p>
            </CardContent>
          </Card>
        </div>

        {activeRegister ? (
          <Button variant="destructive" onClick={() => setOpenDialog(true)}>
            <Square className="mr-2 h-4 w-4" />
            Close Register
          </Button>
        ) : (
          <Button onClick={() => setOpenDialog(true)}>
            <Play className="mr-2 h-4 w-4" />
            Open Register
          </Button>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Register History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Opened</TableHead>
                  <TableHead>Closed</TableHead>
                  <TableHead className="text-right">Opening</TableHead>
                  <TableHead className="text-right">Closing</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registers.map((reg: any) => (
                  <TableRow key={reg.id}>
                    <TableCell className="font-medium">{reg.userName}</TableCell>
                    <TableCell className="text-xs">{formatDate(reg.openedAt)}</TableCell>
                    <TableCell className="text-xs">{reg.closedAt ? formatDate(reg.closedAt) : "-"}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(reg.openingBalance)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {reg.closingBalance ? formatCurrency(reg.closingBalance) : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={reg.status === "open" ? "default" : "secondary"}>
                        {reg.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{activeRegister ? "Close Register" : "Open Register"}</DialogTitle>
            <DialogDescription>
              {activeRegister
                ? "Enter the closing balance to close the register"
                : "Enter the opening balance to start the register"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Opening Balance</Label>
              <Input
                type="number"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                disabled={!!activeRegister}
              />
            </div>
            {activeRegister && (
              <div className="space-y-2">
                <Label>Closing Balance</Label>
                <Input
                  type="number"
                  value={closingBalance}
                  onChange={(e) => setClosingBalance(e.target.value)}
                  placeholder="Enter closing balance"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button onClick={activeRegister ? handleClose : handleOpen} disabled={saving || (activeRegister && !closingBalance)}>
              {saving ? "Saving..." : activeRegister ? "Close Register" : "Open Register"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}
