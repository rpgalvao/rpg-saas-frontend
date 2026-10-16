import { z } from 'zod'

import { formatCep, formatCnpj, toTitleCase } from '@/lib/formatters'
import type {
  CreateMasterTenantPayload,
  MasterTenantDetails,
  UpdateMasterTenantPayload,
} from '@/services/masterService'

function optionalText(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

type AddressParts = {
  cep: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
}

export function buildFullAddress(values: AddressParts) {
  const street = values.street.trim()
  const number = values.number.trim()
  const complement = values.complement.trim()
  const neighborhood = values.neighborhood.trim()
  const city = values.city.trim()
  const state = values.state.trim().toLocaleUpperCase('pt-BR')
  const cep = values.cep.trim()

  if (
    ![street, number, complement, neighborhood, city, state, cep].some(Boolean)
  ) {
    return undefined
  }

  return `${street}, ${number}${complement ? ` - ${complement}` : ''} - ${neighborhood}, ${city} - ${state}, CEP: ${cep}`
}

/** Best-effort parse of the concatenated address stored by the API. */
export function parseStoredAddress(
  address: string | null | undefined,
): AddressParts {
  const empty: AddressParts = {
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
  }

  if (!address?.trim()) return empty

  const cepMatch = address.match(/CEP:\s*([\d.-]+)/i)
  const cep = cepMatch ? formatCep(cepMatch[1]) : ''
  const withoutCep = address.replace(/,?\s*CEP:\s*[\d.-]+/i, '').trim()

  // Format: "Street, Number - Complement - Neighborhood, City - UF"
  // or:     "Street, Number - Neighborhood, City - UF"
  const withComplement = withoutCep.match(
    /^(.+?),\s*(.+?)\s+-\s+(.+?)\s+-\s+(.+?),\s*(.+?)\s+-\s*([A-Za-z]{2})\s*$/,
  )

  if (withComplement) {
    return {
      cep,
      street: withComplement[1].trim(),
      number: withComplement[2].trim(),
      complement: withComplement[3].trim(),
      neighborhood: withComplement[4].trim(),
      city: withComplement[5].trim(),
      state: withComplement[6].trim().toLocaleUpperCase('pt-BR'),
    }
  }

  const withoutComplement = withoutCep.match(
    /^(.+?),\s*(.+?)\s+-\s+(.+?),\s*(.+?)\s+-\s*([A-Za-z]{2})\s*$/,
  )

  if (withoutComplement) {
    return {
      cep,
      street: withoutComplement[1].trim(),
      number: withoutComplement[2].trim(),
      complement: '',
      neighborhood: withoutComplement[3].trim(),
      city: withoutComplement[4].trim(),
      state: withoutComplement[5].trim().toLocaleUpperCase('pt-BR'),
    }
  }

  return { ...empty, street: withoutCep, cep }
}

export const tenantFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'A razão social precisa ter pelo menos 2 caracteres'),
  tradeName: z
    .string()
    .trim()
    .min(2, 'O nome fantasia precisa ter pelo menos 2 caracteres'),
  cnpj: z
    .string()
    .trim()
    .refine(
      (value) => value.replace(/\D/g, '').length === 14,
      'Informe um CNPJ com 14 dígitos',
    ),
  cep: z.string().trim(),
  street: z.string().trim(),
  number: z.string().trim(),
  complement: z.string().trim(),
  neighborhood: z.string().trim(),
  city: z.string().trim(),
  state: z.string().trim(),
  stateRegistration: z.string().trim(),
  municipalRegistration: z.string().trim(),
  adminName: z
    .string()
    .trim()
    .min(2, 'O nome do administrador precisa ter pelo menos 2 caracteres'),
  adminEmail: z.string().trim().email('Informe um e-mail válido'),
  adminPassword: z
    .string()
    .min(6, 'A senha deve ter pelo menos 6 caracteres'),
})

export type TenantFormValues = z.infer<typeof tenantFormSchema>

