import { api } from '@/services/api'

export type StockMovementType = 'IN' | 'OUT'

export type StockMovement = {
  id: string
  partId: string
  type: StockMovementType
  quantity: number
  reason: string
  userId: string | null
  created_at: string
  part?: {
    id?: string
    name: string
    sku?: string | null
  } | null
  user?: {
    id: string
    name: string
  } | null
}

export type StockMovementPayload = {
  partId: string
  type: StockMovementType
  quantity: number
  reason: string
  unit_cost?: number
}

type ApiSuccess<T> = {
  success: boolean
  data?: T
  message?: string
}

export async function listStockMovements(partId?: string) {
  const { data } = await api.get<ApiSuccess<StockMovement[]>>('/stock-movements', {
    params: partId ? { partId } : undefined,
  })

  if (!data.success || !Array.isArray(data.data)) {
    throw new Error('Resposta de movimentações inválida.')
  }

  return data.data
}

export async function createStockMovement(payload: StockMovementPayload) {
  const { data } = await api.post<ApiSuccess<unknown>>('/stock-movements', payload)

  if (!data.success) {
    throw new Error('Não foi possível registrar a movimentação.')
  }

  return data.data
}
