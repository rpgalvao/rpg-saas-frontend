import { z } from 'zod'

import type { CreateDealPayload } from '@/services/crmService'

export const dealFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Informe o título do negócio'),
  estimatedValue: z.string(),
  customerId: z.string().min(1, 'Selecione um cliente'),
})

export type DealFormValues = z.infer<typeof dealFormSchema>

export const emptyDealFormValues: DealFormValues = {
  title: '',
  estimatedValue: '',
  customerId: '',
}

export function parseCurrencyInput(value: string) {
  const digits = value.replace(/\D/g, '')

  if (!digits) return 0

  return Number(digits) / 100
}

export function formatCurrencyInput(value: string) {
  const digits = value.replace(/\D/g, '')

  if (!digits) return ''

  const amount = Number(digits) / 100

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function toCreateDealPayload(
  values: DealFormValues,
  stageId: string,
): CreateDealPayload {
  return {
    title: values.title.trim(),
    stageId,
    customerId: values.customerId,
    estimatedValue: parseCurrencyInput(values.estimatedValue),
  }
}
