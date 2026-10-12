import axios from 'axios'

import { api } from '@/services/api'

export type ServiceOrderType = 'INSTALACAO' | 'PREVENTIVA' | 'CORRETIVA'
export type ServiceOrderStatus = 'ABERTA' | 'FINALIZADA' | 'CANCELADA'
export type ServiceOrderImageTag = 'ANTES' | 'DURANTE' | 'DEPOIS'

export type ChecklistAnswer = {
  id: string
  question_text: string
  order: number
  is_ok: boolean | null
  comment?: string | null
}

export type ServiceOrderChecklist = {
  id: string
  notes?: string | null
  started_at: string
  completed_at?: string | null
  answers: ChecklistAnswer[]
}

export type ServiceOrderEvent = {
  id: string
  action: string
  notes?: string | null
  created_at: string
  user?: { name: string } | null
}

export type ServiceOrderImage = {
  id: string
  url: string
  tag: ServiceOrderImageTag
  created_at: string
}

export type ServiceOrderPart = {
  id: string
  quantity: number
  unit_price: string | number
  part: {
    name: string
    sku?: string | null
  }
}

export type ServiceOrder = {
  id: string
  number: number
  type: ServiceOrderType
  status: ServiceOrderStatus
  problem_description: string
  opened_at: string
  closed_at?: string | null
  cancellation_reason?: string | null
  solution_description?: string | null
  technical_notes?: string | null
  client_signature?: string | null
  signer_name?: string | null
  customer?: {
    name: string
    phone?: string | null
    email?: string | null
  } | null
  equipment?: {
    serial_number: string
    model?: { name: string } | null
  } | null
  openedBy?: { name: string } | null
  closedBy?: { name: string } | null
  checklist?: ServiceOrderChecklist | null
  events?: ServiceOrderEvent[]
  parts_replaced?: ServiceOrderPart[]
  images?: ServiceOrderImage[]
}

export type CreateServiceOrderPayload = {
  customerId: string
  equipmentId: string
  type: ServiceOrderType
  problem_description: string
}

export type UpdateServiceOrderPayload = {
  status?: ServiceOrderStatus
  solution_description?: string
  technical_notes?: string
  client_signature?: string
  signer_name?: string
  labor_cost?: number
  travel_cost?: number
  accommodation_cost?: number
}

export type UpdateChecklistPayload = {
  notes?: string
  answers: {
    id: string
    is_ok: boolean
    comment?: string
  }[]
}

type ApiSuccess<T> = {
  success: boolean
  data?: T
  message?: string
}

type ApiErrorBody = {
  message?: string
}

type LabelResponse = {
  success: boolean
  labelUrl?: string
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

export async function listOrders() {
  const { data } = await api.get<ApiSuccess<ServiceOrder[]>>('/serviceorder')

  if (!data.success || !Array.isArray(data.data)) {
    throw new Error(data.message || 'Resposta de ordens de serviço inválida.')
  }

  return data.data
}

export async function getOrderById(id: string) {
  const { data } = await api.get<ApiSuccess<ServiceOrder>>(`/serviceorder/${id}`)

  if (!data.success || !data.data) {
    throw new Error(data.message || 'Não foi possível carregar a ordem de serviço.')
  }

  return data.data
}

export async function createOrder(payload: CreateServiceOrderPayload) {
  const { data } = await api.post<ApiSuccess<ServiceOrder>>('/serviceorder', payload)

  if (!data.success || !data.data) {
    throw new Error(data.message || 'Não foi possível abrir a ordem de serviço.')
  }

  return data.data
}

export async function updateOrder(id: string, payload: UpdateServiceOrderPayload) {
  const { data } = await api.put<ApiSuccess<ServiceOrder>>(
    `/serviceorder/${id}`,
    payload,
  )

  if (!data.success || !data.data) {
    throw new Error(data.message || 'Não foi possível atualizar a ordem de serviço.')
  }

  return data.data
}

export async function cancelOrder(id: string, reason: string) {
  const { data } = await api.patch<ApiSuccess<unknown>>(
    `/serviceorder/${id}/cancel`,
    { reason },
  )

  if (!data.success) {
    throw new Error(data.message || 'Não foi possível cancelar a ordem de serviço.')
  }
}

export async function reopenOrder(id: string, reason: string) {
  const { data } = await api.patch<ApiSuccess<unknown>>(
    `/serviceorder/${id}/reopen`,
    { reason },
  )

  if (!data.success) {
    throw new Error(data.message || 'Não foi possível reabrir a ordem de serviço.')
  }
}

export async function updateChecklist(id: string, payload: UpdateChecklistPayload) {
  const { data } = await api.patch<ApiSuccess<unknown>>(
    `/serviceorder/${id}/checklist`,
    payload,
  )

  if (!data.success) {
    throw new Error(data.message || 'Não foi possível salvar o checklist.')
  }
}

export async function addOrderPart(orderId: string, partId: string, quantity: number) {
  const { data } = await api.post<ApiSuccess<unknown>>(
    `/serviceorder/${orderId}/parts`,
    { partId, quantity },
  )

  if (!data.success) {
    throw new Error(data.message || 'Não foi possível adicionar a peça.')
  }
}

export async function exportPdf(id: string) {
  const { data } = await api.get<ApiSuccess<{ pdf_url: string }>>(
    `/serviceorder/${id}/export/pdf`,
  )

  if (!data.success || !data.data?.pdf_url) {
    throw new Error(data.message || 'Não foi possível obter o link do documento.')
  }

  return data.data.pdf_url
}

export async function sendOrderEmail(id: string, customEmail: string) {
  const { data } = await api.post<ApiSuccess<{ sent_to: string }>>(
    `/serviceorder/${id}/send-email`,
    { customEmail },
  )

  if (!data.success) {
    throw new Error(data.message || 'Não foi possível enviar o e-mail.')
  }

  return {
    message: data.message || 'E-mail enviado com sucesso!',
    sent_to: data.data?.sent_to ?? customEmail,
  }
}

export async function generateLabel(id: string) {
  const { data } = await api.get<LabelResponse>(`/serviceorder/${id}/label`)

  if (!data.success || !data.labelUrl) {
    throw new Error(data.message || 'Não foi possível gerar a etiqueta.')
  }

  return {
    success: true,
    labelUrl: data.labelUrl,
  }
}

export const serviceOrderService = {
  exportPdf,
  generateLabel,
}

export async function uploadOrderImage(
  orderId: string,
  tag: ServiceOrderImageTag,
  file: File,
) {
  const formData = new FormData()
  formData.append('tag', tag)
  formData.append('file', file)

  const { data } = await api.post<ApiSuccess<unknown>>(
    `/serviceorder/${orderId}/images`,
    formData,
  )

  if (!data.success) {
    throw new Error(data.message || 'Não foi possível salvar a imagem.')
  }
}

export async function removeOrderImage(imageId: string) {
  const { data } = await api.delete<ApiSuccess<unknown>>(
    `/serviceorder/images/${imageId}`,
  )

  if (!data.success) {
    throw new Error(data.message || 'Não foi possível apagar a imagem.')
  }
}
