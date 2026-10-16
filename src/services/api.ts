import axios from 'axios'

export const TOKEN_STORAGE_KEY = '@rpg-saas:token'

export const TENANT_BLOCKED_CODE = 'TENANT_BLOCKED'

export const api = axios.create({
  baseURL: 'http://localhost:3333/api',
})

type TenantBlockedListener = () => void

const tenantBlockedListeners = new Set<TenantBlockedListener>()

export function onTenantBlocked(listener: TenantBlockedListener) {
  tenantBlockedListeners.add(listener)

  return () => {
    tenantBlockedListeners.delete(listener)
  }
}

export function isTenantBlockedError(error: unknown) {
  if (!axios.isAxiosError(error) || error.response?.status !== 403) {
    return false
  }

  const body: unknown = error.response.data

  if (!body || typeof body !== 'object') return false

  const { error: code, code: altCode, message } = body as Record<
    string,
    unknown
  >

  return [code, altCode, message].includes(TENANT_BLOCKED_CODE)
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(undefined, (error: unknown) => {
  if (isTenantBlockedError(error)) {
    tenantBlockedListeners.forEach((listener) => listener())
  }

  return Promise.reject(error)
})
