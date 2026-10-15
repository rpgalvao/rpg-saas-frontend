import { api } from '@/services/api'

export type MasterTenant = {
  id: string
  name: string
  tradeName: string | null
  cnpj: string | null
  createdAt: string | null
  active: boolean
}

export type CreateMasterTenantPayload = {
  name: string
  tradeName?: string
  cnpj: string
  adminEmail: string
  adminPassword: string
}

type ApiSuccess<T> = {
  success: boolean
  data?: T
  message?: string
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
    tradeName:
      typeof tenant.tradeName === 'string' && tenant.tradeName.trim()
        ? tenant.tradeName
        : null,
    cnpj: typeof tenant.cnpj === 'string' && tenant.cnpj ? tenant.cnpj : null,
    createdAt: typeof createdAt === 'string' ? createdAt : null,
    active: active !== false,
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

export async function createMasterTenant(payload: CreateMasterTenantPayload) {
  const { data } = await api.post<ApiSuccess<unknown>>(
    '/master/tenants',
    payload,
  )

  if (!data.success) {
    throw new Error('Não foi possível cadastrar o cliente.')
  }
}

export async function toggleMasterTenant(id: string) {
  const { data } = await api.patch<ApiSuccess<unknown>>(
    `/master/tenants/${id}/toggle`,
  )

  if (!data.success) {
    throw new Error('Não foi possível alterar o status do cliente.')
  }
}
