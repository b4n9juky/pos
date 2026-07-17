"use client"

import { useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Plus, Search, Users, Edit, ChevronLeft, ChevronRight, User } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/format"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { t } from "@/lib/translate"

const PAGE_SIZE = 50

export default function CustomersPage() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "admin"
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 200)
  const [page, setPage] = useState(0)
  const [editDialog, setEditDialog] = useState(false)
  const [editCustomer, setEditCustomer] = useState<any>(null)
  const [editName, setEditName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editPhone, setEditPhone] = useState("")
  const [editAddress, setEditAddress] = useState("")
  const [saving, setSaving] = useState(false)

  const offset = page * PAGE_SIZE
  const limit = PAGE_SIZE + 1

  const { data: rawCustomers = [], isLoading } = useQuery({
    queryKey: ["customers", debouncedSearch, page],
    queryFn: () =>
      fetch(`/api/customers?limit=${limit}&offset=${offset}${debouncedSearch ? `&search=${debouncedSearch}` : ""}`).then((r) => r.json()),
  })

  const hasMore = rawCustomers.length > PAGE_SIZE
  const customers = hasMore ? rawCustomers.slice(0, PAGE_SIZE) : rawCustomers

  const openEdit = (customer: any) => {
    setEditCustomer(customer)
    setEditName(customer.name)
    setEditEmail(customer.email ?? "")
    setEditPhone(customer.phone ?? "")
    setEditAddress(customer.address ?? "")
    setEditDialog(true)
  }

  const handleEditSave = async () => {
    if (!editCustomer) return
    setSaving(true)
    try {
      const res = await fetch(`/api/customers/${editCustomer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          email: editEmail || null,
          phone: editPhone || null,
          address: editAddress || null,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success(t("Customer updated"))
      queryClient.invalidateQueries({ queryKey: ["customers"] })
      setEditDialog(false)
    } catch {
      toast.error(t("Failed to update customer"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardShell title={t("Customers")}>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="relative flex-1 max-w-sm min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input
              placeholder={t("Search customers...")}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(0)
              }}
              className="pl-9 h-9"
            />
          </div>
          {isAdmin && (
            <Link href="/customers/new" className={cn(buttonVariants({ variant: "default", size: "sm" }), "h-9")}>
              <Plus className="mr-2 h-4 w-4" />
              {t("Add Customer")}
            </Link>
          )}
        </div>

        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-medium">{t("Name")}</TableHead>
                <TableHead className="font-medium">{t("Email")}</TableHead>
                <TableHead className="font-medium">{t("Phone")}</TableHead>
                <TableHead className="font-medium">{t("Loyalty Points")}</TableHead>
                <TableHead className="font-medium">{t("Created")}</TableHead>
                {isAdmin && <TableHead className="w-12"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 6 : 5} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span className="text-sm">{t("Loading...")}</span>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 6 : 5} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50">
                        <User className="h-5 w-5 text-muted-foreground/40" />
                      </div>
                      <p className="text-sm font-medium">{t("No customers found")}</p>
                      <p className="text-xs">{t("Add a customer or adjust your search")}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer: any) => (
                  <TableRow key={customer.id} className="group hover:bg-muted/20 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-b from-muted/60 to-muted/30 group-hover:from-primary/5 group-hover:to-primary/10 transition-colors">
                          <Users className="h-4 w-4 text-muted-foreground/50" />
                        </div>
                        <span className="font-medium text-sm">{customer.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{customer.email || <span className="text-muted-foreground/50">-</span>}</TableCell>
                    <TableCell className="text-sm">{customer.phone || <span className="text-muted-foreground/50">-</span>}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono text-xs">{customer.loyaltyPoints ?? 0}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{formatDate(customer.createdAt)}</TableCell>
                    {isAdmin && (
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(customer)} className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t("Page")} {page + 1}
            {customers.length > 0 && (
              <span className="ml-1">({offset + 1}&ndash;{offset + customers.length})</span>
            )}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="h-8 text-xs">
              <ChevronLeft className="mr-1 h-4 w-4" />
              {t("Previous")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={!hasMore} className="h-8 text-xs">
              {t("Next")}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Edit Customer")}</DialogTitle>
            <DialogDescription>{t("Update customer details")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">{t("Name *")}</Label>
              <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">{t("Email")}</Label>
              <Input id="edit-email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">{t("Phone")}</Label>
              <Input id="edit-phone" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">{t("Address")}</Label>
              <Textarea id="edit-address" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} className="resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>{t("Cancel")}</Button>
            <Button onClick={handleEditSave} disabled={saving || !editName}>
              {saving ? t("Saving...") : t("Update")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}
