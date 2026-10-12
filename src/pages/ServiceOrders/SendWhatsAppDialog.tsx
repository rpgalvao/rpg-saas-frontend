import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircleIcon, MessageCircleIcon } from 'lucide-react'
import { useState } from 'react'
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
import { formatPhone } from '@/lib/formatters'

import { whatsAppFormSchema, type WhatsAppFormValues } from './schema'

type SendWhatsAppDialogProps = {
  open: boolean
  defaultPhone?: string | null
  onOpenChange: (open: boolean) => void
  onConfirm: (phone: string) => Promise<void>
}

export function SendWhatsAppDialog({
  open,
  defaultPhone,
  onOpenChange,
  onConfirm,
}: SendWhatsAppDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const form = useForm<WhatsAppFormValues>({
    resolver: zodResolver(whatsAppFormSchema),
    defaultValues: {
      phone: defaultPhone ? formatPhone(defaultPhone) : '',
    },
  })

  async function handleSubmit(values: WhatsAppFormValues) {
    setIsSubmitting(true)

    try {
      await onConfirm(values.phone)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isSubmitting) return
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircleIcon className="text-emerald-600" strokeWidth={1.75} />
            Enviar O.S. por WhatsApp
          </DialogTitle>
          <DialogDescription>
            Confirme ou altere o número para onde o link da ordem de serviço será
            enviado.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit(handleSubmit)}
            noValidate
          >
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número do WhatsApp</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="tel"
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircleIcon className="animate-spin" />
                    Preparando
                  </>
                ) : (
                  'Abrir WhatsApp'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
