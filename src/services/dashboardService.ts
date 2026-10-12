import axios from 'axios'

import { api } from '@/services/api'

export interface DashboardChartPoint {
  name: string
  abertas: number
  finalizadas: number
}

export interface DashboardTechMetric {
  name: string
  osCount: number
  avgResolutionTimeHours: number
}

export interface DashboardRecentActivity {
  id: string
  number: number
  status: string
  updated_at: string
  equipment: {
    model: {
      name: string
    } | null
  } | null
  customer: {
    name: string
  } | null
}

export interface DashboardMetrics {
  openOrders: number
  completedOS: number
  totalEquipments: number
  finishedOrdersThisMonth: number
  chartData: DashboardChartPoint[]
  techMetrics: DashboardTechMetric[]
  recentActivities: DashboardRecentActivity[]
}

type ApiSuccess<T> = {
  success: boolean
  data?: T
  message?: string
}

type ApiErrorBody = {
  message?: string
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const message = error.response?.data?.message

    if (typeof message === 'string' && message.length > 0) {
      return message
    }

    if (!error.response) {
      return 'Não foi possível conectar ao servidor.'
    }
  }

  if (error instanceof Error && error.message.length > 0) {
    return error.message
  }

  return fallback
}

export async function getDashboardMetrics() {
  const { data } = await api.get<ApiSuccess<DashboardMetrics>>(
    '/dashboard/metrics',
  )

  if (!data.success || !data.data) {
    throw new Error(data.message || 'Resposta do painel inválida.')
  }

  return data.data
}
