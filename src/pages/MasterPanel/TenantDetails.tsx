import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  LoaderCircleIcon,
  MapPinIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  ReceiptIcon,
  Trash2Icon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCnpj, formatCurrency } from '@/lib/formatters'
import {
  createMasterPayment,
  deleteMasterPayment,
  getMasterTenant,
  listMasterPayments,
  markMasterPaymentAsPaid,
  updateMasterTenant,
  type MasterPayment,
  type MasterTenantDetails,
  type PaymentStatus,
} from '@/services/masterService'
import { getApiErrorMessage } from '@/services/userService'

import { EditTenantForm } from './EditTenantForm'
import { PaymentForm } from './PaymentForm'
import {
  parseCurrencyInput,
  toIsoDateTime,
  toUpdateTenantPayload,
  type EditTenantFormValues,
  type PaymentFormValues,
} from './schema'

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const paymentStatusStyles: Record<
  PaymentStatus,
  { label: string; className: string }
> = {
  PAGO: {
    label: 'Pago',
    className:
      'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  },
  PENDENTE: {
    label: 'Pendente',
    className:
      'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  },
  ATRASADO: {
    label: 'Atrasado',
    className: 'border-destructive/25 bg-destructive/10 text-destructive',
  },
}

const headClassName =
  'px-4 text-xs font-medium tracking-wide text-muted-foreground'

function formatDate(value: string | null) {
  if (!value) return '—'

  const date = new Date(value.includes('T') ? value : `${value}T12:00:00`)
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date)
}

function displayValue(value: string | null | undefined) {
  return value?.trim() ? value : '—'
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-card px-4 py-3">
      <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <span className="text-sm font-medium tracking-tight text-foreground">
        {value}
      </span>
    </div>
  )
}

