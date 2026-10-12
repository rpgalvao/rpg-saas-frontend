import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircleIcon } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

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
import { Textarea } from '@/components/ui/textarea'

import {
  emptyFinishOrderFormValues,
  finishOrderFormSchema,
  toFinishOrderPayload,
  type FinishOrderFormValues,
  type FinishOrderPayload,
} from './schema'
import { SignaturePad } from './SignaturePad'

type FinishOrderDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (payload: FinishOrderPayload) => Promise<void>
}

export function FinishOrderDialog({
  open,
  onOpenChange,
  onConfirm,
}: FinishOrderDialogProps) {
  const [signature, setSignature] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const form = useForm<FinishOrderFormValues>({
    resolver: zodResolver(finishOrderFormSchema),
    defaultValues: emptyFinishOrderFormValues,
  })

  async function handleSubmit(values: FinishOrderFormValues) {
    if (!signature || signature.length < 20) {
      toast.error('A assinatura do cliente é obrigatória para finalizar a O.S.')
      return
    }

    setIsSubmitting(true)

    try {
      await onConfirm(toFinishOrderPayload(values, signature))
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
      <DialogContent className="flex max-h-[min(90vh,860px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b px-6 py-5">
          <DialogTitle>Finalizar ordem de serviço</DialogTitle>
          <DialogDescription>
            Informe a solução, os custos e colete a assinatura do responsável.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={form.handleSubmit(handleSubmit)}
            noValidate
          >
            <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
              <FormField
                control={form.control}
                name="solution_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Solução aplicada</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={3}
                        placeholder="O que foi feito para resolver o problema..."
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="technical_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas técnicas</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={2}
                        placeholder="Condições de infraestrutura, mau uso..."
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 rounded-xl border border-border bg-muted/30 p-4 sm:grid-cols-3">
                <p className="text-sm font-medium tracking-tight sm:col-span-3">
                  Custos adicionais
                </p>
                <FormField
                  control={form.control}
                  name="labor_cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mão de obra (R$)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="0.01"
                          placeholder="0,00"
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="travel_cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deslocamento (R$)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="0.01"
                          placeholder="0,00"
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="accommodation_cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hospedagem (R$)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="0.01"
                          placeholder="0,00"
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-col gap-4 rounded-xl border border-border p-4">
                <p className="text-sm font-medium tracking-tight">
                  Assinatura do responsável
                </p>
                <FormField
                  control={form.control}
                  name="signer_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome de quem está assinando</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          autoComplete="name"
                          placeholder="Ex: João Doe"
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <SignaturePad disabled={isSubmitting} onChange={setSignature} />
                <p className="text-center text-xs text-muted-foreground">
                  Ao assinar, o responsável concorda com os serviços e as peças
                  listados.
                </p>
              </div>
            </div>

            <DialogFooter className="border-t bg-muted/40 px-6 py-4">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => onOpenChange(false)}
              >
                Voltar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <LoaderCircleIcon className="animate-spin" />
                    Lacrando O.S.
                  </>
                ) : (
                  'Concluir e lacrar serviço'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
