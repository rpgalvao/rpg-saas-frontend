import axios from 'axios'

import type { UserRole } from '@/contexts/AuthContext'
import { api } from '@/services/api'

export type TeamUser = {
  id: string
  name: string
  email: string
  phone: string | null
  role: UserRole
  active: boolean
}

export type CreateUserPayload = {
  name: string
  email: string
  password: string
  role: UserRole
  phone?: string
}

export type UpdateUserPayload = {
  name: string
  email: string
  role: UserRole
  phone?: string
  currentPassword?: string
  newPassword?: string
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

export async function listUsers(includeInactive = false) {
  const { data } = await api.get<ApiSuccess<TeamUser[]>>('/user', {
    params: { includeInactive },
  })

  if (!data.success || !Array.isArray(data.data)) {
    throw new Error('Resposta de usuários inválida.')
  }

  return data.data
}

export async function createUser(payload: CreateUserPayload) {
  const { data } = await api.post<ApiSuccess<TeamUser>>('/user', payload)

  if (!data.success || !data.data) {
    throw new Error('Não foi possível criar o usuário.')
  }

  return data.data
}

export async function updateUser(id: string, payload: UpdateUserPayload) {
  const { data } = await api.patch<ApiSuccess<TeamUser>>(`/user/${id}`, payload)

  if (!data.success || !data.data) {
    throw new Error('Não foi possível atualizar o usuário.')
  }

  return data.data
}

export async function deactivateUser(id: string) {
  const { data } = await api.delete<ApiSuccess<unknown>>(`/user/${id}`)

  if (!data.success) {
    throw new Error('Não foi possível desativar o usuário.')
  }
}

export async function toggleUserStatus(id: string) {
  const { data } = await api.patch<ApiSuccess<unknown>>(
    `/user/${id}/toggle-status`,
  )

  if (!data.success) {
    throw new Error('Não foi possível alterar o status do usuário.')
  }
}
