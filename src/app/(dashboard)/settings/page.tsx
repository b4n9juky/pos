"use client"

import { useState, useEffect } from "react"
import { Store, User, Save, Percent, Plus, Edit } from "lucide-react"
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

function RoleBadge({ role }: { role: string }) {
  const cls = role === "admin"
    ? "bg-primary text-primary-foreground"
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
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("Store settings saved")
      queryClient.invalidateQueries({ queryKey: ["settings"] })
    } catch {
      toast.error("Failed to save settings")
    } finally {
      setSavingStore(false)
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
      toast.success("Tax setting saved")
      queryClient.invalidateQueries({ queryKey: ["tax-settings"] })
      queryClient.invalidateQueries({ queryKey: ["default-tax-rate"] })
    } catch {
      toast.error("Failed to save tax setting")
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
        toast.success("User updated")
      } else {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: userName, email: userEmail, password: userPassword, role: userRole }),
        })
        if (!res.ok) throw new Error()
        toast.success("User created")
      }
      queryClient.invalidateQueries({ queryKey: ["users"] })
      setUserDialog(false)
    } catch {
      toast.error("Failed to save user")
    } finally {
      setSavingUser(false)
    }
  }

  const handleToggleActive = async (userId: number) => {
    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("User status toggled")
      queryClient.invalidateQueries({ queryKey: ["users"] })
    } catch (e: any) {
      toast.error(e.message || "Failed to toggle user status")
    }
  }

  if (isLoading) {
    return (
      <DashboardShell title="Settings">
        <p className="text-muted-foreground">Loading...</p>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell title="Settings">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Store Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="store-name">Store Name</Label>
                <Input id="store-name" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={storeAddress} onChange={(e) => setStoreAddress(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={storePhone} onChange={(e) => setStorePhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={storeEmail} onChange={(e) => setStoreEmail(e.target.value)} placeholder="store@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="footer">Receipt Footer</Label>
              <Textarea id="footer" value={receiptFooter} onChange={(e) => setReceiptFooter(e.target.value)} placeholder="Thank you for your purchase!" />
            </div>
            <Button onClick={handleSaveStore} disabled={savingStore}>
              <Save className="mr-2 h-4 w-4" />
              {savingStore ? "Saving..." : "Save Settings"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Tax Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tax-name">Tax Name</Label>
                <Input id="tax-name" value={taxName} onChange={(e) => setTaxName(e.target.value)} placeholder="PPN" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax-rate">Tax Rate (%)</Label>
                <Input id="tax-rate" type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="tax-default" checked={taxDefault} onCheckedChange={setTaxDefault} />
              <Label htmlFor="tax-default">Set as default tax rate</Label>
            </div>
            <Button onClick={handleSaveTax} disabled={savingTax}>
              <Save className="mr-2 h-4 w-4" />
              {savingTax ? "Saving..." : "Save Tax Setting"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <CardTitle>User Management</CardTitle>
              </div>
              <Button size="sm" onClick={openAddUser}>
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
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
                          <Button variant="ghost" size="icon" onClick={() => openEditUser(user)}>
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

      <Dialog open={userDialog} onOpenChange={setUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editUserId ? "Edit User" : "Add User"}</DialogTitle>
            <DialogDescription>
              {editUserId ? "Update user details. Leave password blank to keep current." : "Create a new user account."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-name">Name</Label>
              <Input id="user-name" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Full name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-email">Email</Label>
              <Input id="user-email" type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="user@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-password">
                Password {editUserId ? "(leave blank to keep current)" : ""}
              </Label>
              <Input id="user-password" type="password" value={userPassword} onChange={(e) => setUserPassword(e.target.value)} placeholder={editUserId ? "New password" : "Min 6 characters"} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-role">Role</Label>
              <Select value={userRole} onValueChange={(v) => v && setUserRole(v)}>
                <SelectTrigger id="user-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cashier">Cashier</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveUser} disabled={savingUser || !userName || !userEmail || (!editUserId && !userPassword)}>
              {savingUser ? "Saving..." : editUserId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}
