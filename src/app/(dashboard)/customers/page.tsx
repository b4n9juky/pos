"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, Search, Users, Edit, ChevronLeft, ChevronRight } from "lucide-react"
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

const PAGE_SIZE = 50

export default function CustomersPage() {
  const queryClient = useQueryClient()
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
      toast.success("Customer updated")
      queryClient.invalidateQueries({ queryKey: ["customers"] })
      setEditDialog(false)
    } catch {
      toast.error("Failed to update customer")
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardShell title="Customers">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(0)
              }}
              className="pl-8"
            />
          </div>
          <Link href="/customers/new" className={cn(buttonVariants({ variant: "default" }))}>
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Link>
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Loyalty Points</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No customers found
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer: any) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                          <Users className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <span className="font-medium">{customer.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{customer.email || "-"}</TableCell>
                    <TableCell>{customer.phone || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{customer.loyaltyPoints ?? 0}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{formatDate(customer.createdAt)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(customer)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page + 1}
            {customers.length > 0 && (
              <span className="ml-1">({offset + 1}–{offset + customers.length})</span>
            )}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={!hasMore}>
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>Update customer details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input id="edit-email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input id="edit-phone" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Textarea id="edit-address" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>Cancel</Button>
            <Button onClick={handleEditSave} disabled={saving || !editName}>
              {saving ? "Saving..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}
