import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircleIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'

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
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { formatCnpj } from '@/lib/formatters'
import { fetchAddressByCep } from '@/services/brasilApiService'
import type { MasterTenantDetails } from '@/services/masterService'

import { AddressFields } from './AddressFields'
import {
  editTenantFormSchema,
  toEditTenantFormValues,
  type EditTenantFormValues,
} from './schema'

type EditTenantFormProps = {
  open: boolean
  tenant: MasterTenantDetails
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: EditTenantFormValues) => Promise<void>
}

export function EditTenantForm({
  open,
  tenant,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: EditTenantFormProps) {
  const [isFetchingCep, setIsFetchingCep] = useState(false)
  const initialValues = toEditTenantFormValues(tenant)
  const initialCepDigits = initialValues.cep.replace(/\D/g, '')
  const lastFetchedCep = useRef<string | null>(
    initialCepDigits.length === 8 ? initialCepDigits : null,
  )
  const form = useForm<EditTenantFormValues>({
    resolver: zodResolver(editTenantFormSchema),
    defaultValues: initialValues,
  })

  const cepValue = useWatch({ control: form.control, name: 'cep' })

  useEffect(() => {
    const digits = (cepValue ?? '').replace(/\D/g, '')

    if (digits.length !== 8) {
      lastFetchedCep.current = null
      return
    }

    if (lastFetchedCep.current === digits) return

    let ignore = false
    lastFetchedCep.current = digits
    setIsFetchingCep(true)

    fetchAddressByCep(digits)
      .then((address) => {
        if (ignore) return

        form.setValue('street', address.street, {
          shouldDirty: true,
          shouldValidate: true,
        })
        form.setValue('neighborhood', address.neighborhood, {
          shouldDirty: true,
          shouldValidate: true,
        })
        form.setValue('city', address.city, {
          shouldDirty: true,
          shouldValidate: true,
        })
        form.setValue('state', address.state, {
          shouldDirty: true,
          shouldValidate: true,
        })
        form.setValue('cep', address.cep, { shouldDirty: true })
        toast.success('Endereço preenchido pelo CEP.')
      })
      .catch((error: unknown) => {
        if (ignore) return
        lastFetchedCep.current = null
        toast.error(
          error instanceof Error
            ? error.message
            : 'Não foi possível consultar o CEP.',
        )
      })
      .finally(() => {
        if (!ignore) setIsFetchingCep(false)
      })

    return () => {
      ignore = true
    }
  }, [cepValue, form])

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (isSubmitting || isFetchingCep) return
        onOpenChange(nextOpen)
      }}
    >
      <SheetContent className="w-full gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle className="tracking-tight">Editar Cliente</SheetTitle>
          <SheetDescription>
            Atualize os dados cadastrais e o status da assinatura. Informe o CEP
            para preencher o endereço automaticamente.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
          >
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razão Social</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tradeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Fantasia</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        inputMode="numeric"
                        placeholder="00.000.000/0000-00"
                        className="tabular-nums"
                        disabled={isSubmitting}
                        onChange={(e) =>
                          field.onChange(formatCnpj(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <AddressFields
                control={form.control}
                disabled={isSubmitting}
                isFetchingCep={isFetchingCep}
              />

              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 min-w-0 md:col-span-6">
                  <FormField
                    control={form.control}
                    name="stateRegistration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          IE{' '}
                          <span className="font-normal text-muted-foreground">
                            (opcional)
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Inscrição Estadual"
                            className="w-full"
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="col-span-12 min-w-0 md:col-span-6">
                  <FormField
                    control={form.control}
                    name="municipalRegistration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          IM{' '}
                          <span className="font-normal text-muted-foreground">
                            (opcional)
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Inscrição Municipal"
                            className="w-full"
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <FormLabel className="text-sm font-medium">
                        Assinatura ativa
                      </FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Desative para bloquear o acesso do cliente.
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                        aria-label="Assinatura ativa"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <SheetFooter className="flex-row justify-end border-t bg-muted/40">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting || isFetchingCep}
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isFetchingCep}
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircleIcon className="animate-spin" />
                    Salvando
                  </>
                ) : (
                  'Salvar alterações'
                )}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
