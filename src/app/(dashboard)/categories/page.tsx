"use client"

import { useState } from "react"
import { Plus, FolderTree, Edit, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DashboardShell } from "@/components/layout/dashboard-shell"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ImportModal } from "@/components/import-modal"

export default function CategoriesPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [editCat, setEditCat] = useState<any>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => fetch("/api/categories").then((r) => r.json()),
  })

  const openNew = () => {
    setEditCat(null)
    setName("")
    setDescription("")
    setDialogOpen(true)
  }

  const openEdit = (cat: any) => {
    setEditCat(cat)
    setName(cat.name)
    setDescription(cat.description ?? "")
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const slug = name.toLowerCase().replace(/\s+/g, "-")
      if (editCat) {
        const res = await fetch("/api/categories", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editCat.id, name, slug, description: description || null }),
        })
        if (!res.ok) throw new Error()
        toast.success("Category updated")
      } else {
        const res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, slug, description: description || null }),
        })
        if (!res.ok) throw new Error()
        toast.success("Category created")
      }
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      setDialogOpen(false)
    } catch {
      toast.error("Failed to save category")
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardShell title="Categories">
      <div className="space-y-4">
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No categories found
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((cat: any) => (
                  <TableRow key={cat.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                          <FolderTree className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <span className="font-medium">{cat.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{cat.slug}</TableCell>
                    <TableCell className="text-muted-foreground">{cat.description || "-"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(cat)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <ImportModal
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Categories"
        templateUrl="/api/categories/template"
        importUrl="/api/categories/import"
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["categories"] })}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editCat ? "Edit Category" : "New Category"}</DialogTitle>
            <DialogDescription>
              {editCat ? "Update the category details" : "Add a new product category"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Name</Label>
              <Input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-desc">Description</Label>
              <Textarea id="cat-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !name}>
              {saving ? "Saving..." : editCat ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}
