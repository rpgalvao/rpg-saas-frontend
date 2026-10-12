import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircleIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
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
import { Textarea } from '@/components/ui/textarea'
import { listCustomers, type Customer } from '@/services/customerService'
import { listEquipments, type Equipment } from '@/services/equipmentService'
import {
  createOrder,
  getApiErrorMessage,
} from '@/services/serviceOrderService'

import {
  emptyNewOrderFormValues,
  newOrderFormSchema,
  toCreateOrderPayload,
  type NewOrderFormValues,
} from './schema'

type NewOrderSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => Promise<void> | void
}

export function NewOrderSheet({
  open,
  onOpenChange,
  onCreated,
}: NewOrderSheetProps) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [isLoadingData, setIsLoadingData] = useState(open)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadSession, setLoadSession] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<NewOrderFormValues>({
    resolver: zodResolver(newOrderFormSchema),
    defaultValues: emptyNewOrderFormValues,
  })

  const customerId = useWatch({ control: form.control, name: 'customerId' })
  const equipmentId = useWatch({ control: form.control, name: 'equipmentId' })
  const problemDescription = useWatch({
    control: form.control,
    name: 'problem_description',
  })
  const availableEquipments = equipments.filter(
    (equipment) => equipment.customerId === customerId,
  )

  useEffect(() => {
    if (!open) return

    let ignore = false

    Promise.all([listCustomers(), listEquipments()])
      .then(([customersData, equipmentsData]) => {
        if (ignore) return
        setCustomers(customersData.filter((customer) => customer.active))
        setEquipments(equipmentsData)
      })
      .catch((error: unknown) => {
        if (ignore) return

        const message = getApiErrorMessage(
          error,
          'Falha ao carregar as listas do banco de dados.',
        )
        setLoadError(message)
        toast.error(message)
      })
      .finally(() => {
        if (!ignore) setIsLoadingData(false)
      })

    return () => {
      ignore = true
    }
  }, [open, loadSession])

  const isBusy = isSubmitting || isLoadingData

  async function handleSubmit(values: NewOrderFormValues) {
    setIsSubmitting(true)

    try {
      await createOrder(toCreateOrderPayload(values))
      toast.success('Ordem de serviço aberta.')
      onOpenChange(false)
      await onCreated()
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Ocorreu um erro ao abrir a ordem de serviço.'),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (isSubmitting) return
        onOpenChange(nextOpen)
      }}
    >
      <SheetContent className="w-full gap-0 overflow-hidden p-0 sm:max-w-lg">
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle className="tracking-tight">Nova ordem de serviço</SheetTitle>
          <SheetDescription>
            Registre a entrada de um equipamento para manutenção.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={form.handleSubmit(handleSubmit)}
            noValidate
          >
            <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
              {isLoadingData ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LoaderCircleIcon className="size-4 animate-spin" />
                  Carregando dados necessários
                </div>
              ) : null}

              {loadError ? (
                <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 p-3">
                  <p className="text-sm text-muted-foreground">{loadError}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="self-start"
                    onClick={() => {
                      setIsLoadingData(true)
                      setLoadError(null)
                      setLoadSession((session) => session + 1)
                    }}
                  >
                    Tentar de novo
                  </Button>
                </div>
              ) : null}

              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select
                      value={field.value || undefined}
                      onValueChange={(value) => {
                        field.onChange(value)
                        form.setValue('equipmentId', '', { shouldValidate: false })
                      }}
                      disabled={isBusy}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione o cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent align="start" className="z-[60]">
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="equipmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Equipamento (S/N)</FormLabel>
                    <Select
                      value={field.value || undefined}
                      onValueChange={field.onChange}
                      disabled={isBusy || !customerId}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={
                              customerId
                                ? 'Selecione a máquina'
                                : 'Selecione um cliente primeiro'
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent align="start" className="z-[60]">
                        {availableEquipments.map((equipment) => (
                          <SelectItem key={equipment.id} value={equipment.id}>
                            {equipment.serial_number}
                            {equipment.model?.name
                              ? ` - ${equipment.model.name}`
                              : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {customerId && availableEquipments.length === 0 ? (
                      <FormDescription className="text-amber-700 dark:text-amber-300">
                        Este cliente não possui equipamentos cadastrados.
                      </FormDescription>
                    ) : null}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de serviço</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isBusy}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent align="start" className="z-[60]">
                        <SelectItem value="CORRETIVA">
                          Manutenção corretiva (conserto)
                        </SelectItem>
                        <SelectItem value="PREVENTIVA">
                          Manutenção preventiva (revisão)
                        </SelectItem>
                        <SelectItem value="INSTALACAO">
                          Instalação de equipamento
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="problem_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relato do cliente</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={4}
                        maxLength={255}
                        placeholder="Descreva o que está acontecendo com a máquina..."
                        disabled={isBusy}
                      />
                    </FormControl>
                    <FormDescription
                      className={
                        problemDescription.length > 255
                          ? 'text-right text-destructive'
                          : 'text-right'
                      }
                    >
                      {problemDescription.length}/255
                    </FormDescription>
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
              <Button type="submit" disabled={isBusy || !equipmentId}>
                {isSubmitting ? (
                  <>
                    <LoaderCircleIcon className="animate-spin" />
                    Abrindo
                  </>
                ) : (
                  'Abrir O.S.'
                )}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
