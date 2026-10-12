import type { ServiceOrderType } from '@/services/serviceOrderService'

export const statusLabels: Record<string, string> = {
  ABERTA: 'Aberta',
  FINALIZADA: 'Finalizada',
  CANCELADA: 'Cancelada',
}

export const statusBadgeClass: Record<string, string> = {
  ABERTA:
    'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  FINALIZADA:
    'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  CANCELADA: 'border-destructive/20 bg-destructive/10 text-destructive',
}

export const typeLabels: Record<ServiceOrderType, string> = {
  CORRETIVA: 'Corretiva',
  PREVENTIVA: 'Preventiva',
  INSTALACAO: 'Instalação',
}

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function statusLabel(status: string) {
  return statusLabels[status] ?? status
}

export function typeLabel(type: string) {
  if (type in typeLabels) {
    return typeLabels[type as ServiceOrderType]
  }

  return type
}

export function formatOrderNumber(orderNumber: number) {
  return `#${String(orderNumber).padStart(4, '0')}`
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '—'

  return dateTimeFormatter.format(date)
}