export function TenantDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const [tenant, setTenant] = useState<MasterTenantDetails | null>(null)
  const [payments, setPayments] = useState<MasterPayment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingPayments, setIsLoadingPayments] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [paymentsError, setPaymentsError] = useState<string | null>(null)
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false)
  const [paymentFormSession, setPaymentFormSession] = useState(0)
  const [isSavingPayment, setIsSavingPayment] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editFormSession, setEditFormSession] = useState(0)
  const [isSavingTenant, setIsSavingTenant] = useState(false)
  const [pendingPaymentId, setPendingPaymentId] = useState<string | null>(null)
  const [paymentToDelete, setPaymentToDelete] = useState<MasterPayment | null>(
    null,
  )
  const [isDeletingPayment, setIsDeletingPayment] = useState(false)

  async function loadPayments(tenantId: string, options?: { silent?: boolean }) {
    if (!options?.silent) {
      setIsLoadingPayments(true)
      setPaymentsError(null)
    }

    try {
      setPayments(await listMasterPayments(tenantId))
      setPaymentsError(null)
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        'Não foi possível carregar os pagamentos.',
      )

      if (!options?.silent) {
        setPayments([])
        setPaymentsError(message)
      }

      toast.error(message)
    } finally {
      if (!options?.silent) setIsLoadingPayments(false)
    }
  }

  useEffect(() => {
    if (!id) return

    let ignore = false

    getMasterTenant(id)
      .then((data) => {
        if (ignore) return
        setTenant(data)
        setLoadError(null)
      })
      .catch((error: unknown) => {
        if (ignore) return

        const message = getApiErrorMessage(
          error,
          'Não foi possível carregar o cliente.',
        )
        setTenant(null)
        setLoadError(message)
        toast.error(message)
      })
      .finally(() => {
        if (!ignore) setIsLoading(false)
      })

    listMasterPayments(id)
      .then((data) => {
        if (ignore) return
        setPayments(data)
        setPaymentsError(null)
      })
      .catch((error: unknown) => {
        if (ignore) return

        const message = getApiErrorMessage(
          error,
          'Não foi possível carregar os pagamentos.',
        )
        setPayments([])
        setPaymentsError(message)
        toast.error(message)
      })
      .finally(() => {
        if (!ignore) setIsLoadingPayments(false)
      })

    return () => {
      ignore = true
    }
  }, [id])

  async function handleCreatePayment(values: PaymentFormValues) {
    if (!id) return

    setIsSavingPayment(true)

    try {
      const amount = Number(parseCurrencyInput(values.amount))
      const dueDate = new Date(
        values.dueDate.includes('T')
          ? values.dueDate
          : `${values.dueDate}T12:00:00`,
      ).toISOString()

      await createMasterPayment(id, {
        amount,
        dueDate,
        status: values.status,
        ...(values.status === 'PAGO' && values.paidAt.trim()
          ? { paidAt: toIsoDateTime(values.paidAt) }
          : {}),
      })
      toast.success('Pagamento lançado.')
      setIsPaymentFormOpen(false)
      await loadPayments(id, { silent: true })
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Não foi possível lançar o pagamento.'),
      )
    } finally {
      setIsSavingPayment(false)
    }
  }

  async function handleUpdateTenant(values: EditTenantFormValues) {
    if (!id) return

    setIsSavingTenant(true)

    try {
      const updated = await updateMasterTenant(id, toUpdateTenantPayload(values))
      setTenant(updated)
      setIsEditOpen(false)
      toast.success('Cliente atualizado.')
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Não foi possível atualizar o cliente.'),
      )
    } finally {
      setIsSavingTenant(false)
    }
  }

  async function handleMarkAsPaid(payment: MasterPayment) {
    if (!id) return

    setPendingPaymentId(payment.id)

    try {
      await markMasterPaymentAsPaid(id, payment.id)
      toast.success('Baixa registrada com sucesso.')
      await loadPayments(id, { silent: true })
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Não foi possível dar baixa no pagamento.'),
      )
    } finally {
      setPendingPaymentId(null)
    }
  }

  async function handleDeletePayment() {
    if (!id || !paymentToDelete) return

    setIsDeletingPayment(true)

    try {
      await deleteMasterPayment(id, paymentToDelete.id)
      toast.success('Pagamento excluído.')
      setPaymentToDelete(null)
      await loadPayments(id, { silent: true })
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Não foi possível excluir o pagamento.'),
      )
    } finally {
      setIsDeletingPayment(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-muted-foreground">
        <LoaderCircleIcon className="size-4 animate-spin" />
        Carregando cliente
      </div>
    )
  }

  if (loadError || !tenant) {
    return (
      <div className="mx-auto flex max-w-sm flex-col items-center gap-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">
          {loadError ?? 'Cliente não encontrado.'}
        </p>
        <Button asChild variant="outline" size="sm">
          <Link to="/rpg-admin">
            <ArrowLeftIcon />
            Voltar ao Painel
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="-ml-2 w-fit text-muted-foreground"
        >
          <Link to="/rpg-admin">
            <ArrowLeftIcon />
            Voltar
          </Link>
        </Button>

        <header className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                {tenant.tradeName || tenant.name}
              </h1>
              {tenant.active ? (
                <Badge
                  variant="outline"
                  className="gap-1.5 border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                >
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Ativo
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="gap-1.5 border-destructive/25 bg-destructive/10 text-destructive"
                >
                  <span className="size-1.5 rounded-full bg-destructive" />
                  Inativo
                </Badge>
              )}
            </div>
            <div className="flex flex-col gap-0.5 text-sm text-muted-foreground">
              {tenant.tradeName ? (
                <p>
                  <span className="text-foreground/80">{tenant.name}</span>
                </p>
              ) : null}
              <p className="font-mono text-xs tabular-nums">
                {tenant.cnpj ? formatCnpj(tenant.cnpj) : 'CNPJ não informado'}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="shrink-0"
            onClick={() => {
              setEditFormSession((session) => session + 1)
              setIsEditOpen(true)
            }}
          >
            <PencilIcon />
            Editar Cliente
          </Button>
        </header>
      </div>

      <Tabs defaultValue="overview" className="gap-4">
        <TabsList variant="line">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="finance">Financeiro</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex flex-col gap-4">
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              <MapPinIcon className="size-3.5" strokeWidth={1.75} />
              Endereço e cadastro
            </div>

            {tenant.address ? (
              <div className="rounded-xl border border-border bg-card px-5 py-4">
                <p className="text-sm leading-6 font-medium tracking-tight">
                  {tenant.address}
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border px-5 py-8 text-center text-sm text-muted-foreground">
                Nenhum endereço cadastrado para este cliente.
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <InfoItem
                label="Inscrição Estadual"
                value={displayValue(tenant.stateRegistration)}
              />
              <InfoItem
                label="Inscrição Municipal"
                value={displayValue(tenant.municipalRegistration)}
              />
            </div>
          </section>
        </TabsContent>

        <TabsContent value="finance" className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                <ReceiptIcon className="size-3.5" strokeWidth={1.75} />
                Histórico de pagamentos
              </div>
              <p className="text-sm text-muted-foreground">
                {isLoadingPayments
                  ? 'Carregando...'
                  : `${payments.length} ${payments.length === 1 ? 'lançamento' : 'lançamentos'}`}
              </p>
            </div>

            <Button
              type="button"
              onClick={() => {
                setPaymentFormSession((session) => session + 1)
                setIsPaymentFormOpen(true)
              }}
            >
              <PlusIcon />
              Lançar Pagamento
            </Button>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className={headClassName}>Valor</TableHead>
                  <TableHead className={headClassName}>Vencimento</TableHead>
                  <TableHead className={headClassName}>Status</TableHead>
                  <TableHead className={headClassName}>
                    Data de Pagamento
                  </TableHead>
                  <TableHead className={`${headClassName} w-24 text-right`}>
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingPayments ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={5} className="px-4 py-16">
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <LoaderCircleIcon className="size-4 animate-spin" />
                        Carregando pagamentos
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paymentsError ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={5} className="px-4 py-16">
                      <div className="mx-auto flex max-w-sm flex-col items-center gap-3 text-center">
                        <p className="text-sm text-muted-foreground">
                          {paymentsError}
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (id) void loadPayments(id)
                          }}
                        >
                          Tentar de novo
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : payments.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={5} className="px-4 py-16">
                      <div className="mx-auto flex max-w-sm flex-col items-center gap-3 text-center">
                        <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
                          <ReceiptIcon className="size-4" strokeWidth={1.75} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <p className="text-sm font-medium tracking-tight">
                            Nenhum pagamento lançado
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Registre a primeira cobrança deste assinante.
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            setPaymentFormSession((session) => session + 1)
                            setIsPaymentFormOpen(true)
                          }}
                        >
                          <PlusIcon />
                          Lançar Pagamento
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => {
                    const status = paymentStatusStyles[payment.status]
                    const isBusy = pendingPaymentId === payment.id
                    const canMarkAsPaid = payment.status !== 'PAGO'

                    return (
                      <TableRow key={payment.id}>
                        <TableCell className="px-4 font-medium tabular-nums">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell className="px-4 whitespace-nowrap text-muted-foreground">
                          {formatDate(payment.dueDate)}
                        </TableCell>
                        <TableCell className="px-4">
                          <Badge
                            variant="outline"
                            className={status.className}
                          >
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 whitespace-nowrap text-muted-foreground">
                          {formatDate(payment.paidAt)}
                        </TableCell>
                        <TableCell className="px-4">
                          <div className="flex items-center justify-end gap-1">
                            {isBusy ? (
                              <LoaderCircleIcon className="size-4 animate-spin text-muted-foreground" />
                            ) : null}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  disabled={isBusy || isDeletingPayment}
                                  aria-label="Ações do pagamento"
                                >
                                  <MoreHorizontalIcon />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                {canMarkAsPaid ? (
                                  <DropdownMenuItem
                                    className="cursor-pointer"
                                    onClick={() =>
                                      void handleMarkAsPaid(payment)
                                    }
                                  >
                                    <CheckCircle2Icon />
                                    Dar Baixa
                                  </DropdownMenuItem>
                                ) : null}
                                <DropdownMenuItem
                                  variant="destructive"
                                  className="cursor-pointer"
                                  onClick={() => setPaymentToDelete(payment)}
                                >
                                  <Trash2Icon />
                                  Excluir Pagamento
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <EditTenantForm
        key={`${tenant.id}-${editFormSession}`}
        open={isEditOpen}
        tenant={tenant}
        isSubmitting={isSavingTenant}
        onOpenChange={setIsEditOpen}
        onSubmit={handleUpdateTenant}
      />

      <PaymentForm
        key={paymentFormSession}
        open={isPaymentFormOpen}
        isSubmitting={isSavingPayment}
        onOpenChange={setIsPaymentFormOpen}
        onSubmit={handleCreatePayment}
      />

      <AlertDialog
        open={paymentToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !isDeletingPayment) setPaymentToDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir pagamento</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove o lançamento de{' '}
              {paymentToDelete
                ? formatCurrency(paymentToDelete.amount)
                : 'pagamento'}{' '}
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingPayment}>
              Cancelar
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeletingPayment}
              onClick={() => void handleDeletePayment()}
            >
              {isDeletingPayment ? (
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
    </div>
  )
}
