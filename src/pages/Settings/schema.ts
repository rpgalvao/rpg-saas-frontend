import { z } from 'zod'

export const profileFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'O nome precisa ter pelo menos 2 caracteres'),
    email: z.string(),
    phone: z.string().trim().refine((value) => {
      const digits = value.replace(/\D/g, '')
      return digits.length === 0 || digits.length === 10 || digits.length === 11
    }, 'Informe um telefone válido'),
    currentPassword: z.string(),
    newPassword: z.string(),
  })
  .superRefine((values, context) => {
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

export type ProfileFormValues = z.infer<typeof profileFormSchema>

export const tenantFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'A razão social precisa ter pelo menos 2 caracteres'),
  tradeName: z.string().trim(),
  cnpj: z.string().trim().refine((value) => {
    const digits = value.replace(/\D/g, '')
    return digits.length === 0 || digits.length === 14
  }, 'Informe um CNPJ válido'),
  phone: z.string().trim().refine((value) => {
    const digits = value.replace(/\D/g, '')
    return digits.length === 0 || digits.length === 10 || digits.length === 11
  }, 'Informe um telefone válido'),
  email: z.union([z.literal(''), z.string().email('Informe um e-mail válido')]),
})

export type TenantFormValues = z.infer<typeof tenantFormSchema>
