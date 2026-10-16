import { api } from '@/services/api'

export type MasterTenant = {
  id: string
  name: string
  tradeName: string | null
  cnpj: string | null
  createdAt: string | null
  active: boolean
}

export type MasterTenantDetails = MasterTenant & {
  address: string | null
  stateRegistration: string | null
  municipalRegistration: string | null
  email: string | null
  phone: string | null
}

export type CreateMasterTenantPayload = {
  name: string
  tradeName: string
  cnpj: string
  address?: string
  stateRegistration?: string
  municipalRegistration?: string
  adminName: string
  adminEmail: string
  adminPassword: string
}

export type UpdateMasterTenantPayload = {
  name: string
  tradeName: string
  cnpj: string
  address?: string | null
  stateRegistration?: string | null
  municipalRegistration?: string | null
  active?: boolean
}

export type PaymentStatus = 'PAGO' | 'PENDENTE' | 'ATRASADO'

export type MasterPayment = {
  id: string
  amount: number
  dueDate: string | null
  status: PaymentStatus
  paidAt: string | null
}

export type CreateMasterPaymentPayload = {
  amount: number
  dueDate: string
  status: PaymentStatus
  paidAt?: string
}

type ApiSuccess<T> = {
  success: boolean
  data?: T
  message?: string
}

function asString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : null
}

function toMasterTenant(value: unknown): MasterTenant | null {
  if (!value || typeof value !== 'object') return null

  const tenant = value as Record<string, unknown>

  if (typeof tenant.id !== 'string' || typeof tenant.name !== 'string') {
    return null
  }

  const createdAt = tenant.createdAt ?? tenant.created_at
  const active = tenant.active ?? tenant.isActive ?? tenant.is_active

  return {
    id: tenant.id,
    name: tenant.name,
    tradeName: asString(tenant.tradeName),
    cnpj: asString(tenant.cnpj),
    createdAt: typeof createdAt === 'string' ? createdAt : null,
    active: active !== false,
  }
}

function toMasterTenantDetails(value: unknown): MasterTenantDetails | null {
  const base = toMasterTenant(value)
  if (!base || !value || typeof value !== 'object') return null

  const tenant = value as Record<string, unknown>

  return {
    ...base,
    address: asString(tenant.address),
    stateRegistration: asString(
      tenant.stateRegistration ?? tenant.state_registration,
    ),
    municipalRegistration: asString(
      tenant.municipalRegistration ?? tenant.municipal_registration,
    ),
    email: asString(tenant.email),
    phone: asString(tenant.phone),
  }
}

function toPaymentStatus(value: unknown): PaymentStatus {
  const raw = typeof value === 'string' ? value.toLocaleUpperCase('pt-BR') : ''

  if (raw === 'PAGO' || raw === 'PAID') return 'PAGO'
  if (raw === 'ATRASADO' || raw === 'OVERDUE' || raw === 'LATE') return 'ATRASADO'
  return 'PENDENTE'
}

function toMasterPayment(value: unknown): MasterPayment | null {
  if (!value || typeof value !== 'object') return null

  const payment = value as Record<string, unknown>
  const amount = payment.amount ?? payment.value
  const dueDate = payment.dueDate ?? payment.due_date ?? payment.vencimento
  const paidAt =
    payment.paidAt ??
    payment.paidDate ??
    payment.paid_at ??
    payment.paid_date ??
    payment.paymentDate

  if (typeof payment.id !== 'string') return null

  const numericAmount =
    typeof amount === 'number'
      ? amount
      : typeof amount === 'string'
        ? Number(amount)
        : NaN

  if (!Number.isFinite(numericAmount)) return null

  return {
    id: payment.id,
    amount: numericAmount,
    dueDate:
      typeof dueDate === 'string'
        ? dueDate
        : dueDate instanceof Date
          ? dueDate.toISOString()
          : null,
    status: toPaymentStatus(payment.status),
    paidAt:
      typeof paidAt === 'string'
        ? paidAt
        : paidAt instanceof Date
          ? paidAt.toISOString()
          : null,
  }
}

export async function listMasterTenants() {
  const { data } = await api.get<ApiSuccess<unknown[]>>('/master/tenants')

  if (!data.success || !Array.isArray(data.data)) {
    throw new Error('Resposta de assinantes inválida.')
  }

  return data.data
    .map(toMasterTenant)
    .filter((tenant): tenant is MasterTenant => tenant !== null)
}

export async function getMasterTenant(id: string) {
  const { data } = await api.get<ApiSuccess<unknown>>(`/master/tenants/${id}`)

  if (!data.success || !data.data) {
    throw new Error('Não foi possível carregar o cliente.')
  }

  const tenant = toMasterTenantDetails(data.data)

  if (!tenant) {
    throw new Error('Resposta do cliente inválida.')
  }

  return tenant
}

export async function createMasterTenant(payload: CreateMasterTenantPayload) {
  const { data } = await api.post<ApiSuccess<unknown>>(
    '/master/tenants',
    payload,
  )

  if (!data.success) {
    throw new Error('Não foi possível cadastrar o cliente.')
  }
}

export async function updateMasterTenant(
  id: string,
  payload: UpdateMasterTenantPayload,
) {
  const { data } = await api.put<ApiSuccess<unknown>>(
    `/master/tenants/${id}`,
    payload,
  )

  if (!data.success || !data.data) {
    throw new Error('Não foi possível atualizar o cliente.')
  }

  const tenant = toMasterTenantDetails(data.data)

  if (!tenant) {
    throw new Error('Resposta do cliente inválida.')
  }

  return tenant
}

export async function toggleMasterTenant(id: string) {
  const { data } = await api.patch<ApiSuccess<unknown>>(
    `/master/tenants/${id}/toggle`,
  )

  if (!data.success) {
    throw new Error('Não foi possível alterar o status do cliente.')
  }
}

export async function listMasterPayments(tenantId: string) {
  const { data } = await api.get<ApiSuccess<unknown[]>>(
    `/master/tenants/${tenantId}/payments`,
  )

  if (!data.success || !Array.isArray(data.data)) {
    throw new Error('Resposta de pagamentos inválida.')
  }

  return data.data
    .map(toMasterPayment)
    .filter((payment): payment is MasterPayment => payment !== null)
}

export async function createMasterPayment(
  tenantId: string,
  payload: CreateMasterPaymentPayload,
) {
  const { data } = await api.post<ApiSuccess<unknown>>(
    `/master/tenants/${tenantId}/payments`,
    payload,
  )

  if (!data.success) {
    throw new Error('Não foi possível lançar o pagamento.')
  }
}

export async function markMasterPaymentAsPaid(
  tenantId: string,
  paymentId: string,
) {
  const { data } = await api.patch<ApiSuccess<unknown>>(
    `/master/tenants/${tenantId}/payments/${paymentId}`,
    {
      status: 'PAID',
      paidDate: new Date().toISOString(),
    },
  )

  if (!data.success) {
    throw new Error('Não foi possível dar baixa no pagamento.')
  }
}

export async function deleteMasterPayment(
  tenantId: string,
  paymentId: string,
) {
  const { data } = await api.delete<ApiSuccess<unknown>>(
    `/master/tenants/${tenantId}/payments/${paymentId}`,
  )

  if (!data.success) {
    throw new Error('Não foi possível excluir o pagamento.')
  }
}
