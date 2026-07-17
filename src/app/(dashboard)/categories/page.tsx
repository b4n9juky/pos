"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Plus, FolderTree, Edit, Upload, Tag } from "lucide-react"
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
import { t } from "@/lib/translate"

export default function CategoriesPage() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "admin"
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
        toast.success(t("Category updated"))
      } else {
        const res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, slug, description: description || null }),
        })
        if (!res.ok) throw new Error()
        toast.success(t("Category created"))
      }
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      setDialogOpen(false)
    } catch {
      toast.error(t("Failed to save category"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardShell title={t("Categories")}>
      <div className="space-y-4">
        {isAdmin && (
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)} className="h-9">
              <Upload className="mr-2 h-4 w-4" />
              {t("Import")}
            </Button>
            <Button size="sm" onClick={openNew} className="h-9">
              <Plus className="mr-2 h-4 w-4" />
              {t("Add Category")}
            </Button>
          </div>
        )}

        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-medium">{t("Name")}</TableHead>
                <TableHead className="font-medium">{t("Slug")}</TableHead>
                <TableHead className="font-medium">{t("Description")}</TableHead>
                {isAdmin && <TableHead className="w-12"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 4 : 3} className="text-center py-12">
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
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50">
                        <Tag className="h-5 w-5 text-muted-foreground/40" />
                      </div>
                      <p className="text-sm font-medium">{t("No categories found")}</p>
                      <p className="text-xs">{t("Create a category to organize your products")}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((cat: any) => (
                  <TableRow key={cat.id} className="group hover:bg-muted/20 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-b from-muted/60 to-muted/30 group-hover:from-primary/5 group-hover:to-primary/10 transition-colors">
                          <FolderTree className="h-4 w-4 text-muted-foreground/50" />
                        </div>
                        <span className="font-medium text-sm">{cat.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{cat.slug}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{cat.description || <span className="text-muted-foreground/50">-</span>}</TableCell>
                    {isAdmin && (
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(cat)} className="h-8 w-8">
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
      </div>

      {isAdmin && (
        <ImportModal
          open={importOpen}
          onOpenChange={setImportOpen}
          title={t("Categories")}
          templateUrl="/api/categories/template"
          importUrl="/api/categories/import"
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["categories"] })}
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editCat ? t("Edit Category") : t("New Category")}</DialogTitle>
            <DialogDescription>
              {editCat ? t("Update the category details") : t("Add a new product category")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">{t("Name")}</Label>
              <Input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("Category name")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-desc">{t("Description")}</Label>
              <Textarea id="cat-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("Optional description")} className="resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("Cancel")}</Button>
            <Button onClick={handleSave} disabled={saving || !name}>
              {saving ? t("Saving...") : editCat ? t("Update") : t("Create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}
