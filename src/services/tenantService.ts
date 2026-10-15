import { api } from '@/services/api';

export type Tenant = {
  id: string;
  name: string;
  tradeName: string | null;
  cnpj: string | null;
  logo_url: string | null;
  phone: string | null;
  email: string | null;
};

type ApiSuccess<T> = {
  success: boolean;
  data?: T;
};

export async function getCurrentTenant() {
  const { data } = await api.get<ApiSuccess<Tenant>>('/tenant/me');

  if (!data.success || !data.data) {
    throw new Error('Não foi possível carregar os dados da empresa.');
  }

  return data.data;
}

export async function updateTenant(id: string, formData: FormData) {
  const { data } = await api.put<ApiSuccess<Tenant>>('/tenant/me', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  if (!data.success || !data.data) {
    throw new Error('Não foi possível atualizar a empresa.');
  }

  return data.data;
}
