import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeftIcon,
  CircleCheckIcon,
  LoaderCircleIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
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

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
    confirmPassword: z.string().min(1, 'Confirme a nova senha'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  })

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')?.trim() ?? ''
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [passwordUpdated, setPasswordUpdated] = useState(false)
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    if (!passwordUpdated) return

    const timeoutId = window.setTimeout(() => {
      navigate('/login', { replace: true })
    }, 3000)

    return () => window.clearTimeout(timeoutId)
  }, [passwordUpdated, navigate])

  async function onSubmit(values: ResetPasswordFormValues) {
    setIsSubmitting(true)

    try {
      await api.post('/login/reset-password', {
        token,
        password: values.password,
      })
      setPasswordUpdated(true)
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Erro ao redefinir a senha. O link pode ter expirado.',
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
                {token ? 'Criar nova senha' : 'Link inválido'}
              </CardTitle>
              <CardDescription className="leading-6">
                {token
                  ? 'Digite a sua nova senha de acesso abaixo.'
                  : 'Este link de recuperação está incompleto ou expirou.'}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            {!token ? (
              <div className="flex flex-col gap-5">
                <div
                  role="alert"
                  className="flex flex-col items-center gap-3 rounded-lg border border-amber-500/25 bg-amber-500/10 px-4 py-5 text-center text-sm leading-6 text-amber-800 dark:text-amber-200"
                >
                  <TriangleAlertIcon className="size-8" strokeWidth={1.75} />
                  <p>
                    O token de segurança está ausente. Solicite um novo link
                    para redefinir a senha.
                  </p>
                </div>

                <Button className="w-full" asChild>
                  <Link to="/forgot-password">Solicitar novo link</Link>
                </Button>
                <Button variant="link" className="h-auto px-0" asChild>
                  <Link to="/login">
                    <ArrowLeftIcon />
                    Voltar para o login
                  </Link>
                </Button>
              </div>
            ) : passwordUpdated ? (
              <div
                role="status"
                className="flex flex-col items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-5 text-center text-sm leading-6 text-emerald-700 dark:text-emerald-300"
              >
                <CircleCheckIcon className="size-8" strokeWidth={1.75} />
                <p className="font-medium">Senha atualizada com sucesso!</p>
                <p>Redirecionando para o login...</p>
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
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nova senha</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            autoComplete="new-password"
                            placeholder="Mínimo de 6 caracteres"
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar nova senha</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            autoComplete="new-password"
                            placeholder="Repita a nova senha"
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
                        Salvando
                      </>
                    ) : (
                      'Salvar nova senha'
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
