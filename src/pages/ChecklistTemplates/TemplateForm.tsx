import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircleIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { ChecklistTemplate } from '@/services/checklistTemplateService'
import {
  getApiErrorMessage,
  listEquipmentModels,
  type EquipmentModel,
} from '@/services/equipmentModelService'

import {
  templateFormSchema,
  toTemplateFormValues,
  type TemplateFormValues,
} from './schema'

type TemplateFormProps = {
  open: boolean
  template: ChecklistTemplate | null
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: TemplateFormValues) => Promise<void>
}

export function TemplateForm({
  open,
  template,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: TemplateFormProps) {
  const [models, setModels] = useState<EquipmentModel[]>([])
  const [isLoadingModels, setIsLoadingModels] = useState(true)
  const [modelsError, setModelsError] = useState<string | null>(null)
  const [modelsSession, setModelsSession] = useState(0)

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: toTemplateFormValues(template),
  })

  useEffect(() => {
    if (!open) return

    let ignore = false

    listEquipmentModels()
      .then((data) => {
        if (!ignore) setModels(data.filter((model) => model.active))
      })
      .catch((error: unknown) => {
        if (ignore) return

        const message = getApiErrorMessage(
          error,
          'Não foi possível carregar os modelos.',
        )
        setModelsError(message)
        toast.error(message)
      })
      .finally(() => {
        if (!ignore) setIsLoadingModels(false)
      })

    return () => {
      ignore = true
    }
  }, [open, modelsSession])

  const modelOptions = useMemo(() => {
    if (
      !template?.modelId ||
      !template.model?.name ||
      models.some((model) => model.id === template.modelId)
    ) {
      return models
    }

    return [
      {
        id: template.modelId,
        name: template.model.name,
        active: false,
        created_at: '',
        updated_at: '',
      },
      ...models,
    ]
  }, [models, template])

  const isBusy = isSubmitting || isLoadingModels

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (isSubmitting) return
        onOpenChange(nextOpen)
      }}
    >
      <SheetContent className="w-full gap-0 overflow-hidden p-0 sm:max-w-md">
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle className="tracking-tight">
            {template ? 'Editar template' : 'Novo template'}
          </SheetTitle>
          <SheetDescription>
            {template
              ? 'Atualize o nome e o modelo de equipamento deste checklist.'
              : 'Crie um gabarito de manutenção para um modelo de equipamento.'}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
          >
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
              {isLoadingModels ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LoaderCircleIcon className="size-4 animate-spin" />
                  Carregando modelos
                </div>
              ) : null}

              {modelsError ? (
                <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 p-3">
                  <p className="text-sm text-muted-foreground">{modelsError}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="self-start"
                    onClick={() => {
                      setIsLoadingModels(true)
                      setModelsError(null)
                      setModelsSession((session) => session + 1)
                    }}
                  >
                    Tentar de novo
                  </Button>
                </div>
              ) : null}

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ex: Manutenção preventiva"
                        autoComplete="off"
                        disabled={isBusy}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="modelId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo de equipamento</FormLabel>
                    <Select
                      value={field.value || undefined}
                      onValueChange={field.onChange}
                      disabled={isBusy || modelOptions.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione um modelo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent position="popper">
                        {modelOptions.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {modelOptions.length === 0 && !isLoadingModels ? (
                      <FormDescription>
                        Cadastre um modelo ativo antes de criar o template.
                      </FormDescription>
                    ) : (
                      <FormDescription>
                        O checklist fica disponível para equipamentos deste modelo.
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <SheetFooter className="flex-row justify-end border-t bg-muted/40">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isBusy}>
                {isSubmitting ? (
                  <>
                    <LoaderCircleIcon className="animate-spin" />
                    Salvando
                  </>
                ) : template ? (
                  'Salvar alterações'
                ) : (
                  'Criar template'
                )}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
