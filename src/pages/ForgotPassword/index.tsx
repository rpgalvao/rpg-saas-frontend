import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeftIcon,
  CircleCheckIcon,
  LoaderCircleIcon,
  ShieldCheckIcon,
} from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'

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
import { api } from '@/services/api'
import { getApiErrorMessage } from '@/services/userService'

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Informe o e-mail')
    .email('Informe um e-mail válido'),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  async function onSubmit(values: ForgotPasswordFormValues) {
    setIsSubmitting(true)

    try {
      await api.post('/login/forgot-password', { email: values.email })
      setEmailSent(true)
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Não foi possível enviar o e-mail de recuperação.',
        ),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--muted),transparent_58%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70 [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(ellipse_at_center,black_18%,transparent_74%)]"
      />

      <main className="relative w-full max-w-md">
        <Card className="rounded-2xl shadow-[0_24px_48px_-32px_rgba(0,0,0,0.45)]">
          <CardHeader className="items-center gap-4 text-center">
            <ShieldCheckIcon
              className="mx-auto h-12 w-12 justify-self-center text-primary"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <div className="flex flex-col gap-2">
              <p className="text-[0.68rem] font-medium tracking-[0.22em] text-muted-foreground uppercase">
                RPG SaaS
              </p>
              <CardTitle className="text-[1.75rem] tracking-tight">
                Recuperar senha
              </CardTitle>
              <CardDescription className="leading-6">
                Digite seu e-mail para receber as instruções.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            {emailSent ? (
              <div className="flex flex-col gap-5">
                <div
                  role="status"
                  className="flex flex-col items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-5 text-center text-sm leading-6 text-emerald-700 dark:text-emerald-300"
                >
                  <CircleCheckIcon className="size-8" strokeWidth={1.75} />
                  <p>
                    Se o e-mail existir em nossa base, você receberá um link de
                    recuperação em instantes.
                  </p>
                </div>

                <Button className="w-full" asChild>
                  <Link to="/login">
                    <ArrowLeftIcon data-icon="inline-start" />
                    Voltar para o login
                  </Link>
                </Button>
              </div>
            ) : (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="flex flex-col gap-5"
                  noValidate
                >
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
                            placeholder="voce@empresa.com"
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <LoaderCircleIcon
                          data-icon="inline-start"
                          className="animate-spin"
                        />
                        Enviando
                      </>
                    ) : (
                      'Enviar instruções'
                    )}
                  </Button>

                  <Button variant="link" className="h-auto px-0" asChild>
                    <Link to="/login">
                      <ArrowLeftIcon />
                      Voltar para o login
                    </Link>
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
