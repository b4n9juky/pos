"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Save, ArrowLeft } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import Link from "next/link"
import { t } from "@/lib/translate"

export default function NewProductPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [sku, setSku] = useState("")
  const [barcode, setBarcode] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [costPrice, setCostPrice] = useState("")
  const [stock, setStock] = useState("0")
  const [minStock, setMinStock] = useState("0")
  const [categoryId, setCategoryId] = useState("")
  const [taxable, setTaxable] = useState(true)
  const [taxRate, setTaxRate] = useState("")
  const [active, setActive] = useState(true)
  const [saving, setSaving] = useState(false)

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => fetch("/api/categories").then((r) => r.json()),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          sku,
          barcode: barcode || null,
          description: description || null,
          price: Number(price),
          costPrice: costPrice ? Number(costPrice) : null,
          stock: Number(stock),
          minStock: Number(minStock),
          categoryId: categoryId ? Number(categoryId) : null,
          taxable,
          taxRate: taxRate ? Number(taxRate) : null,
          active,
        }),
      })
      if (!res.ok) throw new Error("Failed to save")
      toast.success(t("Product created"))
      router.push("/products")
      router.refresh()
    } catch {
      toast.error(t("Failed to create product"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardShell title={t("Add Product")}>
      <form onSubmit={handleSubmit}>
        <div className="space-y-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>{t("Product Information")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("Product Name *")}</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">{t("SKU *")}</Label>
                  <Input id="sku" value={sku} onChange={(e) => setSku(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="barcode">{t("Barcode")}</Label>
                <Input id="barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">{t("Description")}</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">{t("Category")}</Label>
                <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder={t("Select category")} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat: any) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("Pricing & Stock")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">{t("Selling Price *")}</Label>
                  <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="costPrice">{t("Cost Price")}</Label>
                  <Input id="costPrice" type="number" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stock">{t("Stock")}</Label>
                  <Input id="stock" type="number" value={stock} onChange={(e) => setStock(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minStock">{t("Min Stock")}</Label>
                  <Input id="minStock" type="number" value={minStock} onChange={(e) => setMinStock(e.target.value)} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="taxable" checked={taxable} onCheckedChange={setTaxable} />
                <Label htmlFor="taxable">{t("Taxable")}</Label>
              </div>
              {taxable && (
                <div className="space-y-2">
                  <Label htmlFor="taxRate">{t("Custom Tax Rate (%)")}</Label>
                  <Input 
                    id="taxRate" 
                    type="number" 
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder={t("Leave blank for general tax")}
                    value={taxRate} 
                    onChange={(e) => setTaxRate(e.target.value)} 
                  />
                  <p className="text-xs text-muted-foreground">{t("If left blank, the general tax rate from settings will be used.")}</p>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Switch id="active" checked={active} onCheckedChange={setActive} />
                <Label htmlFor="active">{t("Active")}</Label>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-3">
            <Link href="/products" className={cn(buttonVariants({ variant: "outline" }))}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("Cancel")}
            </Link>
            <Button type="submit" disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? t("Saving...") : t("Save Product")}
            </Button>
          </div>
        </div>
      </form>
    </DashboardShell>
  )
}
