import { DashboardShell } from "@/components/layout/dashboard-shell"
import { ProductGrid } from "@/components/pos/product-grid"
import { CartPanel } from "@/components/pos/cart-panel"

export default function POSPage() {
  return (
    <DashboardShell title="Point of Sales">
      <div className="flex h-[calc(100vh-3.5rem)] -m-6">
        <ProductGrid />
        <CartPanel />
      </div>
    </DashboardShell>
  )
}
