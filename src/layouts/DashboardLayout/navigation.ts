import type { LucideIcon } from 'lucide-react'
import {
  ClipboardListIcon,
  LayoutDashboardIcon,
  MonitorSmartphoneIcon,
  PackageIcon,
  SettingsIcon,
  UsersIcon,
} from 'lucide-react'

export type NavItem = {
  label: string
  to: string
  icon: LucideIcon
  end?: boolean
}

export const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    to: '/',
    icon: LayoutDashboardIcon,
    end: true,
  },
  {
    label: 'Clientes',
    to: '/clientes',
    icon: UsersIcon,
  },
  {
    label: 'Equipamentos',
    to: '/equipamentos',
    icon: MonitorSmartphoneIcon,
  },
  {
    label: 'Ordens de Serviço',
    to: '/ordens-de-servico',
    icon: ClipboardListIcon,
  },
  {
    label: 'Estoque',
    to: '/estoque',
    icon: PackageIcon,
  },
  {
    label: 'Configurações',
    to: '/configuracoes',
    icon: SettingsIcon,
  },
]

export function isNavItemActive(pathname: string, item: NavItem) {
  if (item.end || item.to === '/') {
    return pathname === item.to
  }

  return pathname === item.to || pathname.startsWith(`${item.to}/`)
}
