import { z } from 'zod'

import { toTitleCase } from '@/lib/formatters'
import type { Part, PartPayload } from '@/services/partService'
import type { StockMovementPayload } from '@/services/stockMovementService'
import type { Supplier, SupplierPayload } from '@/services/supplierService'

const optionalEmail = z
  .string()
  .trim()
  .refine(
    (value) => value.length === 0 || z.string().email().safeParse(value).success,
    'Informe um e-mail válido',
  )

function optionalText(value: string) {
  const text = value.trim()
  return text.length > 0 ? text : undefined
}

function sentence(text: string) {
  return text.charAt(0).toLocaleUpperCase('pt-BR') + text.slice(1)
}

function parseNonNegative(value: string, label: string) {
  if (value.trim() === '') {
    return { ok: false as const, message: sentence(`informe ${label}.`) }
  }

  const number = Number(value)

  if (!Number.isFinite(number) || number < 0) {
    return {
      ok: false as const,
      message: sentence(`${label} não pode ser negativo.`),
    }
  }

  return { ok: true as const, value: number }
}

export const supplierFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'O nome precisa ter pelo menos 3 caracteres'),
  document: z.string(),
  email: optionalEmail,
  phone: z.string(),
})

export type SupplierFormValues = z.infer<typeof supplierFormSchema>

export const emptySupplierFormValues: SupplierFormValues = {
  name: '',
  document: '',
  email: '',
  phone: '',
}

export function toSupplierFormValues(supplier: Supplier | null): SupplierFormValues {
  if (!supplier) return emptySupplierFormValues

  return {
    name: supplier.name,
    document: supplier.document ?? '',
    email: supplier.email ?? '',
    phone: supplier.phone ?? '',
  }
}

export function toSupplierPayload(
  values: SupplierFormValues,
  mode: 'create' | 'update',
): SupplierPayload {
  const payload: SupplierPayload = {
    name: toTitleCase(values.name.trim()),
  }

  const document = optionalText(values.document)
  const email = optionalText(values.email)?.toLowerCase()
  const phone = optionalText(values.phone)

  if (mode === 'create') {
    if (document) payload.document = document
    if (email) payload.email = email
    if (phone) payload.phone = phone
    return payload
  }

  payload.document = document ?? ''
  payload.email = email ?? ''
  payload.phone = phone ?? ''
  return payload
}

const moneyField = (label: string) =>
  z.string().trim().superRefine((value, context) => {
    const parsed = parseNonNegative(value, label)

    if (!parsed.ok) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: parsed.message,
      })
    }
  })

const stockField = (label: string) =>
  z.string().trim().superRefine((value, context) => {
    const parsed = parseNonNegative(value, label)

    if (!parsed.ok) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: parsed.message,
      })
      return
    }

    if (!Number.isInteger(parsed.value)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: sentence(`${label} precisa ser um número inteiro.`),
      })
    }
  })

export const partFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'O nome precisa ter pelo menos 2 caracteres'),
  sku: z.string(),
  cost_price: moneyField('o preço de custo'),
  sale_price: moneyField('o preço de venda'),
  current_stock: stockField('o estoque atual'),
  min_stock: stockField('o estoque mínimo'),
  supplierId: z.string(),
})

export type PartFormValues = z.infer<typeof partFormSchema>

export const emptyPartFormValues: PartFormValues = {
  name: '',
  sku: '',
  cost_price: '0',
  sale_price: '0',
  current_stock: '0',
  min_stock: '0',
  supplierId: '',
}

export function toPartFormValues(part: Part | null): PartFormValues {
  if (!part) return emptyPartFormValues

  return {
    name: part.name,
    sku: part.sku ?? '',
    cost_price: String(part.cost_price),
    sale_price: String(part.sale_price),
    current_stock: String(part.current_stock),
    min_stock: String(part.min_stock),
    supplierId: part.supplierId ?? '',
  }
}

export function toPartPayload(
  values: PartFormValues,
  mode: 'create' | 'update',
): PartPayload {
  const payload: PartPayload = {
    name: toTitleCase(values.name.trim()),
    cost_price: Number(values.cost_price),
    sale_price: Number(values.sale_price),
    current_stock: Number(values.current_stock),
    min_stock: Number(values.min_stock),
    supplierId: values.supplierId || null,
  }

  const sku = values.sku.trim()

  if (mode === 'create') {
    if (sku) payload.sku = sku
  } else {
    payload.sku = sku
  }

  return payload
}

export const movementFormSchema = z
  .object({
    partId: z.string().uuid('Selecione uma peça'),
    type: z.enum(['IN', 'OUT']),
    quantity: z.string().trim(),
    reason: z
      .string()
      .trim()
      .min(3, 'O motivo precisa ter pelo menos 3 caracteres'),
    unit_cost: z.string(),
  })
  .superRefine((values, context) => {
    const quantity = Number(values.quantity)

    if (!Number.isInteger(quantity) || quantity <= 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['quantity'],
        message: 'A quantidade deve ser maior que zero.',
      })
    }

    if (values.type !== 'IN' || values.unit_cost.trim() === '') return

    const unitCost = Number(values.unit_cost)

    if (!Number.isFinite(unitCost) || unitCost < 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['unit_cost'],
        message: 'O custo unitário não pode ser negativo.',
      })
    }
  })

export type MovementFormValues = z.infer<typeof movementFormSchema>

export function toMovementFormValues(part: Part | null): MovementFormValues {
  return {
    partId: part?.id ?? '',
    type: 'IN',
    quantity: '',
    reason: '',
    unit_cost: part ? String(part.cost_price) : '',
  }
}

export function toMovementPayload(values: MovementFormValues): StockMovementPayload {
  const payload: StockMovementPayload = {
    partId: values.partId,
    type: values.type,
    quantity: Number(values.quantity),
    reason: toTitleCase(values.reason.trim()),
  }

  if (values.type === 'IN' && values.unit_cost.trim() !== '') {
    payload.unit_cost = Number(values.unit_cost)
  }

  return payload
}
