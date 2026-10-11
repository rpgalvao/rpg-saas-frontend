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
import { listCustomers, type Customer } from '@/services/customerService'
import type { Equipment } from '@/services/equipmentService'
import {
  getApiErrorMessage,
  listEquipmentModels,
  type EquipmentModel,
} from '@/services/equipmentModelService'

import {
  equipmentFormSchema,
  equipmentStatusLabels,
  toEquipmentFormValues,
  writableEquipmentStatuses,
  type EquipmentFormValues,
} from './schema'

const STOCK_VALUE = '__stock__'

type EquipmentFormProps = {
  open: boolean
  equipment: Equipment | null
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: EquipmentFormValues) => Promise<void>
}

export function EquipmentForm({
  open,
  equipment,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: EquipmentFormProps) {
  const [models, setModels] = useState<EquipmentModel[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)
  const [optionsError, setOptionsError] = useState<string | null>(null)
  const [optionsSession, setOptionsSession] = useState(0)

  const form = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentFormSchema),
    defaultValues: toEquipmentFormValues(equipment),
  })

  useEffect(() => {
    if (!open) return

    let ignore = false

    Promise.all([listEquipmentModels(), listCustomers()])
      .then(([modelList, customerList]) => {
        if (ignore) return
        setModels(modelList.filter((model) => model.active))
        setCustomers(customerList.filter((customer) => customer.active))
      })
      .catch((error: unknown) => {
        if (ignore) return

        const message = getApiErrorMessage(
          error,
          'Não foi possível carregar modelos e clientes.',
        )
        setOptionsError(message)
        toast.error(message)
      })
      .finally(() => {
        if (!ignore) setIsLoadingOptions(false)
      })

    return () => {
      ignore = true
    }
  }, [open, optionsSession])

  const modelOptions = useMemo(() => {
    if (!equipment?.model || models.some((model) => model.id === equipment.modelId)) {
      return models
    }

    return [
      {
        id: equipment.modelId,
        name: equipment.model.name,
        active: false,
        created_at: '',
        updated_at: '',
      },
      ...models,
    ]
  }, [equipment, models])

  const customerOptions = useMemo(() => {
    if (
      !equipment?.customer ||
      !equipment.customerId ||
      customers.some((customer) => customer.id === equipment.customerId)
    ) {
      return customers
    }

    return [
      {
        id: equipment.customerId,
        name: equipment.customer.name,
        email: null,
        phone: null,
        zipcode: null,
        city: '',
        state: '',
        address: null,
        number: null,
        complement: null,
        neighborhood: null,
        active: false,
        created_at: '',
      },
      ...customers,
    ]
  }, [customers, equipment])

  const statusOptions = useMemo(() => {
    const current = equipment?.status

    if (current && !writableEquipmentStatuses.some((status) => status === current)) {
      return [current, ...writableEquipmentStatuses]
    }

    return [...writableEquipmentStatuses]
  }, [equipment])

  const isBusy = isSubmitting || isLoadingOptions

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
            {equipment ? 'Editar equipamento' : 'Novo equipamento'}
          </SheetTitle>
          <SheetDescription>
            {equipment
              ? 'Atualize o número de série, o modelo e o cliente desta máquina.'
              : 'Registre uma máquina física no parque.'}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
          >
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
              {isLoadingOptions ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LoaderCircleIcon className="size-4 animate-spin" />
                  Carregando modelos e clientes
                </div>
              ) : null}

              {optionsError ? (
                <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 p-3">
                  <p className="text-sm text-muted-foreground">{optionsError}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="self-start"
                    onClick={() => {
                      setIsLoadingOptions(true)
                      setOptionsError(null)
                      setOptionsSession((session) => session + 1)
                    }}
                  >
                    Tentar de novo
                  </Button>
                </div>
              ) : null}

              <FormField
                control={form.control}
                name="serial_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de série</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ex: SN-9001-XYZ"
                        autoComplete="off"
                        className="uppercase"
                        disabled={isBusy}
                        onChange={(event) =>
                          field.onChange(event.target.value.toUpperCase())
                        }
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
                    <FormLabel>Modelo</FormLabel>
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
                    {modelOptions.length === 0 && !isLoadingOptions ? (
                      <FormDescription>
                        Cadastre um modelo ativo antes de registrar o equipamento.
                      </FormDescription>
                    ) : null}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select
                      value={field.value || STOCK_VALUE}
                      onValueChange={(value) =>
                        field.onChange(value === STOCK_VALUE ? '' : value)
                      }
                      disabled={isBusy}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Em estoque/oficina" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent position="popper">
                        <SelectItem value={STOCK_VALUE}>
                          Em estoque/oficina
                        </SelectItem>
                        {customerOptions.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Opcional. Sem cliente, o equipamento fica em estoque ou na oficina.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isBusy}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent position="popper">
                        {statusOptions.map((status) => (
                          <SelectItem key={status} value={status}>
                            {equipmentStatusLabels[status]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                ) : equipment ? (
                  'Salvar alterações'
                ) : (
                  'Criar equipamento'
                )}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
