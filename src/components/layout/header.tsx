"use client"

import type { ReactNode } from "react"
import { ChevronDown, LogOut, User, Settings, Bell } from "lucide-react"
import { signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface HeaderProps {
  title?: string
  actions?: ReactNode
}

export function Header({ title, actions }: HeaderProps) {
  const { data: session } = useSession()
  const user = session?.user
  const name = user?.name ?? "User"
  const role = user?.role ?? ""
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="flex h-14 items-center gap-2 md:gap-4 border-b bg-background/95 backdrop-blur-sm px-4 md:px-6 sticky top-0 z-30">
      {title && (
        <h1 className="text-base font-semibold text-foreground tracking-tight">{title}</h1>
      )}
      {actions && <div className="flex items-center gap-2">{actions}</div>}
      <div className="flex-1" />

      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground relative">
        <Bell className="h-4 w-4" />
        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/60 transition-colors">
          <Avatar className="h-7 w-7 ring-2 ring-primary/10">
            <AvatarFallback className="text-[10px] font-semibold bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden text-left md:block">
            <p className="text-sm font-medium leading-none">{name}</p>
            <p className="text-[11px] leading-none text-muted-foreground mt-0.5 capitalize">{role}</p>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Akun Saya</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-sm gap-2">
            <User className="h-4 w-4" />
            Profil
          </DropdownMenuItem>
          <DropdownMenuItem className="text-sm gap-2">
            <Settings className="h-4 w-4" />
            Pengaturan
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-sm gap-2 text-destructive focus:text-destructive"
            onClick={async () => {
              await signOut({ redirect: false })
              window.location.href = "/login"
            }}
          >
            <LogOut className="h-4 w-4" />
            Keluar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
