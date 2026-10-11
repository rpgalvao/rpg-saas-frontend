import axios from 'axios'

import { api } from '@/services/api'

export type Customer = {
  id: string
  name: string
  email: string | null
  phone: string | null
  zipcode: string | null
  city: string
  state: string
  address: string | null
  number: string | null
  complement: string | null
  neighborhood: string | null
  active: boolean
  created_at: string
}

export type CustomerPayload = {
  name: string
  city: string
  state: string
  email?: string
  zipcode?: string
  address?: string
  phone?: string
  number?: string
  complement?: string
  neighborhood?: string
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

export async function listCustomers() {
  const { data } = await api.get<ApiSuccess<Customer[]>>('/customer')

  if (!data.success || !Array.isArray(data.data)) {
    throw new Error('Resposta de clientes inválida.')
  }

  return data.data
}

export async function createCustomer(payload: CustomerPayload) {
  const { data } = await api.post<ApiSuccess<Customer>>('/customer', payload)

  if (!data.success || !data.data) {
    throw new Error('Não foi possível criar o cliente.')
  }

  return data.data
}

export async function updateCustomer(id: string, payload: CustomerPayload) {
  const { data } = await api.put<ApiSuccess<Customer>>(`/customer/${id}`, payload)

  if (!data.success || !data.data) {
    throw new Error('Não foi possível atualizar o cliente.')
  }

  return data.data
}

export async function deleteCustomer(id: string) {
  const { data } = await api.delete<ApiSuccess<unknown>>(`/customer/${id}`)

  if (!data.success) {
    throw new Error('Não foi possível excluir o cliente.')
  }
}
