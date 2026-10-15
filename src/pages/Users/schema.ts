import { z } from 'zod'

import { formatPhone } from '@/lib/formatters'
import type {
  CreateUserPayload,
  TeamUser,
  UpdateUserPayload,
} from '@/services/userService'

export const roleLabels: Record<TeamUser['role'], string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Administrador',
  TECHNICIAN: 'Técnico',
}

const userFieldsSchema = z.object({
  name: z.string().trim().min(2, 'O nome precisa ter pelo menos 2 caracteres'),
  email: z.string().trim().email('Informe um e-mail válido'),
  phone: z.string().trim(),
  role: z.enum(['ADMIN', 'TECHNICIAN']),
  password: z.string(),
  currentPassword: z.string(),
  newPassword: z.string(),
})

export type UserFormValues = z.infer<typeof userFieldsSchema>

export function userFormSchema(isEditing: boolean) {
  return userFieldsSchema.superRefine((values, context) => {
    if (!isEditing) {
      if (values.password.trim().length < 5) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['password'],
          message: 'A senha deve ter pelo menos 5 caracteres.',
        })
      }

      return
    }

    const currentPassword = values.currentPassword.trim()
    const newPassword = values.newPassword.trim()

    if (!currentPassword && !newPassword) return

    if (!currentPassword) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['currentPassword'],
        message: 'Informe a senha atual para alterá-la.',
      })
    }

    if (newPassword.length < 5) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['newPassword'],
        message: 'A nova senha deve ter pelo menos 5 caracteres.',
      })
    }
  })
}

export function toUserFormValues(user?: TeamUser | null): UserFormValues {
  return {
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: formatPhone(user?.phone),
    role: user?.role === 'TECHNICIAN' || !user ? 'TECHNICIAN' : 'ADMIN',
    password: '',
    currentPassword: '',
    newPassword: '',
  }
}

export function toCreateUserPayload(values: UserFormValues): CreateUserPayload {
  const phone = values.phone.trim()

  return {
    name: values.name.trim(),
    email: values.email.trim().toLowerCase(),
    password: values.password,
    role: values.role,
    ...(phone ? { phone } : {}),
  }
}

export function toUpdateUserPayload(values: UserFormValues): UpdateUserPayload {
  const phone = values.phone.trim()
  const currentPassword = values.currentPassword.trim()
  const newPassword = values.newPassword.trim()

  return {
    name: values.name.trim(),
    email: values.email.trim().toLowerCase(),
    role: values.role,
    phone,
    ...(currentPassword && newPassword
      ? { currentPassword, newPassword }
      : {}),
  }
}
