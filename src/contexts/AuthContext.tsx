import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import axios from 'axios'

import { api, TOKEN_STORAGE_KEY } from '@/services/api'
import { getCurrentTenant } from '@/services/tenantService'

const USER_STORAGE_KEY = '@rpg-saas:user'

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'TECHNICIAN'

export type AuthTenant = {
  id: string
  name: string
  tradeName: string | null
  logo_url: string | null
}

export type AuthUser = {
  id: string
  name: string
  email: string
  role: UserRole
  tenantId: string
  avatar_url: string | null
  tenant: AuthTenant | null
}

export type SignInCredentials = {
  email: string
  password: string
}

type SessionProfilePatch = Partial<
  Pick<AuthUser, 'name' | 'avatar_url' | 'tenant'>
>

type AuthContextValue = {
  user: AuthUser | null
  token: string | null
  signIn: (credentials: SignInCredentials) => Promise<void>
  signOut: () => void
  updateSession: (patch: SessionProfilePatch) => void
}

type LoginResponse = {
  success: boolean
  data?: {
    user: AuthUser
    token: string
  }
}

type ApiErrorBody = {
  message?: string
}

const AuthContext = createContext<AuthContextValue | null>(null)

function isUserRole(value: unknown): value is UserRole {
  return value === 'SUPER_ADMIN' || value === 'ADMIN' || value === 'TECHNICIAN'
}

function parseTenant(value: unknown): AuthTenant | null {
  if (!value || typeof value !== 'object') return null

  const tenant = value as Record<string, unknown>
  const logoUrl = tenant.logo_url
  const tradeName = tenant.tradeName

  if (typeof tenant.id !== 'string' || typeof tenant.name !== 'string') {
    return null
  }

  return {
    id: tenant.id,
    name: tenant.name,
    tradeName:
      typeof tradeName === 'string' && tradeName.trim().length > 0
        ? tradeName
        : null,
    logo_url:
      typeof logoUrl === 'string' && logoUrl.trim().length > 0 ? logoUrl : null,
  }
}

function parseAuthUser(value: unknown): AuthUser | null {
  if (!value || typeof value !== 'object') return null

  const user = value as Record<string, unknown>

  if (
    typeof user.id !== 'string' ||
    typeof user.name !== 'string' ||
    typeof user.email !== 'string' ||
    !isUserRole(user.role) ||
    typeof user.tenantId !== 'string'
  ) {
    return null
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
    avatar_url: typeof user.avatar_url === 'string' ? user.avatar_url : null,
    tenant: parseTenant(user.tenant),
  }
}

function readSession() {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)
  const rawUser = localStorage.getItem(USER_STORAGE_KEY)

  if (!token || !rawUser) {
    return { user: null, token: null }
  }

  try {
    const parsed = parseAuthUser(JSON.parse(rawUser) as unknown)

    if (!parsed) {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      localStorage.removeItem(USER_STORAGE_KEY)
      return { user: null, token: null }
    }

    return { user: parsed, token }
  } catch {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    localStorage.removeItem(USER_STORAGE_KEY)
    return { user: null, token: null }
  }
}

function toAuthError(error: unknown) {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const message = error.response?.data?.message

    if (typeof message === 'string' && message.length > 0) {
      return new Error(message)
    }

    if (!error.response) {
      return new Error('Não foi possível conectar ao servidor.')
    }
  }

  return new Error('Não foi possível entrar. Tente novamente.')
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(readSession)

  useEffect(() => {
    if (!session.token) return

    let ignore = false

    getCurrentTenant()
      .then((tenant) => {
        if (ignore) return

        setSession((current) => {
          if (!current.user) return current

          const user: AuthUser = {
            ...current.user,
            tenant: {
              id: tenant.id,
              name: tenant.name,
              tradeName: tenant.tradeName,
              logo_url: tenant.logo_url,
            },
          }

          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
          return { ...current, user }
        })
      })
      .catch(() => undefined)

    return () => {
      ignore = true
    }
  }, [session.token])

  const signIn = useCallback(async (credentials: SignInCredentials) => {
    try {
      const { data } = await api.post<LoginResponse>('/login', credentials)
      const user = parseAuthUser(data.data?.user)
      const token = data.data?.token

      if (!data.success || !token || !user) {
        throw new Error('Resposta de autenticação inválida.')
      }

      localStorage.setItem(TOKEN_STORAGE_KEY, token)
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
      setSession({ user, token })
    } catch (error) {
      if (
        error instanceof Error &&
        !axios.isAxiosError(error) &&
        error.message === 'Resposta de autenticação inválida.'
      ) {
        throw error
      }

      throw toAuthError(error)
    }
  }, [])

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    localStorage.removeItem(USER_STORAGE_KEY)
    setSession({ user: null, token: null })
  }, [])

  const updateSession = useCallback((patch: SessionProfilePatch) => {
    setSession((current) => {
      if (!current.user) return current

      const user = { ...current.user, ...patch }
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))

      return { ...current, user }
    })
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session.user,
      token: session.token,
      signIn,
      signOut,
      updateSession,
    }),
    [session, signIn, signOut, updateSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.')
  }

  return context
}
