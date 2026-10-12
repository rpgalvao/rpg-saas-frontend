import axios from 'axios'

import { api } from '@/services/api'

export type Supplier = {
  id: string
  name: string
  document: string | null
  email: string | null
  phone: string | null
  active: boolean
  created_at: string
}

export type SupplierPayload = {
  name: string
  document?: string
  email?: string
  phone?: string
  active?: boolean
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

export async function listSuppliers(includeInactive = false) {
  const { data } = await api.get<ApiSuccess<Supplier[]>>('/suppliers', {
    params: includeInactive ? { all: true } : undefined,
  })

  if (!data.success || !Array.isArray(data.data)) {
    throw new Error('Resposta de fornecedores inválida.')
  }

  return data.data
}

export async function createSupplier(payload: SupplierPayload) {
  const { data } = await api.post<ApiSuccess<Supplier>>('/suppliers', payload)

  if (!data.success || !data.data) {
    throw new Error('Não foi possível criar o fornecedor.')
  }

  return data.data
}

export async function updateSupplier(id: string, payload: SupplierPayload) {
  const { data } = await api.put<ApiSuccess<Supplier>>(
    `/suppliers/${id}`,
    payload,
  )

  if (!data.success || !data.data) {
    throw new Error('Não foi possível atualizar o fornecedor.')
  }

  return data.data
}

export async function deleteSupplier(id: string) {
  const { data } = await api.delete<ApiSuccess<unknown>>(`/suppliers/${id}`)

  if (!data.success) {
    throw new Error('Não foi possível inativar o fornecedor.')
  }
}
