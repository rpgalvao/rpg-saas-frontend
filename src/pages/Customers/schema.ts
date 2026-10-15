import { z } from 'zod'

import { toTitleCase } from '@/lib/formatters'
import type { Customer, CustomerPayload } from '@/services/customerService'

const optionalText = z.string().trim()

export const customerFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'O nome precisa ter pelo menos 2 caracteres'),
  city: z
    .string()
    .trim()
    .min(2, 'A cidade precisa ter pelo menos 2 caracteres'),
  state: z.string().trim().length(2, 'Informe a UF com 2 letras'),
  email: z
    .string()
    .trim()
    .refine(
      (value) =>
        value.length === 0 || z.string().email().safeParse(value).success,
      'Informe um e-mail válido',
    ),
  zipcode: optionalText,
  address: optionalText,
  phone: optionalText,
  number: optionalText,
  complement: optionalText,
  neighborhood: optionalText,
})

export type CustomerFormValues = z.infer<typeof customerFormSchema>

export const emptyCustomerFormValues: CustomerFormValues = {
  name: '',
  city: '',
  state: '',
  email: '',
  zipcode: '',
  address: '',
  phone: '',
  number: '',
  complement: '',
  neighborhood: '',
}

export function toCustomerFormValues(customer: Customer): CustomerFormValues {
  return {
    name: customer.name,
    city: customer.city,
    state: customer.state,
    email: customer.email ?? '',
    zipcode: customer.zipcode ?? '',
    address: customer.address ?? '',
    phone: customer.phone ?? '',
    number: customer.number ?? '',
    complement: customer.complement ?? '',
    neighborhood: customer.neighborhood ?? '',
  }
}

export function toCustomerPayload(values: CustomerFormValues): CustomerPayload {
  const payload: CustomerPayload = {
    name: toTitleCase(values.name.trim()),
    city: values.city.trim(),
    state: values.state.trim().toUpperCase(),
  }

  const optionalFields = [
    'email',
    'zipcode',
    'address',
    'phone',
    'number',
    'complement',
    'neighborhood',
  ] as const

  for (const field of optionalFields) {
    const value = values[field].trim()

    if (!value) continue

    payload[field] = field === 'email' ? value.toLowerCase() : value
  }

  return payload
}
