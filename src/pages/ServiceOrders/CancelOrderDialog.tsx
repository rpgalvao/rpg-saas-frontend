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
import { Textarea } from '@/components/ui/textarea'

import { cancelOrderFormSchema, type CancelOrderFormValues } from './schema'

type CancelOrderDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (reason: string) => Promise<void>
}

export function CancelOrderDialog({
  open,
  onOpenChange,
  onConfirm,
}: CancelOrderDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const form = useForm<CancelOrderFormValues>({
    resolver: zodResolver(cancelOrderFormSchema),
    defaultValues: { reason: '' },
  })

  async function handleSubmit(values: CancelOrderFormValues) {
    setIsSubmitting(true)

    try {
      await onConfirm(values.reason.trim())
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
          <DialogTitle>Cancelar ordem de serviço</DialogTitle>
          <DialogDescription>
            O cancelamento encerra a O.S. e fica registrado com o motivo informado.
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
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo do cancelamento</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder="Descreva por que esta O.S. está sendo cancelada..."
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
                Voltar
              </Button>
              <Button type="submit" variant="destructive" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <LoaderCircleIcon className="animate-spin" />
                    Cancelando
                  </>
                ) : (
                  'Confirmar cancelamento'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
