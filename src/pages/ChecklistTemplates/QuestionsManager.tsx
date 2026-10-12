import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircleIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  addChecklistQuestion,
  deleteChecklistQuestion,
  getApiErrorMessage,
  updateChecklistQuestion,
  type ChecklistQuestion,
  type ChecklistTemplate,
} from '@/services/checklistTemplateService'

import {
  emptyQuestionFormValues,
  nextQuestionOrder,
  questionFormSchema,
  toQuestionFormValues,
  toQuestionPayload,
  type QuestionFormValues,
} from './schema'

type QuestionsManagerProps = {
  open: boolean
  template: ChecklistTemplate | null
  onOpenChange: (open: boolean) => void
  onChanged: () => Promise<void>
}

export function QuestionsManager({
  open,
  template,
  onOpenChange,
  onChanged,
}: QuestionsManagerProps) {
  const [editingQuestion, setEditingQuestion] = useState<ChecklistQuestion | null>(
    null,
  )
  const [isSaving, setIsSaving] = useState(false)
  const [questionToDelete, setQuestionToDelete] = useState<ChecklistQuestion | null>(
    null,
  )
  const [isDeleting, setIsDeleting] = useState(false)

  const questions = useMemo(
    () =>
      [...(template?.questions ?? [])].sort(
        (left, right) => left.order - right.order,
      ),
    [template],
  )

  const suggestedOrder = nextQuestionOrder(questions)

  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: emptyQuestionFormValues(suggestedOrder),
  })

  useEffect(() => {
    if (editingQuestion) {
      form.reset(toQuestionFormValues(editingQuestion))
      return
    }

    form.reset(emptyQuestionFormValues(suggestedOrder))
  }, [editingQuestion, form, suggestedOrder])

  async function handleSubmit(values: QuestionFormValues) {
    if (!template) return

    setIsSaving(true)

    try {
      const payload = toQuestionPayload(values)

      if (editingQuestion) {
        await updateChecklistQuestion(editingQuestion.id, payload)
        toast.success('Pergunta atualizada.')
        setEditingQuestion(null)
      } else {
        await addChecklistQuestion(template.id, payload)
        toast.success('Pergunta adicionada.')
      }

      await onChanged()
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          editingQuestion
            ? 'Não foi possível atualizar a pergunta.'
            : 'Não foi possível adicionar a pergunta.',
        ),
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!questionToDelete) return

    setIsDeleting(true)

    try {
      await deleteChecklistQuestion(questionToDelete.id)
      toast.success('Pergunta removida.')

      if (editingQuestion?.id === questionToDelete.id) {
        setEditingQuestion(null)
      }

      setQuestionToDelete(null)
      await onChanged()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível remover a pergunta.'))
    } finally {
      setIsDeleting(false)
    }
  }

  const isBusy = isSaving || isDeleting

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(nextOpen) => {
          if (isBusy) return
          if (!nextOpen) setEditingQuestion(null)
          onOpenChange(nextOpen)
        }}
      >
        <SheetContent className="w-full gap-0 overflow-hidden p-0 sm:max-w-lg">
          <SheetHeader className="border-b px-6 py-5">
            <SheetTitle className="tracking-tight">
              {template?.name ?? 'Perguntas'}
            </SheetTitle>
            <SheetDescription>
              {template?.model?.name
                ? `Perguntas do modelo ${template.model.name}.`
                : 'Organize as perguntas deste template.'}
            </SheetDescription>
          </SheetHeader>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {questions.length === 0 ? (
                <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed border-border px-4 py-10 text-center">
                  <p className="text-sm font-medium tracking-tight">
                    Nenhuma pergunta
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Adicione a primeira pergunta deste checklist.
                  </p>
                </div>
              ) : (
                <ul className="flex flex-col gap-2">
                  {questions.map((question) => {
                    const isEditing = editingQuestion?.id === question.id

                    return (
                      <li
                        key={question.id}
                        className={
                          isEditing
                            ? 'flex items-start gap-3 rounded-lg border border-border bg-muted/60 px-3 py-3'
                            : 'flex items-start gap-3 rounded-lg border border-border px-3 py-3'
                        }
                      >
                        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium text-muted-foreground tabular-nums">
                          {question.order}
                        </span>
                        <p className="min-w-0 flex-1 text-sm leading-5">
                          {question.text}
                        </p>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Editar pergunta ${question.order}`}
                            disabled={isBusy}
                            onClick={() => setEditingQuestion(question)}
                          >
                            <PencilIcon />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground hover:text-destructive"
                            aria-label={`Remover pergunta ${question.order}`}
                            disabled={isBusy}
                            onClick={() => setQuestionToDelete(question)}
                          >
                            <Trash2Icon />
                          </Button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            <Form {...form}>
              <form
                className="flex flex-col gap-4 border-t bg-muted/40 px-6 py-5"
                onSubmit={form.handleSubmit(handleSubmit)}
                noValidate
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium tracking-tight">
                    {editingQuestion ? 'Editar pergunta' : 'Nova pergunta'}
                  </p>
                  {editingQuestion ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isBusy}
                      onClick={() => setEditingQuestion(null)}
                    >
                      Cancelar edição
                    </Button>
                  ) : null}
                </div>

                <div className="grid grid-cols-[5.5rem_1fr] gap-3">
                  <FormField
                    control={form.control}
                    name="order"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ordem</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            inputMode="numeric"
                            min="1"
                            step="1"
                            disabled={isBusy}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pergunta</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Ex: O cabo de força está íntegro?"
                            autoComplete="off"
                            disabled={isBusy}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isBusy || !template}>
                    {isSaving ? (
                      <>
                        <LoaderCircleIcon className="animate-spin" />
                        Salvando
                      </>
                    ) : editingQuestion ? (
                      'Salvar pergunta'
                    ) : (
                      'Adicionar pergunta'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={questionToDelete !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !isDeleting) setQuestionToDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover pergunta</AlertDialogTitle>
            <AlertDialogDescription>
              {questionToDelete
                ? `A pergunta "${questionToDelete.text}" será excluída deste template.`
                : 'Essa pergunta será excluída deste template.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={() => void handleDelete()}
            >
              {isDeleting ? (
                <>
                  <LoaderCircleIcon className="animate-spin" />
                  Removendo
                </>
              ) : (
                'Remover'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
