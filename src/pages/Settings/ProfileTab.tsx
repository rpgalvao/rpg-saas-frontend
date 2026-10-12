import { zodResolver } from '@hookform/resolvers/zod'
import {
  EraserIcon,
  LoaderCircleIcon,
  PenToolIcon,
  UploadIcon,
  UserIcon,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import SignatureCanvas from 'react-signature-canvas'
import { toast } from 'sonner'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/AuthContext'
import { formatPhone } from '@/lib/formatters'
import {
  getApiErrorMessage,
  getUserProfile,
  updateUserProfile,
} from '@/services/userService'

import { profileFormSchema, type ProfileFormValues } from './schema'

function readSignature(pad: SignatureCanvas) {
  try {
    return pad.getTrimmedCanvas().toDataURL('image/png')
  } catch {
    return pad.toDataURL('image/png')
  }
}

export function ProfileTab() {
  const { user, updateSession } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const sigCanvas = useRef<SignatureCanvas>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user?.avatar_url ?? null,
  )
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null)
  const [signaturePayload, setSignaturePayload] = useState<string | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      phone: '',
      currentPassword: '',
      newPassword: '',
    },
  })

  useEffect(() => {
    if (!user) return

    const currentUser = user
    let cancelled = false

    async function loadProfile() {
      setIsLoadingProfile(true)

      try {
        const profile = await getUserProfile(currentUser.id)

        if (cancelled) return

        setAvatarPreview(profile.avatar_url)
        setSignatureUrl(profile.signature_url)
        form.reset({
          name: profile.name,
          email: profile.email,
          phone: formatPhone(profile.phone),
          currentPassword: '',
          newPassword: '',
        })
      } catch (error) {
        if (!cancelled) {
          toast.error(
            getApiErrorMessage(error, 'Não foi possível carregar o perfil.'),
          )
        }
      } finally {
        if (!cancelled) setIsLoadingProfile(false)
      }
    }

    void loadProfile()

    return () => {
      cancelled = true
    }
  }, [form, user])

  useEffect(() => {
    if (isLoadingProfile || !signatureUrl) return

    const timeoutId = window.setTimeout(() => {
      sigCanvas.current?.fromDataURL(signatureUrl)
    }, 150)

    return () => window.clearTimeout(timeoutId)
  }, [isLoadingProfile, signatureUrl])

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) return

    setAvatarFile(file)

    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setAvatarPreview(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  function captureSignature() {
    const pad = sigCanvas.current

    if (!pad || pad.isEmpty()) {
      setSignaturePayload(null)
      return
    }

    setSignaturePayload(readSignature(pad))
  }

  function clearSignature() {
    sigCanvas.current?.clear()
    setSignaturePayload('')
  }

  async function onSubmit(values: ProfileFormValues) {
    if (!user) return

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('name', values.name.trim())
      formData.append('phone', values.phone.trim())

      if (avatarFile) {
        formData.append('avatar', avatarFile)
      }

      if (signaturePayload !== null) {
        formData.append('signature_url', signaturePayload)
      }

      const currentPassword = values.currentPassword.trim()
      const newPassword = values.newPassword.trim()

      if (currentPassword) formData.append('currentPassword', currentPassword)
      if (newPassword) formData.append('newPassword', newPassword)

      const updated = await updateUserProfile(user.id, formData)

      updateSession({
        name: updated.name,
        avatar_url: updated.avatar_url,
      })
      setAvatarFile(null)
      setAvatarPreview(updated.avatar_url)
      setSignatureUrl(updated.signature_url)
      setSignaturePayload(null)
      form.reset({
        name: updated.name,
        email: updated.email,
        phone: formatPhone(updated.phone),
        currentPassword: '',
        newPassword: '',
      })
      toast.success('Perfil atualizado.')
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Não foi possível atualizar o perfil.'),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoadingProfile) {
    return (
      <div className="flex max-w-3xl flex-col gap-6">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    )
  }

  return (
    <Form {...form}>
      <form
        className="flex max-w-3xl flex-col gap-6"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
      >
        <Card>
          <CardHeader>
            <CardTitle>Informações pessoais</CardTitle>
            <CardDescription>
              Nome, contato e a foto usada no painel.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <Avatar className="size-20">
                {avatarPreview ? (
                  <AvatarImage src={avatarPreview} alt="" />
                ) : null}
                <AvatarFallback>
                  <UserIcon className="size-7" />
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  onChange={handleAvatarChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadIcon />
                  Alterar foto
                </Button>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG ou WebP. Prefira uma imagem quadrada.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome completo</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        autoComplete="name"
                        disabled={isSubmitting}
                      />
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
                    <FormLabel>E-mail de acesso</FormLabel>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="grid-cols-[1fr_auto] items-start">
            <div className="flex flex-col gap-1">
              <CardTitle className="flex items-center gap-2">
                <PenToolIcon className="size-4" />
                Assinatura para O.S.
              </CardTitle>
              <CardDescription>
                Assine no quadro. Essa imagem entra nos relatórios técnicos.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={clearSignature}
            >
              <EraserIcon />
              Limpar
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-xl border border-dashed border-border bg-white">
              <SignatureCanvas
                ref={sigCanvas}
                penColor="#171717"
                onEnd={captureSignature}
                canvasProps={{
                  className: 'h-40 w-full touch-none cursor-crosshair',
                  'aria-label': 'Área de assinatura',
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Segurança</CardTitle>
            <CardDescription>
              Preencha os dois campos apenas se quiser trocar a senha.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha atual</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      autoComplete="current-password"
                      placeholder="Necessária para alterar a senha"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>Deixe em branco para manter.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nova senha</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      autoComplete="new-password"
                      placeholder="Mínimo de 5 caracteres"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <LoaderCircleIcon className="animate-spin" />
                Salvando
              </>
            ) : (
              'Salvar alterações'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
