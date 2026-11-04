import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircleIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  getApiErrorMessage,
  listCustomers,
  type Customer,
} from '@/services/customerService'

import {
  dealFormSchema,
  emptyDealFormValues,
  formatCurrencyInput,
  type DealFormValues,
} from './schema'

type DealFormProps = {
  open: boolean
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: DealFormValues) => Promise<void>
}

export function DealForm({
  open,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: DealFormProps) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true)
  const [customersError, setCustomersError] = useState<string | null>(null)

  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: emptyDealFormValues,
  })

  useEffect(() => {
    if (!open) return

    form.reset(emptyDealFormValues)

    let ignore = false

    listCustomers()
      .then((data) => {
        if (ignore) return
        setCustomers(data.filter((customer) => customer.active))
        setCustomersError(null)
      })
      .catch((error: unknown) => {
        if (ignore) return

        const message = getApiErrorMessage(
          error,
          'Não foi possível carregar os clientes.',
        )
        setCustomers([])
        setCustomersError(message)
        toast.error(message)
      })
      .finally(() => {
        if (!ignore) setIsLoadingCustomers(false)
      })

    return () => {
      ignore = true
    }
  }, [open, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Negócio</DialogTitle>
          <DialogDescription>
            Cadastre uma oportunidade e associe a um cliente existente.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit((values) => void onSubmit(values))}
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ex.: Venda de peças e instalação"
                      autoComplete="off"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="estimatedValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor estimado</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      inputMode="decimal"
                      placeholder="0,00"
                      autoComplete="off"
                      disabled={isSubmitting}
                      onChange={(event) => {
                        field.onChange(formatCurrencyInput(event.target.value))
                      }}
                    />
                  </FormControl>
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
                    value={field.value || undefined}
                    onValueChange={field.onChange}
                    disabled={isSubmitting || isLoadingCustomers}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            isLoadingCustomers
                              ? 'Carregando clientes...'
                              : 'Selecione um cliente'
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {customersError ? (
                    <p className="text-sm text-destructive">{customersError}</p>
                  ) : (
                    <FormMessage />
                  )}
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || isLoadingCustomers}>
                {isSubmitting ? (
                  <>
                    <LoaderCircleIcon className="size-4 animate-spin" />
                    Salvando
                  </>
                ) : (
                  'Criar negócio'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
