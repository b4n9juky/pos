"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  ShoppingCart, Package, FolderTree, Users, FileText, BarChart3, Settings,
  CircleDollarSign, ChevronLeft, Monitor, LayoutDashboard,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { APP_NAME } from "@/lib/constants"
import { useState } from "react"

const allNavItems = [
  { href: "/pos", label: "POS", icon: ShoppingCart, adminOnly: false },
  { href: "/products", label: "Produk", icon: Package, adminOnly: true },
  { href: "/categories", label: "Kategori", icon: FolderTree, adminOnly: true },
  { href: "/customers", label: "Pelanggan", icon: Users, adminOnly: true },
  { href: "/orders", label: "Pesanan", icon: FileText, adminOnly: false },
  { href: "/reports", label: "Laporan", icon: BarChart3, adminOnly: true },
  { href: "/register", label: "Kasir", icon: CircleDollarSign, adminOnly: false },
  { href: "/settings", label: "Pengaturan", icon: Settings, adminOnly: true },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [collapsed, setCollapsed] = useState(false)
  const isAdmin = session?.user?.role === "admin"
  const navItems = allNavItems.filter((item) => !item.adminOnly || isAdmin)

  return (
    <TooltipProvider delay={0}>
      <aside
        className={cn(
          "flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out relative",
          "shadow-[1px_0_4px_rgba(0,0,0,0.02)]",
          collapsed ? "w-16" : "w-60"
        )}
      >
        <div
          className={cn(
            "flex h-14 items-center border-b border-sidebar-border px-3 shrink-0",
            collapsed && "justify-center px-2"
          )}
        >
          {!collapsed && (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <LayoutDashboard className="h-4 w-4 text-primary" />
              </div>
              <span className="text-base font-bold tracking-tight bg-gradient-to-r from-primary to-[oklch(0.6_0.18_175)] bg-clip-text text-transparent">
                {APP_NAME}
              </span>
            </div>
          )}
          {collapsed && (
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <LayoutDashboard className="h-4 w-4 text-primary" />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "ml-auto h-7 w-7 rounded-md text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
              collapsed && "ml-0"
            )}
          >
            <ChevronLeft className={cn("h-3.5 w-3.5 transition-transform duration-200", collapsed && "rotate-180")} />
          </Button>
        </div>

        <nav className="flex-1 space-y-0.5 p-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = pathname.startsWith(item.href)
            const navItem = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                  "hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/60",
                  collapsed && "justify-center px-2"
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full bg-primary" />
                )}
                <Icon className={cn(
                  "h-5 w-5 shrink-0 transition-transform duration-200",
                  "group-hover:scale-110",
                  active && "text-primary"
                )} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger>
                    <span>{navItem}</span>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              )
            }
            return navItem
          })}
        </nav>

        <div className="border-t border-sidebar-border p-2">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger>
                <span
                  onClick={() => window.open("/pos?standalone=true", "pos-terminal", "toolbar=no,menubar=no,width=1024,height=768")}
                  className="flex w-full items-center justify-center rounded-lg px-2 py-2 text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground transition-all duration-200 cursor-pointer"
                >
                  <Monitor className="h-5 w-5 shrink-0" />
                </span>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">POS Terminal</TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={() => window.open("/pos?standalone=true", "pos-terminal", "toolbar=no,menubar=no,width=1024,height=768")}
              className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            >
              <Monitor className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
              <span>POS Terminal</span>
            </button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}
