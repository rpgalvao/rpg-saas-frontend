import axios from 'axios'

import { api } from '@/services/api'

export type DealCustomer = {
  id: string
  name: string
  mobilePhone: string | null
  customerType: string | null
  leadSource: string | null
}

export type Deal = {
  id: string
  title: string
  description: string | null
  estimatedValue: number
  status: string
  createdAt: string
  updatedAt: string
  tenantId: string
  customerId: string | null
  stageId: string
  customer?: DealCustomer | null
}

export type DealStage = {
  id: string
  name: string
  order: number
  tenantId: string
  deals: Deal[]
}

export type CreateDealPayload = {
  title: string
  stageId: string
  customerId?: string | null
  estimatedValue?: number
  description?: string
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

export async function getPipeline() {
  const { data } = await api.get<ApiSuccess<DealStage[]>>('/crm/pipeline')

  if (!data.success || !Array.isArray(data.data)) {
    throw new Error('Resposta do pipeline inválida.')
  }

  return data.data
}

export async function createDeal(payload: CreateDealPayload) {
  const { data } = await api.post<ApiSuccess<Deal>>('/crm/deals', payload)

  if (!data.success || !data.data) {
    throw new Error('Não foi possível criar o negócio.')
  }

  return data.data
}

export async function updateDealStatus(
  dealId: string,
  payload: { status: 'LOST'; lostReason: string } | { status: 'WON' },
) {
  const { data } = await api.patch<ApiSuccess<Deal>>(
    `/crm/deals/${dealId}/status`,
    payload,
  )

  if (!data.success || !data.data) {
    throw new Error('Não foi possível atualizar o status do negócio.')
  }

  return data.data
}

export async function moveDeal(dealId: string, newStageId: string) {
  const { data } = await api.patch<ApiSuccess<Deal>>(
    `/crm/deals/${dealId}/move`,
    { newStageId },
  )

  if (!data.success || !data.data) {
    throw new Error('Não foi possível mover o negócio.')
  }

  return data.data
}
