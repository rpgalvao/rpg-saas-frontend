import { zodResolver } from '@hookform/resolvers/zod'
import {
  FileTextIcon,
  LoaderCircleIcon,
  PlusIcon,
  Trash2Icon,
  UserIcon,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
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
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { updateDealStatus, type Deal } from '@/services/crmService'
import {
  addQuoteItem,
  createQuote,
  deleteQuote,
  deleteQuoteItem,
  getApiErrorMessage,
  listQuotesByDeal,
  updateQuoteItem,
  updateQuoteStatus,
  type Quote,
  type QuoteItem,
  type QuoteItemType,
  type QuoteStatus,
} from '@/services/quoteService'

import { LostDealDialog } from './LostDealDialog'

type DealDetailsSheetProps = {
  deal: Deal
  onClose: () => void
}

const quoteItemFormSchema = z.object({
  type: z.enum(['PRODUCT', 'SERVICE']),
  description: z.string().trim().min(1, 'Informe a descrição'),
  quantity: z.string().trim().min(1, 'Informe a quantidade'),
  unitPrice: z.string().trim().min(1, 'Informe o preço unitário'),
})

type QuoteItemFormValues = z.infer<typeof quoteItemFormSchema>

const emptyItemFormValues: QuoteItemFormValues = {
  type: 'SERVICE',
  description: '',
  quantity: '1',
  unitPrice: '0',
}

const QUOTE_STATUS_OPTIONS: Array<{ value: QuoteStatus; label: string }> = [
  { value: 'DRAFT', label: 'Rascunho' },
  { value: 'SENT', label: 'Enviado' },
  { value: 'APPROVED', label: 'Aprovado' },
  { value: 'REJECTED', label: 'Recusado' },
]

const TYPE_LABELS: Record<QuoteItemType, string> = {
  PRODUCT: 'Produto',
  SERVICE: 'Serviço',
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

function formatQuoteDate(value: string | null | undefined) {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return dateFormatter.format(date)
}

function quoteLabel(quote: Quote) {
  if (quote.notes?.trim()) return quote.notes.trim()
  return `Orçamento ${quote.id.slice(0, 8)}`
}

function isQuoteStatus(value: string): value is QuoteStatus {
  return QUOTE_STATUS_OPTIONS.some((option) => option.value === value)
}

function readEstimatedValue(quote: Quote) {
  const estimatedValue = (
    quote as Quote & { deal?: { estimatedValue?: number | string | null } }
  ).deal?.estimatedValue

  if (estimatedValue == null || estimatedValue === '') return null

  const number = Number(estimatedValue)
  return Number.isFinite(number) ? number : null
}

function isNestedOverlayTarget(target: EventTarget | null) {
  const element =
    target instanceof Element
      ? target
      : target instanceof Text
        ? target.parentElement
        : null

  if (!element) return false

  return Boolean(
    element.closest(
      '[data-slot="select-content"], [data-slot="dialog-content"], [data-slot="dialog-overlay"], [data-slot="alert-dialog-content"], [data-slot="alert-dialog-overlay"]',
    ),
  )
}

function parsePositiveNumber(value: string, label: string) {
  const number = Number(value.replace(',', '.'))

  if (!Number.isFinite(number) || number <= 0) {
    return { ok: false as const, message: `${label} deve ser maior que zero.` }
  }

  return { ok: true as const, value: number }
}

function parseNonNegativeNumber(value: string, label: string) {
  const number = Number(value.replace(',', '.'))

  if (!Number.isFinite(number) || number < 0) {
    return {
      ok: false as const,
      message: `${label} não pode ser negativo.`,
    }
  }

  return { ok: true as const, value: number }
}

function QuoteItemRow({
  item,
  disabled,
  onSave,
  onDelete,
}: {
  item: QuoteItem
  disabled: boolean
  onSave: (quantity: number, unitPrice: number) => Promise<void>
  onDelete: () => Promise<void>
}) {
  const quantityRef = useRef<HTMLInputElement>(null)
  const unitPriceRef = useRef<HTMLInputElement>(null)
  const requestLock = useRef(false)

  function resetInputs() {
    if (quantityRef.current) {
      quantityRef.current.value = String(Number(item.quantity))
    }
    if (unitPriceRef.current) {
      unitPriceRef.current.value = String(Number(item.unitPrice))
    }
  }

  async function handleBlur() {
    if (requestLock.current || disabled) return

    const quantity = Number(quantityRef.current?.value)
    const unitPrice = Number(unitPriceRef.current?.value)
    const quantityChanged = quantity !== Number(item.quantity)
    const unitPriceChanged = unitPrice !== Number(item.unitPrice)

    if (!quantityChanged && !unitPriceChanged) return

    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast.error('A quantidade deve ser maior que zero.')
      resetInputs()
      return
    }

    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      toast.error('O preço unitário não pode ser negativo.')
      resetInputs()
      return
    }

    requestLock.current = true

    try {
      await onSave(quantity, unitPrice)
    } catch {
      resetInputs()
    } finally {
      requestLock.current = false
    }
  }

  async function handleDelete() {
    if (requestLock.current || disabled) return

    requestLock.current = true

    try {
      await onDelete()
    } finally {
      requestLock.current = false
    }
  }

  return (
    <TableRow className="hover:bg-transparent">
      <TableCell className="px-3 py-2.5 text-xs">
        {TYPE_LABELS[item.type as QuoteItemType] ?? item.type}
      </TableCell>
      <TableCell className="max-w-40 px-3 py-2.5 text-sm">
        <span className="line-clamp-2">{item.description}</span>
      </TableCell>
      <TableCell className="px-3 py-2.5 text-right">
        <div className="flex justify-end">
          <Input
            ref={quantityRef}
            type="number"
            min={0}
            step="any"
            defaultValue={Number(item.quantity)}
            aria-label={`Quantidade de ${item.description}`}
            disabled={disabled}
            className="h-8 w-24 px-2 text-right text-sm tabular-nums"
            onBlur={() => void handleBlur()}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                event.currentTarget.blur()
              }
            }}
          />
        </div>
      </TableCell>
      <TableCell className="px-3 py-2.5 text-right">
        <div className="flex justify-end">
          <Input
            ref={unitPriceRef}
            type="number"
            min={0}
            step="any"
            defaultValue={Number(item.unitPrice)}
            aria-label={`Preço unitário de ${item.description}`}
            disabled={disabled}
            className="h-8 w-28 px-2 text-right text-sm tabular-nums"
            onBlur={() => void handleBlur()}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                event.currentTarget.blur()
              }
            }}
          />
        </div>
      </TableCell>
      <TableCell className="px-3 py-2.5 text-right text-sm font-medium tabular-nums">
        {formatCurrency(item.totalPrice)}
      </TableCell>
      <TableCell className="px-3 py-2.5 text-right">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          aria-label={`Excluir ${item.description}`}
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => void handleDelete()}
        >
          <Trash2Icon />
        </Button>
      </TableCell>
    </TableRow>
  )
}

