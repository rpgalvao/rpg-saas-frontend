import { api } from '@/services/api'

import type { Supplier } from '@/services/supplierService'

export type Part = {
  id: string
  name: string
  sku: string | null
  cost_price: number | string
  sale_price: number | string
  current_stock: number
  min_stock: number
  supplierId: string | null
  active: boolean
  created_at: string
  supplier?: Pick<Supplier, 'id' | 'name'> | null
}

export type PartPayload = {
  name: string
  sku?: string
  cost_price: number
  sale_price: number
  current_stock: number
  min_stock: number
  supplierId?: string | null
  active?: boolean
}

type ApiSuccess<T> = {
  success: boolean
  data?: T
  message?: string
}

export async function listParts(includeInactive = false) {
  const { data } = await api.get<ApiSuccess<Part[]>>('/parts', {
    params: includeInactive ? { all: true } : undefined,
  })

  if (!data.success || !Array.isArray(data.data)) {
    throw new Error('Resposta de peças inválida.')
  }

  return data.data
}

export async function createPart(payload: PartPayload) {
  const { data } = await api.post<ApiSuccess<Part>>('/parts', payload)

  if (!data.success || !data.data) {
    throw new Error('Não foi possível criar a peça.')
  }

  return data.data
}

export async function updatePart(id: string, payload: PartPayload) {
  const { data } = await api.put<ApiSuccess<Part>>(`/parts/${id}`, payload)

  if (!data.success || !data.data) {
    throw new Error('Não foi possível atualizar a peça.')
  }

  return data.data
}

export async function deletePart(id: string) {
  const { data } = await api.delete<ApiSuccess<unknown>>(`/parts/${id}`)

  if (!data.success) {
    throw new Error('Não foi possível inativar a peça.')
  }
}
