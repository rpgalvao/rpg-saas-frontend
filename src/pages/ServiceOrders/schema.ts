import { z } from 'zod'

import type { CreateServiceOrderPayload } from '@/services/serviceOrderService'

const costField = z.string().trim().refine((value) => {
  if (!value) return true

  const number = Number(value)
  return Number.isFinite(number) && number >= 0
}, 'O valor não pode ser negativo.')

export const newOrderFormSchema = z.object({
  customerId: z.string().uuid('Selecione o cliente'),
  equipmentId: z.string().uuid('Selecione o equipamento'),
  type: z.enum(['CORRETIVA', 'PREVENTIVA', 'INSTALACAO']),
  problem_description: z
    .string()
    .trim()
    .min(5, 'O relato precisa ter pelo menos 5 caracteres.')
    .max(255, 'O relato pode ter no máximo 255 caracteres.'),
})

export type NewOrderFormValues = z.infer<typeof newOrderFormSchema>

export const emptyNewOrderFormValues: NewOrderFormValues = {
  customerId: '',
  equipmentId: '',
  type: 'CORRETIVA',
  problem_description: '',
}

export function toCreateOrderPayload(
  values: NewOrderFormValues,
): CreateServiceOrderPayload {
  return {
    customerId: values.customerId,
    equipmentId: values.equipmentId,
    type: values.type,
    problem_description: values.problem_description.trim(),
  }
}

export const finishOrderFormSchema = z.object({
  solution_description: z
    .string()
    .trim()
    .min(1, 'A descrição da solução é obrigatória.'),
  technical_notes: z.string(),
  signer_name: z
    .string()
    .trim()
    .min(2, 'O nome do responsável precisa ter pelo menos 2 caracteres.'),
  labor_cost: costField,
  travel_cost: costField,
  accommodation_cost: costField,
})

export type FinishOrderFormValues = z.infer<typeof finishOrderFormSchema>

export const emptyFinishOrderFormValues: FinishOrderFormValues = {
  solution_description: '',
  technical_notes: '',
  signer_name: '',
  labor_cost: '',
  travel_cost: '',
  accommodation_cost: '',
}

export type FinishOrderPayload = {
  solution_description: string
  technical_notes: string
  signer_name: string
  client_signature: string
  labor_cost: number
  travel_cost: number
  accommodation_cost: number
}

function toCost(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return 0
  return Number(trimmed)
}

export function toFinishOrderPayload(
  values: FinishOrderFormValues,
  signature: string,
): FinishOrderPayload {
  return {
    solution_description: values.solution_description.trim(),
    technical_notes: values.technical_notes.trim(),
    signer_name: values.signer_name.trim(),
    client_signature: signature,
    labor_cost: toCost(values.labor_cost),
    travel_cost: toCost(values.travel_cost),
    accommodation_cost: toCost(values.accommodation_cost),
  }
}

export const cancelOrderFormSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, 'O motivo precisa ter pelo menos 5 caracteres.'),
})

export type CancelOrderFormValues = z.infer<typeof cancelOrderFormSchema>

export const reopenOrderFormSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, 'O motivo da reabertura deve ter no mínimo 5 caracteres e é obrigatório.'),
})

export type ReopenOrderFormValues = z.infer<typeof reopenOrderFormSchema>

export const whatsAppFormSchema = z.object({
  phone: z.string().refine((value) => value.replace(/\D/g, '').length >= 10, {
    message: 'Insira um número de WhatsApp válido com DDD.',
  }),
})

export type WhatsAppFormValues = z.infer<typeof whatsAppFormSchema>

export const emailFormSchema = z.object({
  email: z.string().trim().email('Informe um e-mail válido'),
})

export type EmailFormValues = z.infer<typeof emailFormSchema>
