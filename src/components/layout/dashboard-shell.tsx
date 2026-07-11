"use client"

import type { ReactNode } from "react"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { cn } from "@/lib/utils"

interface DashboardShellProps {
  children: ReactNode
  title?: string
  hideSidebar?: boolean
  hideHeader?: boolean
}

export function DashboardShell({ children, title, hideSidebar, hideHeader }: DashboardShellProps) {
  const showSidebar = hideSidebar !== true
  const showHeader = !hideHeader && showSidebar
  const hasPadding = showSidebar

  return (
    <div className="flex h-screen overflow-hidden">
      {showSidebar && <Sidebar />}
      <div className="flex flex-1 flex-col overflow-hidden">
        {showHeader && <Header title={title} />}
        <main className={cn("flex-1 overflow-auto", hasPadding && "p-6")}>{children}</main>
      </div>
    </div>
  )
}
