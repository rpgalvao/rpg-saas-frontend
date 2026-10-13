import { zodResolver } from '@hookform/resolvers/zod'
import { Building2Icon, LoaderCircleIcon, UploadIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCnpj, formatPhone } from '@/lib/formatters'
import { getApiErrorMessage } from '@/services/userService'
import { getCurrentTenant, updateTenant } from '@/services/tenantService'

import { tenantFormSchema, type TenantFormValues } from './schema'

export function TenantTab() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const form = useForm<TenantFormValues>({
    resolver: zodResolver(tenantFormSchema),
    defaultValues: {
      name: '',
      cnpj: '',
      phone: '',
      email: '',
    },
  })

  useEffect(() => {
    let cancelled = false

    async function loadTenant() {
      setIsLoading(true)
      setLoadError(null)

      try {
        const tenant = await getCurrentTenant()

        if (cancelled) return

        setTenantId(tenant.id)
        setLogoPreview(tenant.logo_url)
        form.reset({
          name: tenant.name,
          cnpj: formatCnpj(tenant.cnpj),
          phone: formatPhone(tenant.phone),
          email: tenant.email ?? '',
        })
      } catch (error) {
        if (!cancelled) {
          const message = getApiErrorMessage(
            error,
            'Não foi possível carregar os dados da empresa.',
          )
          setLoadError(message)
          toast.error(message)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void loadTenant()

    return () => {
      cancelled = true
    }
  }, [form, reloadKey])

  function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) return

    setLogoFile(file)

    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setLogoPreview(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  async function onSubmit(values: TenantFormValues) {
    if (!tenantId) return

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('name', values.name.trim())
      formData.append('cnpj', values.cnpj.trim())

      const phone = values.phone.trim()
      if (phone) {
        formData.append('phone', phone)
      }

      if (logoFile) {
        formData.append('logo', logoFile)
      }

      const updated = await updateTenant(tenantId, formData)

      setLogoFile(null)
      setLogoPreview(updated.logo_url)
      form.reset({
        name: updated.name,
        cnpj: formatCnpj(updated.cnpj),
        phone: formatPhone(updated.phone),
        email: updated.email ?? '',
      })
      toast.success('Empresa atualizada.')
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Não foi possível atualizar a empresa.'),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <Skeleton className="h-80 max-w-3xl rounded-xl" />
  }

  if (loadError || !tenantId) {
    return (
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Empresa</CardTitle>
          <CardDescription>
            {loadError ?? 'Não foi possível carregar os dados da empresa.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            onClick={() => setReloadKey((current) => current + 1)}
          >
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Form {...form}>
      <form
        className="max-w-3xl"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
      >
        <Card>
          <CardHeader>
            <CardTitle>Empresa</CardTitle>
            <CardDescription>
              Razão social, contato e a marca exibida para a sua equipe.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="flex size-20 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt=""
                    className="size-full object-contain"
                  />
                ) : (
                  <Building2Icon className="size-7 text-muted-foreground" />
                )}
              </div>
              <div className="flex flex-col items-start gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="sr-only"
                  onChange={handleLogoChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadIcon />
                  Alterar logo
                </Button>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, WebP ou SVG.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razão social</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        autoComplete="email"
                        disabled
                      />
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

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <LoaderCircleIcon className="animate-spin" />
                    Salvando
                  </>
                ) : (
                  'Salvar empresa'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  )
}
