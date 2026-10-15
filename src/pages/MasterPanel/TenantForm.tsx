import { zodResolver } from '@hookform/resolvers/zod'
import { Building2Icon, KeyRoundIcon, LoaderCircleIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useForm } from 'react-hook-form'

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
import { formatCnpj } from '@/lib/formatters'

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
  children,
}: {
  icon: ReactNode
  title: string
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {icon}
        {title}
      </div>
      {children}
    </section>
  )
}

export function TenantForm({
  open,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: TenantFormProps) {
  const form = useForm<TenantFormValues>({
    resolver: zodResolver(tenantFormSchema),
    defaultValues: emptyTenantFormValues,
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isSubmitting) return
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="border-b px-6 py-5">
          <DialogTitle>Novo Cliente</DialogTitle>
          <DialogDescription>
            Cadastre a empresa assinante e o administrador que fará o primeiro
            acesso.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <div className="flex max-h-[65vh] flex-col gap-6 overflow-y-auto px-6 py-5">
              <FormSection
                icon={<Building2Icon className="size-3.5" strokeWidth={1.75} />}
                title="Empresa"
              >
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
                            onChange={(event) =>
                              field.onChange(formatCnpj(event.target.value))
                            }
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
                title="Administrador inicial"
              >
                <div className="grid gap-4 sm:grid-cols-2">
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
                </div>
                <p className="text-sm text-muted-foreground">
                  Compartilhe essas credenciais com o cliente. Ele poderá
                  alterar a senha depois do primeiro acesso.
                </p>
              </FormSection>
            </div>

            <DialogFooter className="border-t bg-muted/40 px-6 py-4">
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
                    Cadastrando
                  </>
                ) : (
                  'Cadastrar cliente'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
