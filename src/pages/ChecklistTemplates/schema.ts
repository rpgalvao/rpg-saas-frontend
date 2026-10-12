import { z } from 'zod'

import type { ChecklistQuestion, ChecklistTemplate } from '@/services/checklistTemplateService'

export const templateFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'O nome precisa ter pelo menos 3 caracteres'),
  modelId: z.string().uuid('Selecione um modelo'),
})

export type TemplateFormValues = z.infer<typeof templateFormSchema>

export const emptyTemplateFormValues: TemplateFormValues = {
  name: '',
  modelId: '',
}

export function toTemplateFormValues(
  template: ChecklistTemplate | null,
): TemplateFormValues {
  if (!template) return emptyTemplateFormValues

  return {
    name: template.name,
    modelId: template.modelId,
  }
}

export function toTemplatePayload(values: TemplateFormValues) {
  return {
    name: values.name.trim(),
    modelId: values.modelId,
  }
}

export const questionFormSchema = z.object({
  text: z
    .string()
    .trim()
    .min(5, 'A pergunta precisa ter pelo menos 5 caracteres'),
  order: z.string().trim().superRefine((value, context) => {
    if (value === '') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe a ordem.',
      })
      return
    }

    const order = Number(value)

    if (!Number.isInteger(order) || order <= 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A ordem deve ser um número inteiro positivo.',
      })
    }
  }),
})

export type QuestionFormValues = z.infer<typeof questionFormSchema>

export function emptyQuestionFormValues(order: number): QuestionFormValues {
  return {
    text: '',
    order: String(order),
  }
}

export function toQuestionFormValues(
  question: ChecklistQuestion,
): QuestionFormValues {
  return {
    text: question.text,
    order: String(question.order),
  }
}

export function toQuestionPayload(values: QuestionFormValues) {
  return {
    text: values.text.trim(),
    order: Number(values.order),
  }
}

export function nextQuestionOrder(questions: ChecklistQuestion[]) {
  if (questions.length === 0) return 1

  return Math.max(...questions.map((question) => question.order)) + 1
}
