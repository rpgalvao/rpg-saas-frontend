import axios from 'axios'

import { api } from '@/services/api'

export type ChecklistQuestion = {
  id: string
  text: string
  order: number
}

export type ChecklistTemplate = {
  id: string
  name: string
  active: boolean
  modelId: string
  created_at: string
  model?: { id?: string; name: string } | null
  questions?: ChecklistQuestion[]
}

export type ChecklistTemplatePayload = {
  name: string
  modelId: string
}

export type ChecklistQuestionPayload = {
  text: string
  order: number
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

export async function listChecklistTemplates(includeInactive = false) {
  const { data } = await api.get<ApiSuccess<ChecklistTemplate[]>>(
    '/checklist-templates',
    {
      params: includeInactive ? { includeInactive: true } : undefined,
    },
  )

  if (!data.success || !Array.isArray(data.data)) {
    throw new Error('Resposta de templates inválida.')
  }

  return data.data
}

export async function createChecklistTemplate(payload: ChecklistTemplatePayload) {
  const { data } = await api.post<ApiSuccess<ChecklistTemplate>>(
    '/checklist-templates',
    payload,
  )

  if (!data.success || !data.data) {
    throw new Error('Não foi possível criar o template.')
  }

  return data.data
}

export async function updateChecklistTemplate(
  id: string,
  payload: ChecklistTemplatePayload,
) {
  const { data } = await api.put<ApiSuccess<ChecklistTemplate>>(
    `/checklist-templates/${id}`,
    payload,
  )

  if (!data.success || !data.data) {
    throw new Error('Não foi possível atualizar o template.')
  }

  return data.data
}

export async function toggleChecklistTemplateStatus(id: string) {
  const { data } = await api.patch<ApiSuccess<ChecklistTemplate>>(
    `/checklist-templates/${id}/toggle-status`,
  )

  if (!data.success || !data.data) {
    throw new Error('Não foi possível alterar o status do template.')
  }

  return data.data
}

export async function addChecklistQuestion(
  templateId: string,
  payload: ChecklistQuestionPayload,
) {
  const { data } = await api.post<ApiSuccess<ChecklistQuestion>>(
    `/checklist-templates/${templateId}/questions`,
    payload,
  )

  if (!data.success || !data.data) {
    throw new Error('Não foi possível adicionar a pergunta.')
  }

  return data.data
}

export async function updateChecklistQuestion(
  questionId: string,
  payload: ChecklistQuestionPayload,
) {
  const { data } = await api.put<ApiSuccess<ChecklistQuestion>>(
    `/checklist-templates/questions/${questionId}`,
    payload,
  )

  if (!data.success || !data.data) {
    throw new Error('Não foi possível atualizar a pergunta.')
  }

  return data.data
}

export async function deleteChecklistQuestion(questionId: string) {
  const { data } = await api.delete<ApiSuccess<unknown>>(
    `/checklist-templates/questions/${questionId}`,
  )

  if (!data.success) {
    throw new Error('Não foi possível remover a pergunta.')
  }
}
