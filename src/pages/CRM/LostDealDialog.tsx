import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircleIcon } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

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

const lostDealSchema = z.object({
  lostReason: z.string().trim().min(1, 'Informe o motivo da perda'),
})

type LostDealFormValues = z.infer<typeof lostDealSchema>

type LostDealDialogProps = {
  open: boolean
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (lostReason: string) => Promise<void>
}

export function LostDealDialog({
  open,
  isSubmitting,
  onOpenChange,
  onConfirm,
}: LostDealDialogProps) {
  const form = useForm<LostDealFormValues>({
    resolver: zodResolver(lostDealSchema),
    defaultValues: { lostReason: '' },
  })

  useEffect(() => {
    if (open) form.reset({ lostReason: '' })
  }, [open, form])

  async function handleSubmit(values: LostDealFormValues) {
    await onConfirm(values.lostReason.trim())
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
          <DialogTitle>Marcar como perdido</DialogTitle>
          <DialogDescription>
            O negócio sai do pipeline. Informe o motivo da perda.
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
              name="lostReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo da perda</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      autoFocus
                      placeholder="Ex.: Cliente escolheu outro fornecedor"
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
              <Button
                type="submit"
                variant="destructive"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircleIcon className="animate-spin" />
                    Salvando
                  </>
                ) : (
                  'Marcar como Perdido'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
