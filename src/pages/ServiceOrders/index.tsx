import {
  ClipboardListIcon,
  EyeIcon,
  FilterIcon,
  LoaderCircleIcon,
  MailIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SearchIcon,
  UserRoundIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  getApiErrorMessage,
  listOrders,
  sendOrderEmail,
  type ServiceOrder,
} from '@/services/serviceOrderService'

import { NewOrderSheet } from './NewOrderSheet'
import { OrderStatusBadge, OrderTypeIcon } from './OrderMeta'
import { formatDateTime, formatOrderNumber } from './presentation'
import { SendEmailDialog } from './SendEmailDialog'

const STATUS_OPTIONS = [
  { value: 'TODOS', label: 'Todos os status' },
  { value: 'ABERTA', label: 'Aberta' },
  { value: 'ORCAMENTO', label: 'Orçamento' },
  { value: 'FINALIZADA', label: 'Finalizada' },
  { value: 'CANCELADA', label: 'Cancelada' },
] as const

export function ServiceOrdersPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const searchTerm = searchParams.get('q') ?? ''
  const statusFilter = searchParams.get('status') || 'TODOS'
  const techFilter = searchParams.get('tech') || 'TODOS'

  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formSession, setFormSession] = useState(0)
  const [emailOrder, setEmailOrder] = useState<ServiceOrder | null>(null)
  const [emailSession, setEmailSession] = useState(0)

  function updateParam(key: string, value: string) {
    const nextParams = new URLSearchParams(searchParams)

    if (!value || value === 'TODOS') {
      nextParams.delete(key)
    } else {
      nextParams.set(key, value)
    }

    setSearchParams(nextParams, { replace: true })
  }

  function clearFilters() {
    setSearchParams(new URLSearchParams(), { replace: true })
  }

  async function loadOrders(options?: { silent?: boolean }) {
    if (!options?.silent) {
      setIsLoading(true)
      setLoadError(null)
    }

    try {
      const data = await listOrders()
      setOrders(data)
      setLoadError(null)
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        'Não foi possível carregar as ordens de serviço.',
      )

      if (!options?.silent) {
        setOrders([])
        setLoadError(message)
      }

      toast.error(message)
    } finally {
      if (!options?.silent) setIsLoading(false)
    }
  }

  useEffect(() => {
    let ignore = false

    listOrders()
      .then((data) => {
        if (!ignore) setOrders(data)
      })
      .catch((error: unknown) => {
        if (ignore) return

        const message = getApiErrorMessage(
          error,
          'Não foi possível carregar as ordens de serviço.',
        )
        setLoadError(message)
        toast.error(message)
      })
      .finally(() => {
        if (!ignore) setIsLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [])

  const availableTechnicians = useMemo(() => {
    const names = orders
      .filter((order) => order.status === 'FINALIZADA' && order.closedBy?.name)
      .map((order) => order.closedBy!.name)

    return Array.from(new Set(names)).sort((left, right) =>
      left.localeCompare(right, 'pt-BR'),
    )
  }, [orders])

  const filteredOrders = useMemo(() => {
    const term = searchTerm.trim().toLocaleLowerCase('pt-BR')

    return orders.filter((order) => {
      const orderNumber = order.number ? String(order.number) : ''
      const paddedNumber = String(order.number ?? '').padStart(4, '0')
      const customerName = order.customer?.name.toLocaleLowerCase('pt-BR') ?? ''
      const serialNumber =
        order.equipment?.serial_number.toLocaleLowerCase('pt-BR') ?? ''
      const matchesText =
        !term ||
        orderNumber.includes(term) ||
        paddedNumber.includes(term) ||
        customerName.includes(term) ||
        serialNumber.includes(term)

      const matchesStatus =
        statusFilter === 'TODOS' || order.status === statusFilter
      const matchesTech =
        techFilter === 'TODOS' ||
        (order.status === 'FINALIZADA' && order.closedBy?.name === techFilter)

      return matchesText && matchesStatus && matchesTech
    })
  }, [orders, searchTerm, statusFilter, techFilter])

  const hasFilters =
    searchTerm.trim().length > 0 ||
    statusFilter !== 'TODOS' ||
    techFilter !== 'TODOS'

  const countLabel = isLoading
    ? 'Carregando ordens...'
    : filteredOrders.length === orders.length
      ? orders.length === 1
        ? '1 ordem'
        : `${orders.length} ordens`
      : `${filteredOrders.length} de ${orders.length}`

  function openCreateForm() {
    setFormSession((session) => session + 1)
    setIsFormOpen(true)
  }

  function openEmailDialog(order: ServiceOrder) {
    setEmailOrder(order)
    setEmailSession((session) => session + 1)
  }

  async function handleSendEmail(email: string) {
    if (!emailOrder) return

    try {
      const response = await sendOrderEmail(emailOrder.id, email)
      toast.success(response.message || 'E-mail enviado com sucesso!')
      setEmailOrder(null)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Erro ao enviar o e-mail.'))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Ordens de Serviço
          </h1>
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? 'Acompanhe e gerencie as manutenções da oficina.'
              : countLabel}
          </p>
        </div>
        <Button type="button" onClick={openCreateForm}>
          <PlusIcon />
          Nova O.S.
        </Button>
      </header>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <SearchIcon
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              strokeWidth={1.75}
            />
            <Input
              value={searchTerm}
              onChange={(event) => updateParam('q', event.target.value)}
              type="search"
              placeholder="Buscar por número, cliente ou série"
              aria-label="Buscar ordens de serviço"
              className="pl-9"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Select
              value={statusFilter}
              onValueChange={(value) => updateParam('status', value)}
            >
              <SelectTrigger className="w-full sm:w-48" aria-label="Filtrar por status">
                <FilterIcon className="text-muted-foreground" strokeWidth={1.75} />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent align="start">
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={
                availableTechnicians.includes(techFilter) || techFilter === 'TODOS'
                  ? techFilter
                  : 'TODOS'
              }
              onValueChange={(value) => updateParam('tech', value)}
              disabled={availableTechnicians.length === 0}
            >
              <SelectTrigger
                className="w-full sm:w-52"
                aria-label="Filtrar por técnico"
              >
                <UserRoundIcon className="text-muted-foreground" strokeWidth={1.75} />
                <SelectValue placeholder="Técnico" />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectItem value="TODOS">Todos os técnicos</SelectItem>
                {availableTechnicians.map((technician) => (
                  <SelectItem key={technician} value={technician}>
                    {technician}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasFilters ? (
              <Button type="button" variant="ghost" onClick={clearFilters}>
                Limpar
              </Button>
            ) : null}
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-4 text-xs font-medium tracking-wide text-muted-foreground">
                O.S.
              </TableHead>
              <TableHead className="px-4 text-xs font-medium tracking-wide text-muted-foreground">
                Cliente / equipamento
              </TableHead>
              <TableHead className="px-4 text-xs font-medium tracking-wide text-muted-foreground">
                Problema relatado
              </TableHead>
              <TableHead className="px-4 text-xs font-medium tracking-wide text-muted-foreground">
                Abertura
              </TableHead>
              <TableHead className="px-4 text-xs font-medium tracking-wide text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="px-4 text-right text-xs font-medium tracking-wide text-muted-foreground">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="px-4 py-16">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <LoaderCircleIcon className="size-4 animate-spin" />
                    Carregando ordens de serviço
                  </div>
                </TableCell>
              </TableRow>
            ) : loadError ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="px-4 py-16">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-3 text-center">
                    <p className="text-sm text-muted-foreground">{loadError}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void loadOrders()}
                    >
                      Tentar de novo
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="px-4 py-16">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-3 text-center">
                    <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
                      <ClipboardListIcon className="size-4" strokeWidth={1.75} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium tracking-tight">
                        Nenhuma ordem de serviço encontrada
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {orders.length === 0
                          ? 'Abra a primeira O.S. para começar o atendimento.'
                          : 'Nenhuma ordem corresponde aos filtros atuais.'}
                      </p>
                    </div>
                    {orders.length === 0 ? (
                      <Button type="button" size="sm" onClick={openCreateForm}>
                        <PlusIcon />
                        Nova O.S.
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow
                  key={order.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/ordens-de-servico/${order.id}`)}
                >
                  <TableCell className="px-4">
                    <div className="flex items-center gap-2 font-medium tabular-nums">
                      <OrderTypeIcon type={order.type} />
                      {formatOrderNumber(order.number)}
                    </div>
                  </TableCell>
                  <TableCell className="px-4">
                    <p className="max-w-56 truncate text-sm font-medium">
                      {order.customer?.name || 'Sem cliente'}
                    </p>
                    <p className="max-w-56 truncate text-xs text-muted-foreground">
                      S/N: {order.equipment?.serial_number || '—'}
                      {order.equipment?.model?.name
                        ? ` · ${order.equipment.model.name}`
                        : ''}
                    </p>
                  </TableCell>
                  <TableCell className="max-w-xs truncate px-4 text-muted-foreground">
                    {order.problem_description}
                  </TableCell>
                  <TableCell className="px-4 whitespace-nowrap text-muted-foreground tabular-nums">
                    {order.opened_at
                      ? formatDateTime(order.opened_at)
                      : 'Indisponível'}
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="flex flex-col items-start gap-1">
                      <OrderStatusBadge status={order.status} />
                      {order.status === 'FINALIZADA' && order.closedBy?.name ? (
                        <span className="text-xs text-muted-foreground">
                          {order.closedBy.name.split(' ')[0]}
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell
                    className="px-4 text-right"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Ações da O.S. ${formatOrderNumber(order.number)}`}
                        >
                          <MoreHorizontalIcon />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={() =>
                            navigate(`/ordens-de-servico/${order.id}`)
                          }
                        >
                          <EyeIcon />
                          Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={order.status !== 'FINALIZADA'}
                          title={
                            order.status === 'FINALIZADA'
                              ? undefined
                              : 'Disponível apenas para ordens finalizadas'
                          }
                          onSelect={() => openEmailDialog(order)}
                        >
                          <MailIcon />
                          Enviar por E-mail
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <NewOrderSheet
        key={formSession}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onCreated={() => loadOrders({ silent: true })}
      />

      <SendEmailDialog
        key={`${emailOrder?.id ?? 'email'}-${emailSession}`}
        open={emailOrder !== null}
        orderNumber={emailOrder?.number}
        defaultEmail={emailOrder?.customer?.email}
        onOpenChange={(open) => {
          if (!open) setEmailOrder(null)
        }}
        onConfirm={handleSendEmail}
      />
    </div>
  )
}