export const emptyTenantFormValues: TenantFormValues = {
  name: '',
  tradeName: '',
  cnpj: '',
  cep: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  stateRegistration: '',
  municipalRegistration: '',
  adminName: '',
  adminEmail: '',
  adminPassword: '',
}

export function toCreateTenantPayload(
  values: TenantFormValues,
): CreateMasterTenantPayload {
  const address = buildFullAddress(values)
  const stateRegistration = optionalText(values.stateRegistration)
  const municipalRegistration = optionalText(values.municipalRegistration)

  return {
    name: toTitleCase(values.name.trim()),
    tradeName: toTitleCase(values.tradeName.trim()),
    cnpj: values.cnpj.replace(/\D/g, ''),
    adminName: toTitleCase(values.adminName.trim()),
    adminEmail: values.adminEmail.trim().toLowerCase(),
    adminPassword: values.adminPassword,
    ...(address ? { address } : {}),
    ...(stateRegistration ? { stateRegistration } : {}),
    ...(municipalRegistration ? { municipalRegistration } : {}),
  }
}

export const editTenantFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'A razão social precisa ter pelo menos 2 caracteres'),
  tradeName: z
    .string()
    .trim()
    .min(2, 'O nome fantasia precisa ter pelo menos 2 caracteres'),
  cnpj: z
    .string()
    .trim()
    .refine(
      (value) => value.replace(/\D/g, '').length === 14,
      'Informe um CNPJ com 14 dígitos',
    ),
  cep: z.string().trim(),
  street: z.string().trim(),
  number: z.string().trim(),
  complement: z.string().trim(),
  neighborhood: z.string().trim(),
  city: z.string().trim(),
  state: z.string().trim(),
  stateRegistration: z.string().trim(),
  municipalRegistration: z.string().trim(),
  active: z.boolean(),
})

export type EditTenantFormValues = z.infer<typeof editTenantFormSchema>

export function toEditTenantFormValues(
  tenant: MasterTenantDetails,
): EditTenantFormValues {
  const address = parseStoredAddress(tenant.address)

  return {
    name: tenant.name,
    tradeName: tenant.tradeName ?? '',
    cnpj: formatCnpj(tenant.cnpj),
    ...address,
    stateRegistration: tenant.stateRegistration ?? '',
    municipalRegistration: tenant.municipalRegistration ?? '',
    active: tenant.active,
  }
}

export function toUpdateTenantPayload(
  values: EditTenantFormValues,
): UpdateMasterTenantPayload {
  return {
    name: toTitleCase(values.name.trim()),
    tradeName: toTitleCase(values.tradeName.trim()),
    cnpj: values.cnpj.replace(/\D/g, ''),
    address: buildFullAddress(values) ?? null,
    stateRegistration: values.stateRegistration.trim() || null,
    municipalRegistration: values.municipalRegistration.trim() || null,
    active: values.active,
  }
}

export const paymentFormSchema = z.object({
  amount: z
    .string()
    .trim()
    .refine((value) => {
      const amount = parseCurrencyInput(value)
      return Number.isFinite(amount) && amount > 0
    }, 'Informe um valor maior que zero'),
  dueDate: z.string().trim().min(1, 'Informe a data de vencimento'),
  status: z.enum(['PENDENTE', 'PAGO', 'ATRASADO']),
  paidAt: z.string().trim(),
})

export type PaymentFormValues = z.infer<typeof paymentFormSchema>

export const emptyPaymentFormValues: PaymentFormValues = {
  amount: '',
  dueDate: '',
  status: 'PENDENTE',
  paidAt: '',
}

export function parseCurrencyInput(value: string) {
  return Number.parseFloat(value.replace(/\./g, '').replace(',', '.'))
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

export function toIsoDateTime(value: string) {
  const date = new Date(value.includes('T') ? value : `${value}T12:00:00`)

  if (Number.isNaN(date.getTime())) {
    throw new Error('Data inválida.')
  }

  return date.toISOString()
}
