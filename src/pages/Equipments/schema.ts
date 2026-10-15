import { z } from 'zod';

import type { EquipmentModel } from '@/services/equipmentModelService';
import type {
  Equipment,
  EquipmentPayload,
  EquipmentStatus,
  EquipmentWritableStatus,
} from '@/services/equipmentService';

export const equipmentStatusLabels: Record<EquipmentStatus, string> = {
  INSTALADO: 'Instalado',
  RECEBIDO: 'Recebido',
  EM_ANALISE: 'Em análise',
  REPARO: 'Reparo',
  FINALIZADO: 'Finalizado',
  OS_CANCELADA: 'OS cancelada',
};

// 🟢 Liberamos todos os status para edição manual no modo SaaS
export const writableEquipmentStatuses = [
  'INSTALADO',
  'RECEBIDO',
  'EM_ANALISE',
  'REPARO',
  'FINALIZADO',
  'OS_CANCELADA'
] as const satisfies readonly EquipmentWritableStatus[];

export const modelFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'O nome precisa ter pelo menos 2 caracteres'),
  brand: z.string().trim(),
});

export type ModelFormValues = z.infer<typeof modelFormSchema>;

export const emptyModelFormValues: ModelFormValues = {
  name: '',
  brand: '',
};

export function toModelFormValues(model: EquipmentModel | null): ModelFormValues {
  if (!model) return emptyModelFormValues;
  return { name: model.name, brand: model.brand ?? '' };
}

export function toModelPayload(values: ModelFormValues) {
  return {
    name: values.name.trim(),
    brand: values.brand.trim(),
  };
}

export const equipmentFormSchema = z.object({
  serial_number: z
    .string()
    .trim()
    .min(2, 'O número de série precisa ter pelo menos 2 caracteres'),
  modelId: z.string().uuid('Selecione um modelo'),
  customerId: z.string(),
  status: z.enum([
    'INSTALADO',
    'RECEBIDO',
    'EM_ANALISE',
    'REPARO',
    'FINALIZADO',
    'OS_CANCELADA',
  ]),
});

export type EquipmentFormValues = z.infer<typeof equipmentFormSchema>;

export const emptyEquipmentFormValues: EquipmentFormValues = {
  serial_number: '',
  modelId: '',
  customerId: '',
  status: 'EM_ANALISE',
};

export function toEquipmentFormValues(
  equipment: Equipment | null,
): EquipmentFormValues {
  if (!equipment) return emptyEquipmentFormValues;

  return {
    serial_number: equipment.serial_number,
    modelId: equipment.modelId,
    customerId: equipment.customerId ?? '',
    status: equipment.status,
  };
}

function isWritableStatus(status: string): status is EquipmentWritableStatus {
  return (writableEquipmentStatuses as readonly string[]).includes(status);
}

export function toEquipmentPayload(
  values: EquipmentFormValues,
  mode: 'create' | 'update',
): EquipmentPayload {
  const payload: EquipmentPayload = {
    serial_number: values.serial_number.trim().toUpperCase(),
    modelId: values.modelId,
  };

  if (isWritableStatus(values.status)) {
    payload.status = values.status;
  }

  if (values.customerId) {
    payload.customerId = values.customerId;
  } else if (mode === 'update') {
    payload.customerId = null;
  }

  return payload;
}
