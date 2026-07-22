"use client"

import type { ReactNode } from "react"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { cn } from "@/lib/utils"

interface DashboardShellProps {
  children: ReactNode
  title?: string
  actions?: ReactNode
  hideSidebar?: boolean
  hideHeader?: boolean
  standalone?: boolean
}

export function DashboardShell({ children, title, actions, hideSidebar, hideHeader, standalone }: DashboardShellProps) {
  const showSidebar = hideSidebar !== true
  const showHeader = !hideHeader && showSidebar
  const hasPadding = showSidebar

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-background via-background to-muted/30">
      {showSidebar && <Sidebar standalone={standalone} />}
      <div className="flex flex-1 flex-col overflow-hidden">
        {showHeader && <Header title={title} actions={actions} />}
        <main className={cn("flex-1 overflow-auto", hasPadding && "p-6")}>
          {children}
        </main>
      </div>
    </div>
  )
}
