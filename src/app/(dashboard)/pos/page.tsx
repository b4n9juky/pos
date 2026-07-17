"use client"

import { Suspense, useState, useRef, useCallback } from "react"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { CartPanel } from "@/components/pos/cart-panel"
import { CheckoutModal } from "@/components/pos/checkout-modal"
import { ProductSearch } from "@/components/pos/product-search"
import { HoldTransactions } from "@/components/pos/hold-transactions"
import { useCart } from "@/hooks/use-cart"
import { useKeyboard } from "@/hooks/use-keyboard"
import { Search, X, Loader2, Store, Percent, Trash2, LogOut, Monitor, XCircle, Scan, ShoppingCart } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { formatCurrency } from "@/lib/format"
import { toast } from "sonner"
import { t } from "@/lib/translate"
import { useQuery } from "@tanstack/react-query"
import { useSession, signOut } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

function POSPageContent() {
  const { addItem, items, itemCount, discount, subtotal, tax, total, taxRate, removeItem, clearCart, setDiscount } = useCart()
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [customerId, setCustomerId] = useState<string>("")
  const [barcode, setBarcode] = useState("")
  const [scanning, setScanning] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const scanInputRef = useRef<HTMLInputElement | null>(null)

  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const standalone = searchParams.get("standalone") === "true"

  const { data: settings } = useQuery({
    queryKey: ["pos-settings"],
    queryFn: () => fetch("/api/settings").then((r) => r.json()),
  })

  const { data: customers = [] } = useQuery({
    queryKey: ["pos-customers"],
    queryFn: () => fetch("/api/customers").then((r) => r.json()),
  })

  const handleScan = useCallback(async (barcodeValue: string) => {
    const trimmed = barcodeValue.trim()
    if (!trimmed) return
    setScanning(true)
    try {
      const res = await fetch(`/api/products/barcode/${encodeURIComponent(trimmed)}`)
      if (!res.ok) {
        toast.error(t("Product not found"))
        setBarcode("")
        return
      }
      const product = await res.json()
      if (product.stock <= 0) {
        toast.error(t("Product out of stock"))
        setBarcode("")
        return
      }
      addItem(product)
      setBarcode("")
    } catch {
      toast.error(t("Failed to look up product"))
    } finally {
      setScanning(false)
      scanInputRef.current?.focus()
    }
  }, [addItem])

  useKeyboard(
    [
      { key: "F2", handler: () => scanInputRef.current?.focus(), ignoreWhenInput: false },
      {
        key: "F4",
        handler: () => {
          if (itemCount > 0) setCheckoutOpen(true)
        },
        ignoreWhenInput: false,
      },
      {
        key: "Escape",
        handler: () => {
          setBarcode("")
          scanInputRef.current?.blur()
        },
        ignoreWhenInput: false,
      },
      {
        key: "F9",
        handler: () => setSearchOpen(true),
        ignoreWhenInput: false,
      },
      {
        key: "Delete",
        handler: () => {
          if (items.length === 0) return
          const last = items[items.length - 1]
          removeItem(last.product.id)
        },
      },
    ],
    !checkoutOpen
  )

  return (
    <DashboardShell hideHeader>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-4 border-b bg-background/80 backdrop-blur-sm px-4 py-2.5 shrink-0">
          <div className="flex items-center gap-3 min-w-0 shrink-0">
            <Avatar className="h-8 w-8 ring-2 ring-primary/15">
              <AvatarFallback className="text-xs font-semibold bg-primary text-primary-foreground">
                {session?.user?.name?.charAt(0)?.toUpperCase() || "K"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate leading-tight">{session?.user?.name || t("Cashier")}</p>
              <p className="text-[11px] text-muted-foreground capitalize leading-tight">{session?.user?.role || "cashier"}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-muted-foreground">
              <Store className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium truncate max-w-[200px]">
                {settings?.storeName || t("POS")}
              </span>
            </div>
            {standalone && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.close()}
                className="text-muted-foreground hover:text-foreground h-8 text-xs gap-1.5"
              >
                <XCircle className="h-4 w-4" />
                <span className="hidden md:inline">{t("Exit POS")}</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-muted-foreground hover:text-destructive h-8 text-xs gap-1.5"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">{t("Logout")}</span>
            </Button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex w-full flex-1 flex-col bg-card relative overflow-hidden">
            <div className="p-5 max-md:p-3 bg-gradient-to-b from-muted/40 to-transparent border-b shrink-0 flex justify-center">
              <div className="w-full max-w-2xl max-md:max-w-full">
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {[
                    { key: "F2", label: t("Barcode") },
                    { key: "F9", label: t("Cari") },
                    { key: "F6", label: t("Hold") },
                    { key: "F7", label: t("Fire") },
                    { key: "Del", label: t("Remove item") },
                    { key: "F4", label: t("Checkout") },
                    { key: "F8", label: t("Print") },
                    { key: "Esc", label: t("Clear") },
                  ].map(({ key, label }) => (
                    <span
                      key={key}
                      className="inline-flex items-center gap-1 rounded-full border bg-background/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                    >
                      <kbd className="font-mono text-[9px] font-semibold text-foreground/70">{key}</kbd>
                      {label}
                    </span>
                  ))}
                </div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-foreground mb-1.5">
                  <Scan className="h-4 w-4 text-primary" />
                  {t("Scan Barcode")}
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setSearchOpen(true)}
                    className="absolute left-3.5 max-md:left-3 top-1/2 -translate-y-1/2 z-10"
                    title={t("Search products")}
                  >
                    <Search className="h-5 w-5 max-md:h-4 max-md:w-4 text-muted-foreground/60 hover:text-foreground transition-colors" />
                  </button>
                  <Input
                    ref={scanInputRef}
                    placeholder={t("Scan barcode... (F2)")}
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleScan(barcode)
                      }
                    }}
                    className="pl-11 max-md:pl-9 pr-20 max-md:pr-16 h-12 max-md:h-11 text-base max-md:text-sm bg-background border-muted-foreground/20 focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/10 transition-all duration-200"
                    autoFocus
                  />
                  <div className="absolute inset-y-0 right-0 pr-3.5 max-md:pr-3 flex items-center gap-1">
                    {barcode ? (
                      <button
                        onClick={() => {
                          setBarcode("")
                          scanInputRef.current?.focus()
                        }}
                        className="flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                      </button>
                    ) : (
                      <kbd className="hidden md:inline-flex items-center h-6 rounded-md border bg-muted/50 px-1.5 text-[10px] font-mono font-medium text-muted-foreground">
                        Enter
                      </kbd>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <HoldTransactions
              itemCount={itemCount}
              onRecallCustomer={(id) => setCustomerId(id)}
              disabled={checkoutOpen}
            />

            <div className="flex items-center justify-between px-5 max-md:px-4 py-2.5 border-b shrink-0 bg-muted/20">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold">{t("Current Sale")}</h2>
                {itemCount > 0 && (
                  <span className="inline-flex items-center justify-center h-5 min-w-5 rounded-full bg-primary/10 px-1.5 text-[10px] font-semibold text-primary tabular-nums">
                    {itemCount}
                  </span>
                )}
              </div>
              {itemCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearCart} className="text-destructive/80 hover:text-destructive hover:bg-destructive/10 h-7 text-xs gap-1.5">
                  <Trash2 className="h-3.5 w-3.5" />
                  {t("Void All")}
                </Button>
              )}
            </div>

            <CartPanel />

            {itemCount > 0 && (
              <div className="bg-card border-t shadow-[0_-4px_12px_rgba(0,0,0,0.04)] shrink-0">
                <div className="flex items-stretch max-md:flex-col">
                  <div className="flex-1 flex flex-col justify-center px-5 max-md:px-4 py-2 border-r max-md:border-r-0 max-md:border-b gap-0.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{t("Subtotal")}</span>
                      <span className="tabular-nums font-medium">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{t("Tax ({rate}%)", { rate: taxRate })}</span>
                      <span className="tabular-nums font-medium">{formatCurrency(tax)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-xs text-destructive/80">
                        <span>{t("Discount")}</span>
                        <span className="tabular-nums font-medium">-{formatCurrency(discount)}</span>
                      </div>
                    )}
                    <Separator className="my-0.5" />
                    <div className="flex flex-col items-center py-1.5">
                      <span className="text-[11px] text-muted-foreground tracking-wide uppercase">{t("Total")}</span>
                      <span
                        className="font-bold text-primary tabular-nums leading-none tracking-tight"
                        style={{ fontSize: "clamp(2rem, 5vw, 5rem)" }}
                      >
                        {formatCurrency(total)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col w-48 max-md:w-full max-md:flex-row max-md:items-center">
                    <div className="flex gap-1.5 p-1.5 border-b max-md:border-b-0 max-md:flex-1">
                      <Select value={customerId} onValueChange={(v) => setCustomerId(v ?? "")}>
                        <SelectTrigger className="h-8 text-xs flex-1 bg-muted/30 border-muted-foreground/20">
                          <SelectValue placeholder={t("Walk-in customer")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">{t("Walk-in customer")}</SelectItem>
                          {customers.map((c: any) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-1.5 w-24">
                        <Percent className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                        <Input
                          type="number"
                          placeholder="0"
                          value={discount || ""}
                          onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                          className="h-8 text-xs bg-muted/30 border-muted-foreground/20"
                        />
                      </div>
                    </div>
                    <div className="flex-1 p-1.5 max-md:w-auto">
                      <Button
                        className="w-full h-full min-h-[2.75rem] text-sm font-semibold gap-2 shadow-sm hover:shadow-md transition-all duration-200"
                        onClick={() => setCheckoutOpen(true)}
                      >
                        <ShoppingCart className="h-4 w-4" />
                        {t("Checkout ({amount})", { amount: formatCurrency(total) })}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <ProductSearch open={searchOpen} onOpenChange={setSearchOpen} />
        <CheckoutModal
          open={checkoutOpen}
          onOpenChange={setCheckoutOpen}
          customerId={customerId ? Number(customerId) : null}
        />
      </div>
    </DashboardShell>
  )
}

export default function POSPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <POSPageContent />
    </Suspense>
  )
}
