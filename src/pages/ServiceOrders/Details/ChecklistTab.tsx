import { CheckSquareIcon, LoaderCircleIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { ChecklistAnswer, ServiceOrder } from '@/services/serviceOrderService'

import { formatDateTime } from '../presentation'

export type ChecklistDraftAnswer = ChecklistAnswer & {
  is_evaluated: boolean
}

type ChecklistTabProps = {
  order: ServiceOrder
  answers: ChecklistDraftAnswer[]
  notes: string
  isSaving: boolean
  onNotesChange: (value: string) => void
  onUpdateAnswer: (
    answerId: string,
    field: 'is_ok' | 'comment',
    value: boolean | string,
  ) => void
  onSave: () => void
}

export function ChecklistTab({
  order,
  answers,
  notes,
  isSaving,
  onNotesChange,
  onUpdateAnswer,
  onSave,
}: ChecklistTabProps) {
  const isOpen = order.status === 'ABERTA'

  if (order.type === 'CORRETIVA') {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-6 py-16 text-center">
        <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
          <CheckSquareIcon className="size-4" strokeWidth={1.75} />
        </div>
        <p className="text-sm font-medium tracking-tight">
          O checklist não se aplica a este serviço.
        </p>
        <p className="max-w-md text-sm text-muted-foreground">
          Checklists são gerados apenas para serviços do tipo preventiva ou
          instalação.
        </p>
      </div>
    )
  }

  if (!order.checklist || answers.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-6 py-16 text-center">
        <p className="text-sm font-medium tracking-tight">
          Nenhum gabarito de checklist localizado.
        </p>
        <p className="max-w-md text-sm text-muted-foreground">
          O modelo deste equipamento pode não ter um gabarito ativo no momento da
          abertura da O.S.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold tracking-tight">
          Questionário de análise
        </h2>
        <p className="text-sm text-muted-foreground">
          {order.checklist.completed_at
            ? `Finalizado em ${formatDateTime(order.checklist.completed_at)}`
            : 'Preencha os itens abaixo durante a intervenção técnica.'}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {answers.map((answer) => (
          <article
            key={answer.id}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                  {answer.order}
                </span>
                <p className="text-sm leading-6">{answer.question_text}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={
                    answer.is_evaluated && answer.is_ok === true
                      ? 'default'
                      : 'outline'
                  }
                  disabled={!isOpen}
                  aria-pressed={answer.is_evaluated && answer.is_ok === true}
                  className={cn(
                    answer.is_evaluated &&
                      answer.is_ok === true &&
                      'border-emerald-600 bg-emerald-600 text-white shadow-none hover:bg-emerald-600/90 hover:text-white focus-visible:ring-emerald-600/30 disabled:opacity-100 dark:border-emerald-500 dark:bg-emerald-600 dark:text-white dark:hover:bg-emerald-600/90 dark:hover:text-white',
                  )}
                  onClick={() => onUpdateAnswer(answer.id, 'is_ok', true)}
                >
                  OK
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={
                    answer.is_evaluated && answer.is_ok === false
                      ? 'destructive'
                      : 'outline'
                  }
                  disabled={!isOpen}
                  aria-pressed={answer.is_evaluated && answer.is_ok === false}
                  className={cn(
                    answer.is_evaluated &&
                      answer.is_ok === false &&
                      'border-destructive bg-destructive text-white shadow-none hover:bg-destructive/90 hover:text-white disabled:opacity-100 dark:border-destructive dark:bg-destructive dark:text-white dark:hover:bg-destructive/90 dark:hover:text-white',
                  )}
                  onClick={() => onUpdateAnswer(answer.id, 'is_ok', false)}
                >
                  Com Problema
                </Button>
              </div>
            </div>
            <div className="mt-3 sm:pl-9">
              <Input
                value={answer.comment ?? ''}
                placeholder="Observações sobre este item (opcional)"
                disabled={!isOpen}
                onChange={(event) =>
                  onUpdateAnswer(answer.id, 'comment', event.target.value)
                }
              />
            </div>
          </article>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="checklist-notes"
          className="text-sm font-medium tracking-tight"
        >
          Observações gerais do checklist
        </label>
        <Textarea
          id="checklist-notes"
          rows={4}
          value={notes}
          placeholder="Anote considerações finais sobre o equipamento como um todo..."
          disabled={!isOpen}
          onChange={(event) => onNotesChange(event.target.value)}
        />
      </div>

      {isOpen ? (
        <div className="flex justify-end">
          <Button type="button" disabled={isSaving} onClick={onSave}>
            {isSaving ? (
              <>
                <LoaderCircleIcon className="animate-spin" />
                Salvando
              </>
            ) : (
              'Salvar respostas do checklist'
            )}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
