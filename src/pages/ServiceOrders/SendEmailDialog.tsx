import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircleIcon } from 'lucide-react'
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
import { formatOrderNumber } from '@/pages/ServiceOrders/presentation'

import { emailFormSchema, type EmailFormValues } from './schema'

type SendEmailDialogProps = {
  open: boolean
  orderNumber?: number
  defaultEmail?: string | null
  onOpenChange: (open: boolean) => void
  onConfirm: (email: string) => Promise<void>
}

export function SendEmailDialog({
  open,
  orderNumber,
  defaultEmail,
  onOpenChange,
  onConfirm,
}: SendEmailDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: { email: defaultEmail ?? '' },
  })

  async function handleSubmit(values: EmailFormValues) {
    setIsSubmitting(true)

    try {
      await onConfirm(values.email.trim())
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
          <DialogTitle>
            Enviar por e-mail
            {orderNumber != null ? ` ${formatOrderNumber(orderNumber)}` : ''}
          </DialogTitle>
          <DialogDescription>
            O PDF da ordem de serviço será enviado para o endereço informado.
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail de destino</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      autoComplete="email"
                      placeholder="cliente@empresa.com"
                      disabled={isSubmitting}
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <LoaderCircleIcon className="animate-spin" />
                    Enviando
                  </>
                ) : (
                  'Enviar PDF'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
