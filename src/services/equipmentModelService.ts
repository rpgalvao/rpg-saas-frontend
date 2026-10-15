import axios from 'axios'

import { api } from '@/services/api'

export type EquipmentModel = {
  id: string
  name: string
  brand: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export type EquipmentModelPayload = {
  name: string
  brand: string
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

export async function listEquipmentModels(includeInactive = false) {
  const { data } = await api.get<ApiSuccess<EquipmentModel[]>>('/equipmentmodel', {
    params: { includeInactive },
  })

  if (!data.success || !Array.isArray(data.data)) {
    throw new Error('Resposta de modelos inválida.')
  }

  return data.data
}

export async function createEquipmentModel(payload: EquipmentModelPayload) {
  const { data } = await api.post<ApiSuccess<EquipmentModel>>(
    '/equipmentmodel',
    payload,
  )

  if (!data.success || !data.data) {
    throw new Error('Não foi possível criar o modelo.')
  }

  return data.data
}

export async function updateEquipmentModel(
  id: string,
  payload: EquipmentModelPayload,
) {
  const { data } = await api.put<ApiSuccess<EquipmentModel>>(
    `/equipmentmodel/${id}`,
    payload,
  )

  if (!data.success || !data.data) {
    throw new Error('Não foi possível atualizar o modelo.')
  }

  return data.data
}

export async function toggleEquipmentModelStatus(id: string) {
  const { data } = await api.patch<ApiSuccess<EquipmentModel>>(
    `/equipmentmodel/${id}/toggle-status`,
  )

  if (!data.success || !data.data) {
    throw new Error('Não foi possível alterar o status do modelo.')
  }

  return data.data
}
