import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircleIcon } from 'lucide-react'
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
import { formatDocument, formatPhone } from '@/lib/formatters'
import type { Supplier } from '@/services/supplierService'

import {
  supplierFormSchema,
  toSupplierFormValues,
  type SupplierFormValues,
} from './schema'

type SupplierFormProps = {
  open: boolean
  supplier: Supplier | null
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: SupplierFormValues) => Promise<void>
}

export function SupplierForm({
  open,
  supplier,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: SupplierFormProps) {
  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: toSupplierFormValues(supplier),
  })

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
            {supplier ? 'Editar fornecedor' : 'Novo fornecedor'}
          </SheetTitle>
          <SheetDescription>
            {supplier
              ? 'Atualize os dados deste distribuidor.'
              : 'Cadastre um distribuidor de peças.'}
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
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ex: Distribuidora Tech"
                        autoComplete="organization"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="document"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ / CPF</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        inputMode="numeric"
                        placeholder="Opcional"
                        autoComplete="off"
                        disabled={isSubmitting}
                        onChange={(event) =>
                          field.onChange(formatDocument(event.target.value))
                        }
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
                          placeholder="Opcional"
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
                ) : supplier ? (
                  'Salvar alterações'
                ) : (
                  'Criar fornecedor'
                )}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
