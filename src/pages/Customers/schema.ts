import { z } from 'zod'

import { formatDocument, toTitleCase } from '@/lib/formatters'
import type { Customer, CustomerPayload } from '@/services/customerService'

const optionalText = z.string().trim()

export const LEAD_SOURCE_OPTIONS = [
  'Instagram',
  'Indicação',
  'Balcão',
  'Google',
  'Outros',
] as const

export type LeadSourceOption = (typeof LEAD_SOURCE_OPTIONS)[number]

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
  document: optionalText,
  zipcode: optionalText,
  address: optionalText,
  phone: optionalText,
  mobilePhone: optionalText,
  leadSource: optionalText,
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
  document: '',
  zipcode: '',
  address: '',
  phone: '',
  mobilePhone: '',
  leadSource: '',
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
    document: formatDocument(customer.document),
    zipcode: customer.zipcode ?? '',
    address: customer.address ?? '',
    phone: customer.phone ?? '',
    mobilePhone: customer.mobilePhone ?? '',
    leadSource: customer.leadSource ?? '',
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

  const documentDigits = values.document.replace(/\D/g, '')

  if (documentDigits) {
    payload.document = documentDigits
  }

  const optionalFields = [
    'email',
    'zipcode',
    'address',
    'phone',
    'mobilePhone',
    'leadSource',
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
