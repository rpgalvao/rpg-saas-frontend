import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircleIcon, LockKeyholeIcon } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useNavigate } from 'react-router-dom'
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
import { useAuth } from '@/contexts/AuthContext'

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Informe o e-mail')
    .email('Informe um e-mail válido'),
  password: z.string().min(5, 'A senha deve ter no mínimo 5 caracteres'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const { user, signIn } = useAuth()
  const navigate = useNavigate()
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const authError = form.formState.errors.root?.message

  async function onSubmit(values: LoginFormValues) {
    setIsAuthenticating(true)

    try {
      await signIn(values)
      navigate('/', { replace: true })
    } catch (error) {
      form.setError('root', {
        message:
          error instanceof Error
            ? error.message
            : 'Não foi possível entrar. Tente novamente.',
      })
    } finally {
      setIsAuthenticating(false)
    }
  }

  if (user) {
    return <Navigate to="/" replace />
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
          <CardHeader className="gap-4">
            <div className="flex size-11 items-center justify-center rounded-xl border border-border bg-muted text-foreground">
              <LockKeyholeIcon className="size-5" strokeWidth={1.75} />
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-[0.68rem] font-medium tracking-[0.2em] text-muted-foreground uppercase">
                Acesso
              </p>
              <CardTitle className="text-[1.75rem] tracking-tight">
                Entrar
              </CardTitle>
              <CardDescription className="leading-6">
                Use o e-mail e a senha da sua conta para acessar o painel.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
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
                          disabled={isAuthenticating}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          autoComplete="current-password"
                          placeholder="Sua senha"
                          disabled={isAuthenticating}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {authError ? (
                  <p
                    role="alert"
                    className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  >
                    {authError}
                  </p>
                ) : null}

                <Button type="submit" className="w-full" disabled={isAuthenticating}>
                  {isAuthenticating ? (
                    <>
                      <LoaderCircleIcon
                        data-icon="inline-start"
                        className="animate-spin"
                      />
                      Entrando
                    </>
                  ) : (
                    'Entrar'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
