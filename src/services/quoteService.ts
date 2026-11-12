import { api } from '@/services/api'
import { getApiErrorMessage } from '@/services/crmService'

export { getApiErrorMessage }

export type QuoteStatus = 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED'
export type QuoteItemType = 'PRODUCT' | 'SERVICE'

export type QuoteItem = {
  id: string
  type: QuoteItemType
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
  quoteId: string
}

export type Quote = {
  id: string
  status: QuoteStatus | string
  validUntil: string | null
  totalAmount: number
  notes: string | null
  tenantId: string
  dealId: string
  customerId: string
  items: QuoteItem[]
  customer?: {
    id: string
    name: string
    email: string | null
    phone: string | null
    mobilePhone: string | null
  } | null
}

export type CreateQuotePayload = {
  dealId: string
  customerId: string
  status?: QuoteStatus
  validUntil?: string | null
  notes?: string
  items?: Array<{
    type: QuoteItemType
    description: string
    quantity: number
    unitPrice: number
  }>
}

export type CreateQuoteItemPayload = {
  type: QuoteItemType
  description: string
  quantity: number
  unitPrice: number
}

type ApiSuccess<T> = {
  success: boolean
  data?: T
  message?: string
}

export async function listQuotesByDeal(dealId: string) {
  const { data } = await api.get<ApiSuccess<Quote[]>>(
    `/deals/${dealId}/quotes`,
  )

  if (!data.success || !Array.isArray(data.data)) {
    throw new Error('Resposta de orçamentos inválida.')
  }

  return data.data
}

export async function createQuote(payload: CreateQuotePayload) {
  const { data } = await api.post<ApiSuccess<Quote>>('/quotes', payload)

  if (!data.success || !data.data) {
    throw new Error('Não foi possível criar o orçamento.')
  }

  return data.data
}

export type UpdateQuoteItemPayload = {
  type?: QuoteItemType
  description?: string
  quantity?: number
  unitPrice?: number
}

export async function updateQuoteStatus(quoteId: string, status: QuoteStatus) {
  const { data } = await api.patch<ApiSuccess<Quote>>(
    `/quotes/${quoteId}/status`,
    { status },
  )

  if (!data.success || !data.data) {
    throw new Error('Não foi possível atualizar o status do orçamento.')
  }

  return data.data
}

export async function deleteQuote(quoteId: string) {
  const { data } = await api.delete<ApiSuccess<null>>(`/quotes/${quoteId}`)

  if (!data.success) {
    throw new Error(data.message || 'Não foi possível excluir o orçamento.')
  }
}

export async function updateQuoteItem(
  quoteId: string,
  itemId: string,
  payload: UpdateQuoteItemPayload,
) {
  const { data } = await api.patch<ApiSuccess<Quote>>(
    `/quotes/${quoteId}/items/${itemId}`,
    payload,
  )

  if (!data.success || !data.data) {
    throw new Error('Não foi possível atualizar o item.')
  }

  return data.data
}

export async function deleteQuoteItem(quoteId: string, itemId: string) {
  const { data } = await api.delete<ApiSuccess<Quote>>(
    `/quotes/${quoteId}/items/${itemId}`,
  )

  if (!data.success || !data.data) {
    throw new Error('Não foi possível excluir o item.')
  }

  return data.data
}

export async function addQuoteItem(
  quoteId: string,
  payload: CreateQuoteItemPayload,
) {
  const { data } = await api.post<ApiSuccess<Quote>>(
    `/quotes/${quoteId}/items`,
    payload,
  )

  if (!data.success || !data.data) {
    throw new Error('Não foi possível adicionar o item.')
  }

  return data.data
}
