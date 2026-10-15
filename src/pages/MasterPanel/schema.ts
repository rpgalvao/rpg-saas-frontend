import { z } from 'zod'

import type { CreateMasterTenantPayload } from '@/services/masterService'

export const tenantFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'A razão social precisa ter pelo menos 2 caracteres'),
  tradeName: z.string().trim(),
  cnpj: z
    .string()
    .trim()
    .refine(
      (value) => value.replace(/\D/g, '').length === 14,
      'Informe um CNPJ com 14 dígitos',
    ),
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
  adminEmail: '',
  adminPassword: '',
}

export function toCreateTenantPayload(
  values: TenantFormValues,
): CreateMasterTenantPayload {
  const tradeName = values.tradeName.trim()

  return {
    name: values.name.trim(),
    cnpj: values.cnpj.replace(/\D/g, ''),
    adminEmail: values.adminEmail.trim().toLowerCase(),
    adminPassword: values.adminPassword,
    ...(tradeName ? { tradeName } : {}),
  }
}
