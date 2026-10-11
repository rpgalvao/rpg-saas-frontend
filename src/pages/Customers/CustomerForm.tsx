import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircleIcon } from 'lucide-react'
import { useRef } from 'react'
import { useForm } from 'react-hook-form'

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
import type { Customer } from '@/services/customerService'

import {
  customerFormSchema,
  emptyCustomerFormValues,
  toCustomerFormValues,
  type CustomerFormValues,
} from './schema'

type CustomerFormProps = {
  open: boolean
  customer: Customer | null
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: CustomerFormValues) => Promise<void>
}

type ViaCepResponse = {
  erro?: boolean
  logradouro?: string
  bairro?: string
  localidade?: string
  uf?: string
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)

  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }

  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
}

function formatZipcode(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  return digits.replace(/(\d{5})(\d)/, '$1-$2')
}

function toTitleCase(value: string) {
  return value
    .toLocaleLowerCase('pt-BR')
    .replace(
      /(^|[\s-])(\p{L})/gu,
      (_, separator: string, char: string) =>
        separator + char.toLocaleUpperCase('pt-BR'),
    )
}

export function CustomerForm({
  open,
  customer,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: CustomerFormProps) {
  const zipcodeLookupId = useRef(0)
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: customer
      ? toCustomerFormValues(customer)
      : emptyCustomerFormValues,
  })

  async function lookupZipcode(zipcode: string) {
    const digits = zipcode.replace(/\D/g, '')

    if (digits.length !== 8) return

    const requestId = zipcodeLookupId.current + 1
    zipcodeLookupId.current = requestId

    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`)

      if (!response.ok || requestId !== zipcodeLookupId.current) return

      const data = (await response.json()) as ViaCepResponse

      if (data.erro || requestId !== zipcodeLookupId.current) return

      if (data.localidade) {
        form.setValue('city', toTitleCase(data.localidade), {
          shouldValidate: true,
        })
      }

      if (data.uf) {
        form.setValue('state', data.uf.toUpperCase(), { shouldValidate: true })
      }

      if (data.logradouro) {
        form.setValue('address', toTitleCase(data.logradouro), {
          shouldDirty: true,
        })
      }

      if (data.bairro) {
        form.setValue('neighborhood', toTitleCase(data.bairro), {
          shouldDirty: true,
        })
      }

      form.setFocus('number')
    } catch {
      return
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
          <SheetTitle className="tracking-tight">
            {customer ? 'Editar cliente' : 'Novo cliente'}
          </SheetTitle>
          <SheetDescription>
            {customer
              ? 'Atualize os dados cadastrais deste cliente.'
              : 'Cadastre uma empresa ou clínica parceira.'}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
          >
            <div className="flex flex-1 flex-col gap-8 overflow-y-auto px-6 py-5">
              <section className="flex flex-col gap-4">
                <h2 className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
                  Dados principais
                </h2>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          autoComplete="organization"
                          placeholder="Clínica ou empresa"
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            inputMode="email"
                            autoComplete="email"
                            placeholder="contato@empresa.com"
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            inputMode="tel"
                            autoComplete="tel"
                            placeholder="(00) 00000-0000"
                            disabled={isSubmitting}
                            onChange={(event) =>
                              field.onChange(formatPhone(event.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              <section className="flex flex-col gap-4">
                <h2 className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
                  Endereço
                </h2>

                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="zipcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            inputMode="numeric"
                            autoComplete="postal-code"
                            placeholder="00000-000"
                            disabled={isSubmitting}
                            onChange={(event) => {
                              const zipcode = formatZipcode(event.target.value)
                              field.onChange(zipcode)
                              void lookupZipcode(zipcode)
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Logradouro</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            autoComplete="street-address"
                            placeholder="Rua, avenida..."
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número</FormLabel>
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
                    name="complement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Complemento</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            autoComplete="off"
                            placeholder="Sala, bloco..."
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="neighborhood"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bairro</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isSubmitting} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_5.5rem]">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            autoComplete="address-level2"
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>UF</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            maxLength={2}
                            autoComplete="address-level1"
                            className="uppercase"
                            disabled={isSubmitting}
                            onChange={(event) =>
                              field.onChange(event.target.value.toUpperCase())
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <LoaderCircleIcon className="animate-spin" />
                    Salvando
                  </>
                ) : customer ? (
                  'Salvar alterações'
                ) : (
                  'Criar cliente'
                )}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
