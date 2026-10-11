import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import axios from 'axios'

import { api, TOKEN_STORAGE_KEY } from '@/services/api'

const USER_STORAGE_KEY = '@rpg-saas:user'

export type UserRole = 'ADMIN' | 'TECHNICIAN'

export type AuthUser = {
  id: string
  name: string
  email: string
  role: UserRole
  tenantId: string
  avatar_url: string | null
}

export type SignInCredentials = {
  email: string
  password: string
}

type AuthContextValue = {
  user: AuthUser | null
  token: string | null
  signIn: (credentials: SignInCredentials) => Promise<void>
  signOut: () => void
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
  return value === 'ADMIN' || value === 'TECHNICIAN'
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

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session.user,
      token: session.token,
      signIn,
      signOut,
    }),
    [session, signIn, signOut],
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
