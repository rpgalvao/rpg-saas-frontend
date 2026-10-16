import { zodResolver } from '@hookform/resolvers/zod'
import { Building2Icon, KeyRoundIcon, LoaderCircleIcon } from 'lucide-react'
import type { ReactNode } from 'react'
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
import { formatCnpj } from '@/lib/formatters'
import {
  fetchAddressByCep,
  fetchCompanyByCnpj,
} from '@/services/brasilApiService'

import { AddressFields } from './AddressFields'
import {
  emptyTenantFormValues,
  tenantFormSchema,
  type TenantFormValues,
} from './schema'

type TenantFormProps = {
  open: boolean
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: TenantFormValues) => Promise<void>
}

function FormSection({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {icon}
          {title}
        </div>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  )
}

function OptionalLabel({ children }: { children: ReactNode }) {
  return (
    <FormLabel>
      {children}{' '}
      <span className="font-normal text-muted-foreground">(opcional)</span>
    </FormLabel>
  )
}

export function TenantForm({
  open,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: TenantFormProps) {
  const [isFetchingCnpj, setIsFetchingCnpj] = useState(false)
  const [isFetchingCep, setIsFetchingCep] = useState(false)
  const lastFetchedCnpj = useRef<string | null>(null)
  const lastFetchedCep = useRef<string | null>(null)
  const form = useForm<TenantFormValues>({
    resolver: zodResolver(tenantFormSchema),
    defaultValues: emptyTenantFormValues,
  })

  const cnpjValue = useWatch({ control: form.control, name: 'cnpj' })
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

        form.setValue('street', address.street, { shouldDirty: true })
        form.setValue('neighborhood', address.neighborhood, {
          shouldDirty: true,
        })
        form.setValue('city', address.city, { shouldDirty: true })
        form.setValue('state', address.state, { shouldDirty: true })
        form.setValue('cep', address.cep, { shouldDirty: true })
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

  useEffect(() => {
    const digits = (cnpjValue ?? '').replace(/\D/g, '')

    if (digits.length !== 14) {
      lastFetchedCnpj.current = null
      return
    }

    if (lastFetchedCnpj.current === digits) return

    let ignore = false
    lastFetchedCnpj.current = digits
    setIsFetchingCnpj(true)

    fetchCompanyByCnpj(digits)
      .then((company) => {
        if (ignore) return

        const fields: Array<keyof TenantFormValues> = [
          'name',
          'tradeName',
          'cep',
          'street',
          'number',
          'complement',
          'neighborhood',
          'city',
          'state',
        ]

        form.setValue('name', company.name, { shouldDirty: true, shouldValidate: true })
        form.setValue('tradeName', company.tradeName, {
          shouldDirty: true,
          shouldValidate: true,
        })
        if (company.cep) {
          lastFetchedCep.current = company.cep.replace(/\D/g, '')
        }

        form.setValue('cep', company.cep, { shouldDirty: true })
        form.setValue('street', company.street, { shouldDirty: true })
        form.setValue('number', company.number, { shouldDirty: true })
        form.setValue('complement', company.complement, { shouldDirty: true })
        form.setValue('neighborhood', company.neighborhood, {
          shouldDirty: true,
        })
        form.setValue('city', company.city, { shouldDirty: true })
        form.setValue('state', company.state, { shouldDirty: true })

        void form.trigger(fields)
        toast.success('Dados do CNPJ preenchidos automaticamente.')
      })
      .catch((error: unknown) => {
        if (ignore) return

        lastFetchedCnpj.current = null
        toast.error(
          error instanceof Error
            ? error.message
            : 'Não foi possível consultar o CNPJ.',
        )
      })
      .finally(() => {
        if (!ignore) setIsFetchingCnpj(false)
      })

    return () => {
      ignore = true
    }
  }, [cnpjValue, form])

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (isSubmitting || isFetchingCnpj || isFetchingCep) return
        onOpenChange(nextOpen)
      }}
    >
      <SheetContent className="w-full gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle className="tracking-tight">Novo Cliente</SheetTitle>
          <SheetDescription>
            Informe o CNPJ para preencher os dados da empresa automaticamente.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
          >
            <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-5">
              <FormSection
                icon={<Building2Icon className="size-3.5" strokeWidth={1.75} />}
                title="Dados da Empresa"
                description="Informações cadastrais e fiscais do assinante."
              >
                <FormField
                  control={form.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            {...field}
                            inputMode="numeric"
                            placeholder="00.000.000/0000-00"
                            className="tabular-nums pr-10"
                            disabled={isSubmitting || isFetchingCnpj}
                            onChange={(event) =>
                              field.onChange(formatCnpj(event.target.value))
                            }
                          />
                        </FormControl>
                        {isFetchingCnpj ? (
                          <LoaderCircleIcon
                            className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
                            aria-label="Consultando CNPJ"
                          />
                        ) : null}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Razão Social</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          autoComplete="organization"
                          disabled={isSubmitting || isFetchingCnpj}
                        />
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
                        <Input
                          {...field}
                          disabled={isSubmitting || isFetchingCnpj}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <AddressFields
                  control={form.control}
                  disabled={isSubmitting || isFetchingCnpj}
                  isFetchingCep={isFetchingCep}
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="stateRegistration"
                    render={({ field }) => (
                      <FormItem className="min-w-0">
                        <OptionalLabel>IE</OptionalLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Inscrição Estadual"
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="municipalRegistration"
                    render={({ field }) => (
                      <FormItem className="min-w-0">
                        <OptionalLabel>IM</OptionalLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Inscrição Municipal"
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </FormSection>

              <div className="border-t border-border" />

              <FormSection
                icon={<KeyRoundIcon className="size-3.5" strokeWidth={1.75} />}
                title="Dados de Acesso (Administrador)"
                description="Credenciais do primeiro administrador da empresa."
              >
                <FormField
                  control={form.control}
                  name="adminName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
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
                  name="adminEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          inputMode="email"
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
                  name="adminPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          autoComplete="new-password"
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <p className="text-sm text-muted-foreground">
                  Compartilhe essas credenciais com o cliente. Ele poderá
                  alterar a senha depois do primeiro acesso.
                </p>
              </FormSection>
            </div>

            <SheetFooter className="flex-row justify-end border-t bg-muted/40">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting || isFetchingCnpj || isFetchingCep}
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isFetchingCnpj || isFetchingCep}
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircleIcon className="animate-spin" />
                    Cadastrando
                  </>
                ) : (
                  'Cadastrar cliente'
                )}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
