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

import { reopenOrderFormSchema, type ReopenOrderFormValues } from './schema'

type ReopenOrderDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (reason: string) => Promise<void>
}

export function ReopenOrderDialog({
  open,
  onOpenChange,
  onConfirm,
}: ReopenOrderDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const form = useForm<ReopenOrderFormValues>({
    resolver: zodResolver(reopenOrderFormSchema),
    defaultValues: { reason: '' },
  })

  async function handleSubmit(values: ReopenOrderFormValues) {
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
          <DialogTitle>Reabrir ordem de serviço</DialogTitle>
          <DialogDescription>
            Reabrir a O.S. remove a data de encerramento atual. Esta ação fica
            registrada no histórico.
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
                  <FormLabel>Motivo da reabertura</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder="Ex: o cliente relatou que o defeito persistiu após a entrega..."
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
                    Reabrindo
                  </>
                ) : (
                  'Confirmar reabertura'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
