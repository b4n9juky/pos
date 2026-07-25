"use client"

import { Suspense, useState, useRef, useCallback, useEffect } from "react"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { CartPanel } from "@/components/pos/cart-panel"
import { CheckoutModal } from "@/components/pos/checkout-modal"
import { ProductSearch } from "@/components/pos/product-search"
import { HoldTransactions } from "@/components/pos/hold-transactions"
import { useCart } from "@/hooks/use-cart"
import { useKeyboard } from "@/hooks/use-keyboard"
import { Search, X, Loader2, Trash2, Scan, ShoppingCart } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { formatCurrency } from "@/lib/format"
import { toast } from "sonner"
import { t } from "@/lib/translate"
import { useQuery } from "@tanstack/react-query"
import { useSearchParams } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


function POSPageContent() {
  const { addItem, items, itemCount, discount, discountAmount, subtotal, tax, total, taxRate, membershipSettings, removeItem, clearCart, setDiscount, updateQuantity } = useCart()
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [customerId, setCustomerId] = useState<string>("")
  const [barcode, setBarcode] = useState("")
  const [scanning, setScanning] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const scanInputRef = useRef<HTMLInputElement | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const discountInputRef = useRef<HTMLInputElement>(null)
  const searchParams = useSearchParams()
  const standalone = searchParams.get("standalone") === "true"

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

  useEffect(() => {
    if (items.length === 0) {
      setSelectedIndex(-1)
    } else if (selectedIndex >= items.length) {
      setSelectedIndex(items.length - 1)
    }
  }, [items.length])

  useKeyboard(
    [
      { key: "F2", handler: () => scanInputRef.current?.focus(), ignoreWhenInput: false },
      {
        key: "Control",
        location: 2,
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
      {
        key: "ArrowDown",
        handler: (e) => {
          e.preventDefault()
          if (items.length === 0) return
          setSelectedIndex((i) => (i + 1) % items.length)
        },
        ignoreWhenInput: false,
      },
      {
        key: "ArrowUp",
        handler: (e) => {
          e.preventDefault()
          if (items.length === 0) return
          setSelectedIndex((i) => (i <= 0 ? items.length - 1 : i - 1))
        },
        ignoreWhenInput: false,
      },
      {
        key: "=",
        handler: (e) => {
          e.preventDefault()
          if (selectedIndex < 0 || selectedIndex >= items.length) return
          const item = items[selectedIndex]
          if (item.quantity < item.product.stock) {
            updateQuantity(item.product.id, item.quantity + 1)
          }
        },
        ignoreWhenInput: false,
      },
      {
        key: "-",
        handler: (e) => {
          e.preventDefault()
          if (selectedIndex < 0 || selectedIndex >= items.length) return
          const item = items[selectedIndex]
          updateQuantity(item.product.id, item.quantity - 1)
        },
        ignoreWhenInput: false,
      },
      {
        key: "d",
        ctrlKey: true,
        handler: (e) => {
          e.preventDefault()
          discountInputRef.current?.focus()
        },
        ignoreWhenInput: false,
      },
      {
        key: "PageUp",
        handler: (e) => {
          e.preventDefault()
          document.querySelector("[data-cart-scroll]")?.scrollBy({ top: -600, behavior: "smooth" })
        },
        ignoreWhenInput: true,
      },
      {
        key: "PageDown",
        handler: (e) => {
          e.preventDefault()
          document.querySelector("[data-cart-scroll]")?.scrollBy({ top: 600, behavior: "smooth" })
        },
        ignoreWhenInput: true,
      },
    ],
    !checkoutOpen
  )

  return (
    <DashboardShell hideHeader standalone={standalone}>
      <div className="flex h-full flex-col">
        <div className="flex flex-1 overflow-hidden">
          <div className="flex w-full flex-1 flex-col bg-card relative overflow-hidden">
            <div className="p-5 max-md:p-3 bg-gradient-to-b from-muted/40 to-transparent border-b-2 shrink-0 flex justify-center">
              <div className="w-full max-w-2xl max-md:max-w-full">
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {[
                    { key: "F2", label: t("Barcode") },
                    { key: "F9", label: t("Cari") },
                    { key: "\u2191\u2193", label: t("Select item") },
                    { key: "+/-", label: t("Qty") },
                    { key: "Ctrl+D", label: t("Discount") },
                    { key: "Del", label: t("Remove item") },
                    { key: "RCtrl", label: t("Checkout") },
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

            <div className="flex items-center justify-between px-5 max-md:px-4 py-2.5 border-b-2 shrink-0 bg-muted/20">
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

            <CartPanel selectedIndex={selectedIndex} onSelectIndex={setSelectedIndex} />

            {itemCount > 0 && (
              <div className="bg-card border-t-2 shadow-[0_-4px_12px_rgba(0,0,0,0.04)] shrink-0">
                <div className="flex items-stretch max-md:flex-col">
                  <div className="flex-1 flex flex-col justify-center px-5 max-md:px-4 py-2 border-r-2 max-md:border-r-0 max-md:border-b-2 gap-0.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{t("Subtotal")}</span>
                      <span className="tabular-nums font-medium">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{t("Tax ({rate}%)", { rate: taxRate })}</span>
                      <span className="tabular-nums font-medium">{formatCurrency(tax)}</span>
                    </div>
                    <div className="flex justify-between text-xs items-center">
                      <span className="text-destructive/80">{t("Discount")}</span>
                      <div className="flex items-center gap-1">
                        {discount > 0 && (
                          <span className="text-[10px] text-muted-foreground tabular-nums">
                            {formatCurrency(discountAmount)}
                          </span>
                        )}
                        <div className="relative">
                          <Input
                            ref={discountInputRef}
                            type="number"
                            placeholder="0"
                            value={discount || ""}
                            onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                            className="h-7 w-20 text-xs text-right tabular-nums bg-muted/30 border-destructive/20 focus-visible:border-destructive/40 text-destructive/80 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none pr-5"
                          />
                          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                            %
                          </span>
                        </div>
                      </div>
                    </div>
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
                    <div className="flex flex-col gap-1.5 p-1.5 border-b-2 max-md:border-b-0 max-md:flex-1">
                      <Select value={customerId} onValueChange={(v) => setCustomerId(v ?? "")}>
                        <SelectTrigger className="h-8 text-xs flex-1 bg-muted/30 border-muted-foreground/20">
                          <SelectValue placeholder={t("Walk-in customer")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">{t("Walk-in customer")}</SelectItem>
                          {customers.map((c: { id: number, name: string }) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {(() => {
                        const selected = customerId ? customers.find((c: { id: number, name: string, loyalty_points?: string | number }) => String(c.id) === customerId) : null
                        if (!selected) return null
                        const points = Number(selected.loyalty_points) || 0
                        const eligible = membershipSettings.membershipEnabled && subtotal >= membershipSettings.membershipThreshold
                        const earned = eligible ? Math.floor(subtotal / membershipSettings.pointsPerUnit) * membershipSettings.pointsPerAmount : 0
                        return (
                          <div className="text-[10px] text-muted-foreground space-y-0.5 px-0.5">
                            <p className="tabular-nums">{t("Points: {points}", { points: points.toLocaleString("id-ID") })}</p>
                            {earned > 0 && (
                              <p className="tabular-nums text-emerald-600 dark:text-emerald-400">
                                {t("+{earned} pts this order", { earned: earned.toLocaleString("id-ID") })}
                              </p>
                            )}
                          </div>
                        )
                      })()}
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
