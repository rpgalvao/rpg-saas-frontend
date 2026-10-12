import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircleIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { formatCurrency } from '@/lib/formatters'
import { listParts, type Part } from '@/services/partService'
import { getApiErrorMessage } from '@/services/supplierService'

import {
  movementFormSchema,
  toMovementFormValues,
  type MovementFormValues,
} from './schema'

type MovementFormProps = {
  open: boolean
  part: Part | null
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: MovementFormValues) => Promise<void>
}

export function MovementForm({
  open,
  part,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: MovementFormProps) {
  const [parts, setParts] = useState<Part[]>([])
  const [isLoadingParts, setIsLoadingParts] = useState(!part)
  const [partsError, setPartsError] = useState<string | null>(null)
  const [partsSession, setPartsSession] = useState(0)
  const [selectedPartId, setSelectedPartId] = useState(part?.id ?? '')
  const [movementType, setMovementType] = useState<MovementFormValues['type']>('IN')

  const form = useForm<MovementFormValues>({
    resolver: zodResolver(movementFormSchema),
    defaultValues: toMovementFormValues(part),
  })

  useEffect(() => {
    if (!open || part) return

    let ignore = false

    listParts()
      .then((data) => {
        if (!ignore) setParts(data.filter((item) => item.active))
      })
      .catch((error: unknown) => {
        if (ignore) return

        const message = getApiErrorMessage(
          error,
          'Não foi possível carregar as peças.',
        )
        setPartsError(message)
        toast.error(message)
      })
      .finally(() => {
        if (!ignore) setIsLoadingParts(false)
      })

    return () => {
      ignore = true
    }
  }, [open, part, partsSession])

  const partOptions = useMemo(() => {
    if (!part || parts.some((item) => item.id === part.id)) return parts

    return [part, ...parts]
  }, [part, parts])

  const selectedPart =
    part ?? partOptions.find((item) => item.id === selectedPartId) ?? null

  const isBusy = isSubmitting || (!part && isLoadingParts)

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (isSubmitting) return
        onOpenChange(nextOpen)
      }}
    >
      <SheetContent className="w-full gap-0 overflow-hidden p-0 sm:max-w-md">
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle className="tracking-tight">Movimentar estoque</SheetTitle>
          <SheetDescription>
            {selectedPart
              ? `${selectedPart.name} · saldo atual ${selectedPart.current_stock} un · custo ${formatCurrency(selectedPart.cost_price)}`
              : 'Registre uma entrada ou saída de qualquer peça do catálogo.'}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
          >
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
              {!part && isLoadingParts ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LoaderCircleIcon className="size-4 animate-spin" />
                  Carregando peças
                </div>
              ) : null}

              {!part && partsError ? (
                <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 p-3">
                  <p className="text-sm text-muted-foreground">{partsError}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="self-start"
                    onClick={() => {
                      setIsLoadingParts(true)
                      setPartsError(null)
                      setPartsSession((session) => session + 1)
                    }}
                  >
                    Tentar de novo
                  </Button>
                </div>
              ) : null}

              <FormField
                control={form.control}
                name="partId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peça</FormLabel>
                    <Select
                      value={field.value || undefined}
                      onValueChange={(value) => {
                        field.onChange(value)
                        setSelectedPartId(value)

                        const nextPart = partOptions.find((item) => item.id === value)

                        if (nextPart) {
                          form.setValue('unit_cost', String(nextPart.cost_price))
                        }
                      }}
                      disabled={Boolean(part) || isBusy}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione uma peça" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent position="popper">
                        {partOptions.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.sku ? `${item.name} · ${item.sku}` : item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!part && !isLoadingParts && !partsError && partOptions.length === 0 ? (
                      <FormDescription>Nenhuma peça ativa no catálogo.</FormDescription>
                    ) : null}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value)
                        setMovementType(value as MovementFormValues['type'])
                      }}
                      disabled={isBusy}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent position="popper">
                        <SelectItem value="IN">Entrada</SelectItem>
                        <SelectItem value="OUT">Saída</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        inputMode="numeric"
                        min="1"
                        step="1"
                        placeholder="Ex: 10"
                        disabled={isBusy}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {movementType === 'IN' ? (
                <FormField
                  control={form.control}
                  name="unit_cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custo unitário</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="0.01"
                          placeholder="0,00"
                          disabled={isBusy}
                        />
                      </FormControl>
                      <FormDescription>
                        Opcional. Se informado, atualiza o preço de custo da peça.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ex: Compra via nota fiscal 12345"
                        autoComplete="off"
                        disabled={isBusy}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <SheetFooter className="flex-row justify-end border-t bg-muted/40">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isBusy || Boolean(partsError)}>
                {isSubmitting ? (
                  <>
                    <LoaderCircleIcon className="animate-spin" />
                    Salvando
                  </>
                ) : (
                  'Registrar movimentação'
                )}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