export function DealDetailsSheet({ deal, onClose }: DealDetailsSheetProps) {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isCreatingQuote, setIsCreatingQuote] = useState(false)
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null)
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [estimatedValue, setEstimatedValue] = useState(
    Number(deal.estimatedValue) || 0,
  )
  const [isLostDialogOpen, setIsLostDialogOpen] = useState(false)
  const [isMarkingLost, setIsMarkingLost] = useState(false)
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null)
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null)
  const [isDeletingQuote, setIsDeletingQuote] = useState(false)
  const [pendingItemId, setPendingItemId] = useState<string | null>(null)

  const form = useForm<QuoteItemFormValues>({
    resolver: zodResolver(quoteItemFormSchema),
    defaultValues: emptyItemFormValues,
  })

  const quantityValue = useWatch({ control: form.control, name: 'quantity' })
  const unitPriceValue = useWatch({ control: form.control, name: 'unitPrice' })

  const previewTotal = useMemo(() => {
    const quantity = Number(String(quantityValue ?? '').replace(',', '.'))
    const unitPrice = Number(String(unitPriceValue ?? '').replace(',', '.'))

    if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice)) return 0

    return Math.max(0, quantity) * Math.max(0, unitPrice)
  }, [quantityValue, unitPriceValue])

  const selectedQuote =
    quotes.find((quote) => quote.id === selectedQuoteId) ?? null

  const selectedItemsTotal = useMemo(() => {
    if (!selectedQuote) return 0
    return selectedQuote.items.reduce(
      (sum, item) => sum + Number(item.totalPrice || 0),
      0,
    )
  }, [selectedQuote])

  useEffect(() => {
    let ignore = false

    listQuotesByDeal(deal.id)
      .then((data) => {
        if (!ignore) setQuotes(data)
      })
      .catch((error: unknown) => {
        if (ignore) return
        const message = getApiErrorMessage(
          error,
          'Não foi possível carregar os orçamentos.',
        )
        setQuotes([])
        setLoadError(message)
        toast.error(message)
      })
      .finally(() => {
        if (!ignore) setIsLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [deal.id])

  async function handleCreateQuote() {
    if (!deal.customerId) {
      toast.error('Associe um cliente ao negócio antes de criar orçamentos.')
      return
    }

    setIsCreatingQuote(true)

    try {
      const quote = await createQuote({
        dealId: deal.id,
        customerId: deal.customerId,
        status: 'DRAFT',
        items: [],
      })

      setQuotes((current) => [quote, ...current])
      setSelectedQuoteId(quote.id)
      form.reset(emptyItemFormValues)
      toast.success('Orçamento criado.')
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Não foi possível criar o orçamento.'),
      )
    } finally {
      setIsCreatingQuote(false)
    }
  }

  async function handleAddItem(values: QuoteItemFormValues) {
    if (!selectedQuote) {
      toast.error('Selecione um orçamento para adicionar itens.')
      return
    }

    const quantity = parsePositiveNumber(values.quantity, 'A quantidade')
    if (!quantity.ok) {
      form.setError('quantity', { message: quantity.message })
      return
    }

    const unitPrice = parseNonNegativeNumber(
      values.unitPrice,
      'O preço unitário',
    )
    if (!unitPrice.ok) {
      form.setError('unitPrice', { message: unitPrice.message })
      return
    }

    setIsAddingItem(true)

    try {
      const updated = await addQuoteItem(selectedQuote.id, {
        type: values.type,
        description: values.description.trim(),
        quantity: quantity.value,
        unitPrice: unitPrice.value,
      })

      setQuotes((current) =>
        current.map((quote) => (quote.id === updated.id ? updated : quote)),
      )
      form.reset(emptyItemFormValues)
      toast.success('Item adicionado.')
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Não foi possível adicionar o item.'),
      )
    } finally {
      setIsAddingItem(false)
    }
  }

  function replaceQuote(updated: Quote) {
    setQuotes((current) =>
      current.map((quote) =>
        quote.id === updated.id
          ? {
              ...quote,
              ...updated,
              items: updated.items ?? quote.items,
            }
          : quote,
      ),
    )

    const nextEstimate = readEstimatedValue(updated)
    if (nextEstimate != null) setEstimatedValue(nextEstimate)
  }

  async function handleMarkLost(lostReason: string) {
    setIsMarkingLost(true)

    try {
      await updateDealStatus(deal.id, { status: 'LOST', lostReason })
      toast.success('Negócio marcado como perdido.')
      setIsLostDialogOpen(false)
      onClose()
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Não foi possível marcar o negócio como perdido.',
        ),
      )
    } finally {
      setIsMarkingLost(false)
    }
  }

  async function handleStatusChange(quoteId: string, status: QuoteStatus) {
    const current = quotes.find((quote) => quote.id === quoteId)
    if (!current || current.status === status) return

    setQuotes((list) =>
      list.map((quote) => (quote.id === quoteId ? { ...quote, status } : quote)),
    )
    setUpdatingStatusId(quoteId)

    try {
      const updated = await updateQuoteStatus(quoteId, status)
      replaceQuote(updated)
      toast.success('Status atualizado.')
    } catch (error) {
      setQuotes((list) =>
        list.map((quote) =>
          quote.id === quoteId ? { ...quote, status: current.status } : quote,
        ),
      )
      toast.error(
        getApiErrorMessage(error, 'Não foi possível atualizar o status.'),
      )
    } finally {
      setUpdatingStatusId(null)
    }
  }

  async function handleDeleteQuote() {
    if (!quoteToDelete) return

    const quoteId = quoteToDelete.id
    setIsDeletingQuote(true)

    try {
      await deleteQuote(quoteId)
      setQuotes((current) => current.filter((quote) => quote.id !== quoteId))
      setSelectedQuoteId((current) => (current === quoteId ? null : current))
      setQuoteToDelete(null)
      toast.success('Orçamento excluído.')
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Não foi possível excluir o orçamento.'),
      )
    } finally {
      setIsDeletingQuote(false)
    }
  }

  async function refreshQuotes(updated?: Quote) {
    if (updated) {
      const nextEstimate = readEstimatedValue(updated)
      if (nextEstimate != null) setEstimatedValue(nextEstimate)
    }

    const data = await listQuotesByDeal(deal.id)
    setQuotes(data)
  }

  async function handleSaveItem(
    quoteId: string,
    itemId: string,
    quantity: number,
    unitPrice: number,
  ) {
    setPendingItemId(itemId)

    try {
      const updated = await updateQuoteItem(quoteId, itemId, {
        quantity,
        unitPrice,
      })

      try {
        await refreshQuotes(updated)
      } catch (error) {
        replaceQuote(updated)
        toast.error(
          getApiErrorMessage(error, 'Não foi possível atualizar os totais.'),
        )
      }
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Não foi possível atualizar o item.'),
      )
      throw error
    } finally {
      setPendingItemId(null)
    }
  }

  async function handleDeleteItem(quoteId: string, itemId: string) {
    setPendingItemId(itemId)

    try {
      const updated = await deleteQuoteItem(quoteId, itemId)

      try {
        await refreshQuotes(updated)
      } catch (error) {
        replaceQuote(updated)
        toast.error(
          getApiErrorMessage(error, 'Não foi possível atualizar os totais.'),
        )
      }

      toast.success('Item excluído.')
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Não foi possível excluir o item.'),
      )
    } finally {
      setPendingItemId(null)
    }
  }

  function keepSheetOpen(event: { target: EventTarget | null; preventDefault: () => void }) {
    if (isNestedOverlayTarget(event.target)) event.preventDefault()
  }

  return (
    <>
    <Sheet
      open
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose()
      }}
    >
      <SheetContent
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
        onPointerDownOutside={keepSheetOpen}
        onInteractOutside={keepSheetOpen}
        onFocusOutside={keepSheetOpen}
      >
        <SheetHeader className="border-b px-6 py-5 pr-12">
          <SheetTitle className="truncate tracking-tight">
            {deal.title}
          </SheetTitle>
          <SheetDescription asChild>
            <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
              <p className="font-semibold tabular-nums text-foreground">
                {formatCurrency(estimatedValue)}
              </p>
              {deal.customer?.name ? (
                <p className="flex items-center gap-1.5">
                  <UserIcon className="size-3.5 shrink-0" strokeWidth={1.75} />
                  <span className="truncate">{deal.customer.name}</span>
                </p>
              ) : (
                <p>Cliente não associado</p>
              )}
            </div>
          </SheetDescription>
          {deal.status !== 'LOST' ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="mt-2 w-fit"
              onClick={() => setIsLostDialogOpen(true)}
            >
              Marcar como Perdido
            </Button>
          ) : null}
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-5">
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold tracking-tight">
                  Orçamentos
                </h2>
                <p className="text-xs text-muted-foreground">
                  Gerencie propostas vinculadas a este negócio.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                disabled={isCreatingQuote || isLoading}
                onClick={() => void handleCreateQuote()}
              >
                {isCreatingQuote ? (
                  <LoaderCircleIcon className="size-4 animate-spin" />
                ) : (
                  <PlusIcon />
                )}
                Novo Orçamento
              </Button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="px-3 text-xs">Orçamento</TableHead>
                    <TableHead className="px-3 text-xs">Status</TableHead>
                    <TableHead className="px-3 text-xs">Total</TableHead>
                    <TableHead className="px-3 text-xs">Validade</TableHead>
                    <TableHead className="px-3 text-right text-xs">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={5} className="px-3 py-10">
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                          <LoaderCircleIcon className="size-4 animate-spin" />
                          Carregando orçamentos
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : loadError ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={5}
                        className="px-3 py-10 text-center text-sm text-muted-foreground"
                      >
                        {loadError}
                      </TableCell>
                    </TableRow>
                  ) : quotes.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={5} className="px-3 py-10">
                        <div className="mx-auto flex max-w-xs flex-col items-center gap-2 text-center">
                          <FileTextIcon
                            className="size-6 text-muted-foreground/50"
                            strokeWidth={1.5}
                          />
                          <p className="text-sm text-muted-foreground">
                            Nenhum orçamento ainda. Crie o primeiro para este
                            negócio.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    quotes.map((quote) => {
                      const isSelected = quote.id === selectedQuoteId

                      return (
                        <TableRow
                          key={quote.id}
                          className={cn(
                            'cursor-pointer',
                            isSelected && 'bg-muted/60',
                          )}
                          onClick={() => {
                            if (selectedQuoteId !== quote.id) {
                              form.reset(emptyItemFormValues)
                            }
                            setSelectedQuoteId(quote.id)
                          }}
                        >
                          <TableCell className="px-3 py-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {quoteLabel(quote)}
                              </p>
                              <p className="truncate font-mono text-[11px] text-muted-foreground">
                                {quote.id.slice(0, 8)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell
                            className="px-3 py-3"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <Select
                              value={
                                isQuoteStatus(quote.status)
                                  ? quote.status
                                  : undefined
                              }
                              onValueChange={(value) => {
                                if (!isQuoteStatus(value)) return
                                void handleStatusChange(quote.id, value)
                              }}
                              disabled={updatingStatusId === quote.id}
                            >
                              <SelectTrigger
                                size="sm"
                                className="w-[7.75rem] px-2 text-xs"
                                aria-label={`Status de ${quoteLabel(quote)}`}
                              >
                                <SelectValue placeholder="Status" />
                              </SelectTrigger>
                              <SelectContent>
                                {QUOTE_STATUS_OPTIONS.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="px-3 py-3 text-sm font-medium tabular-nums">
                            {formatCurrency(quote.totalAmount)}
                          </TableCell>
                          <TableCell className="px-3 py-3 text-sm text-muted-foreground">
                            {formatQuoteDate(quote.validUntil)}
                          </TableCell>
                          <TableCell className="px-3 py-3 text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="text-muted-foreground hover:text-destructive"
                              aria-label={`Excluir ${quoteLabel(quote)}`}
                              onClick={(event) => {
                                event.stopPropagation()
                                setQuoteToDelete(quote)
                              }}
                            >
                              <Trash2Icon />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </section>

          {selectedQuote ? (
            <section className="flex flex-col gap-4 rounded-xl border border-border bg-muted/20 p-4">
              <div>
                <h3 className="text-sm font-semibold tracking-tight">
                  Itens · {quoteLabel(selectedQuote)}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Adicione produtos ou serviços a este orçamento.
                </p>
              </div>

              {selectedQuote.items.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-border bg-card">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="px-3 text-xs">Tipo</TableHead>
                        <TableHead className="px-3 text-xs">Descrição</TableHead>
                        <TableHead className="px-3 text-xs text-right">
                          Quantidade
                        </TableHead>
                        <TableHead className="px-3 text-xs text-right">
                          Preço unitário
                        </TableHead>
                        <TableHead className="px-3 text-xs text-right">
                          Total
                        </TableHead>
                        <TableHead className="px-3 text-right text-xs">
                          Ações
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedQuote.items.map((item) => (
                        <QuoteItemRow
                          key={`${item.id}-${item.quantity}-${item.unitPrice}`}
                          item={item}
                          disabled={pendingItemId !== null}
                          onSave={(quantity, unitPrice) =>
                            handleSaveItem(
                              selectedQuote.id,
                              item.id,
                              quantity,
                              unitPrice,
                            )
                          }
                          onDelete={() =>
                            handleDeleteItem(selectedQuote.id, item.id)
                          }
                        />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
                  Nenhum item neste orçamento.
                </p>
              )}

              <Form {...form}>
                <form
                  className="grid gap-3 sm:grid-cols-2"
                  onSubmit={form.handleSubmit((values) =>
                    void handleAddItem(values),
                  )}
                >
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={isAddingItem || pendingItemId !== null}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="SERVICE">Serviço</SelectItem>
                            <SelectItem value="PRODUCT">Produto</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Ex.: Manutenção preventiva"
                            disabled={isAddingItem || pendingItemId !== null}
                          />
                        </FormControl>
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
                            inputMode="decimal"
                            disabled={isAddingItem || pendingItemId !== null}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unitPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço unitário</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            inputMode="decimal"
                            disabled={isAddingItem || pendingItemId !== null}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-end justify-between gap-3 sm:col-span-2">
                    <p className="text-sm text-muted-foreground">
                      Total do item:{' '}
                      <span className="font-semibold tabular-nums text-foreground">
                        {formatCurrency(previewTotal)}
                      </span>
                    </p>
                    <Button type="submit" size="sm" disabled={isAddingItem || pendingItemId !== null}>
                      {isAddingItem ? (
                        <>
                          <LoaderCircleIcon className="size-4 animate-spin" />
                          Adicionando
                        </>
                      ) : (
                        <>
                          <PlusIcon />
                          Adicionar item
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>

              <div className="flex items-center justify-between border-t border-border pt-3">
                <p className="text-sm font-medium">Total do orçamento</p>
                <p className="text-base font-semibold tabular-nums">
                  {formatCurrency(
                    selectedQuote.totalAmount || selectedItemsTotal,
                  )}
                </p>
              </div>
            </section>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>

    <LostDealDialog
      open={isLostDialogOpen}
      isSubmitting={isMarkingLost}
      onOpenChange={setIsLostDialogOpen}
      onConfirm={handleMarkLost}
    />

    <AlertDialog
      open={quoteToDelete !== null}
      onOpenChange={(open) => {
        if (!open && !isDeletingQuote) setQuoteToDelete(null)
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir orçamento</AlertDialogTitle>
          <AlertDialogDescription>
            {quoteToDelete
              ? `${quoteLabel(quoteToDelete)} e os itens dele serão removidos.`
              : 'O orçamento e os itens dele serão removidos.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeletingQuote}>
            Cancelar
          </AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={isDeletingQuote}
            onClick={() => void handleDeleteQuote()}
          >
            {isDeletingQuote ? (
              <>
                <LoaderCircleIcon className="animate-spin" />
                Excluindo
              </>
            ) : (
              'Excluir'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}
