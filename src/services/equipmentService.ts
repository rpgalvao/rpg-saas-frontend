import axios from 'axios';

import { api } from '@/services/api';

// 🟢 Adicionamos todos os status aqui
export type EquipmentStatus =
  | 'INSTALADO'
  | 'RECEBIDO'
  | 'EM_ANALISE'
  | 'REPARO'
  | 'FINALIZADO'
  | 'OS_CANCELADA';

export type EquipmentWritableStatus = EquipmentStatus;

export type Equipment = {
  id: string;
  serial_number: string;
  modelId: string;
  customerId: string | null;
  status: EquipmentStatus;
  active: boolean;
  model?: { id?: string; name: string; } | null;
  customer?: { id?: string; name: string; } | null;
};

export type EquipmentPayload = {
  serial_number: string;
  modelId: string;
  customerId?: string | null;
  status?: EquipmentWritableStatus;
};

type ApiSuccess<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

type ApiErrorBody = {
  message?: string;
};

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const message = error.response?.data?.message;

    if (typeof message === 'string' && message.length > 0) {
      return message;
    }

    if (!error.response) {
      return 'Não foi possível conectar ao servidor.';
    }
  }

  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return fallback;
}

export async function listEquipments() {
  const { data } = await api.get<ApiSuccess<Equipment[]>>('/equipment');

  if (!data.success || !Array.isArray(data.data)) {
    throw new Error('Resposta de equipamentos inválida.');
  }

  return data.data;
}

export async function createEquipment(payload: EquipmentPayload) {
  const { data } = await api.post<ApiSuccess<Equipment>>('/equipment', payload);

  if (!data.success || !data.data) {
    throw new Error('Não foi possível criar o equipamento.');
  }

  return data.data;
}

export async function updateEquipment(id: string, payload: EquipmentPayload) {
  const { data } = await api.put<ApiSuccess<Equipment>>(
    `/equipment/${id}`,
    payload,
  );

  if (!data.success || !data.data) {
    throw new Error('Não foi possível atualizar o equipamento.');
  }

  return data.data;
}

export async function deleteEquipment(id: string) {
  const { data } = await api.delete<ApiSuccess<unknown>>(`/equipment/${id}`);

  if (!data.success) {
    throw new Error('Não foi possível excluir o equipamento.');
  }
}
