import { SettingsIcon, ShieldCheckIcon, WrenchIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import type { ServiceOrderType } from '@/services/serviceOrderService'

import { statusBadgeClass, statusLabel, typeLabel } from './presentation'

const typeIcons = {
  CORRETIVA: WrenchIcon,
  PREVENTIVA: ShieldCheckIcon,
  INSTALACAO: SettingsIcon,
} as const

const typeIconClass: Record<ServiceOrderType, string> = {
  CORRETIVA: 'text-red-600 dark:text-red-400',
  PREVENTIVA: 'text-sky-600 dark:text-sky-400',
  INSTALACAO: 'text-emerald-600 dark:text-emerald-400',
}

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={statusBadgeClass[status]}>
      {statusLabel(status)}
    </Badge>
  )
}

export function OrderTypeIcon({ type }: { type: string }) {
  if (!(type in typeIcons)) return null

  const key = type as ServiceOrderType
  const Icon = typeIcons[key]

  return (
    <span title={typeLabel(key)} className="inline-flex">
      <Icon className={typeIconClass[key]} strokeWidth={1.75} />
    </span>
  )
}
