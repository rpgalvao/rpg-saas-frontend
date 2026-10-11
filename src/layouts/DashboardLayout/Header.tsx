import { ChevronDownIcon, LogOutIcon, MenuIcon } from 'lucide-react'
import { useLocation } from 'react-router-dom'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth, type UserRole } from '@/contexts/AuthContext'

import { isNavItemActive, navItems } from './navigation'

const roleLabels: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  TECHNICIAN: 'Técnico',
}

type HeaderProps = {
  isSidebarOpen: boolean
  onOpenSidebar: () => void
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export function Header({ isSidebarOpen, onOpenSidebar }: HeaderProps) {
  const { pathname } = useLocation()
  const { user, signOut } = useAuth()
  const currentItem = navItems.find((item) => isNavItemActive(pathname, item))

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          id="dashboard-menu-button"
          className="text-muted-foreground lg:hidden"
          aria-label="Abrir menu"
          aria-expanded={isSidebarOpen}
          aria-controls="dashboard-sidebar"
          onClick={onOpenSidebar}
        >
          <MenuIcon />
        </Button>
        <p className="truncate text-sm font-medium tracking-tight">
          {currentItem?.label ?? 'Painel'}
        </p>
      </div>

      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex max-w-[16rem] items-center gap-2 rounded-full py-1 pr-2 pl-1 text-left transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <Avatar size="sm">
                {user.avatar_url ? (
                  <AvatarImage src={user.avatar_url} alt="" />
                ) : null}
                <AvatarFallback className="bg-foreground text-[0.65rem] font-medium text-background">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate text-sm font-medium tracking-tight">
                {user.name}
              </span>
              <ChevronDownIcon
                className="size-3.5 shrink-0 text-muted-foreground"
                strokeWidth={1.75}
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <span className="truncate text-sm font-medium tracking-tight">
                  {user.name}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
                <span className="text-xs text-muted-foreground">
                  {roleLabels[user.role]}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              className="cursor-pointer"
              onClick={signOut}
            >
              <LogOutIcon />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </header>
  )
}
