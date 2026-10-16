import {
  Building2Icon,
  LoaderCircleIcon,
  PlusIcon,
  SearchIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCnpj, getInitials } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import {
  createMasterTenant,
  listMasterTenants,
  toggleMasterTenant,
  type MasterTenant,
} from '@/services/masterService'
import { getApiErrorMessage } from '@/services/userService'

import { toCreateTenantPayload, type TenantFormValues } from './schema'
import { TenantForm } from './TenantForm'

type StatusFilter = 'all' | 'active' | 'inactive'

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Ativos' },
  { value: 'inactive', label: 'Inativos' },
]

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

function formatDate(value: string | null) {
  if (!value) return '—'

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date)
}

const headClassName =
  'px-4 text-xs font-medium tracking-wide text-muted-foreground'

export function MasterPanelPage() {
  const [tenants, setTenants] = useState<MasterTenant[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formSession, setFormSession] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
  const [tenantToDeactivate, setTenantToDeactivate] =
    useState<MasterTenant | null>(null)

  async function loadTenants(options?: { silent?: boolean }) {
    if (!options?.silent) {
      setIsLoading(true)
      setLoadError(null)
    }

    try {
      setTenants(await listMasterTenants())
      setLoadError(null)
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        'Não foi possível carregar os assinantes.',
      )

      if (!options?.silent) {
        setTenants([])
        setLoadError(message)
      }

      toast.error(message)
    } finally {
      if (!options?.silent) setIsLoading(false)
    }
  }

  useEffect(() => {
    let ignore = false

    listMasterTenants()
      .then((data) => {
        if (!ignore) setTenants(data)
      })
      .catch((error: unknown) => {
        if (ignore) return

        const message = getApiErrorMessage(
          error,
          'Não foi possível carregar os assinantes.',
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

  const activeCount = useMemo(
    () => tenants.filter((tenant) => tenant.active).length,
    [tenants],
  )

  const filteredTenants = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR')
    const digits = query.replace(/\D/g, '')

    return tenants.filter((tenant) => {
      if (statusFilter === 'active' && !tenant.active) return false
      if (statusFilter === 'inactive' && tenant.active) return false
      if (!query) return true

      const haystack = [tenant.name, tenant.tradeName ?? '']
        .join(' ')
        .toLocaleLowerCase('pt-BR')

      if (haystack.includes(query)) return true

      return Boolean(digits && tenant.cnpj?.replace(/\D/g, '').includes(digits))
    })
  }, [search, statusFilter, tenants])

  function openCreateForm() {
    setFormSession((session) => session + 1)
    setIsFormOpen(true)
  }

  async function handleCreate(values: TenantFormValues) {
    setIsSaving(true)

    try {
      await createMasterTenant(toCreateTenantPayload(values))
      toast.success('Cliente cadastrado.', {
        description: `${values.tradeName.trim() || values.name.trim()} já pode acessar o sistema.`,
      })
      setIsFormOpen(false)
      await loadTenants({ silent: true })
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Não foi possível cadastrar o cliente.'),
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function toggleTenant(tenant: MasterTenant) {
    setPendingIds((current) => new Set(current).add(tenant.id))

    try {
      await toggleMasterTenant(tenant.id)
      setTenants((current) =>
        current.map((item) =>
          item.id === tenant.id ? { ...item, active: !item.active } : item,
        ),
      )
      toast.success(tenant.active ? 'Cliente desativado.' : 'Cliente ativado.')
      setTenantToDeactivate(null)
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Não foi possível alterar o status.'),
      )
    } finally {
      setPendingIds((current) => {
        const next = new Set(current)
        next.delete(tenant.id)
        return next
      })
    }
  }

  function handleSwitchChange(tenant: MasterTenant) {
    if (tenant.active) {
      setTenantToDeactivate(tenant)
      return
    }

    void toggleTenant(tenant)
  }

  const isDeactivating =
    tenantToDeactivate !== null && pendingIds.has(tenantToDeactivate.id)

  const summary = isLoading
    ? 'Carregando assinantes...'
    : `${tenants.length} ${tenants.length === 1 ? 'assinante' : 'assinantes'} · ${activeCount} ${activeCount === 1 ? 'ativo' : 'ativos'}`

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Gestão de Assinantes - RPG SaaS
          </h1>
          <p className="text-sm text-muted-foreground">{summary}</p>
        </div>

        <Button type="button" onClick={openCreateForm}>
          <PlusIcon />
          Novo Cliente
        </Button>
      </header>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:w-80">
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.75}
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            type="search"
            placeholder="Buscar por nome ou CNPJ"
            aria-label="Buscar assinantes"
            className="pl-9"
          />
        </div>

        <div
          role="tablist"
          aria-label="Filtrar por status"
          className="inline-flex w-fit items-center gap-0.5 rounded-lg border border-border bg-muted/50 p-0.5"
        >
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              role="tab"
              aria-selected={statusFilter === filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={cn(
                'h-7 rounded-md px-3 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                statusFilter === filter.value
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table className="min-w-[56rem] table-fixed">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className={cn(headClassName, 'w-[28%]')}>
                Razão Social
              </TableHead>
              <TableHead className={headClassName}>Nome Fantasia</TableHead>
              <TableHead className={cn(headClassName, 'w-44')}>CNPJ</TableHead>
              <TableHead className={cn(headClassName, 'w-36')}>
                Data de Cadastro
              </TableHead>
              <TableHead className={cn(headClassName, 'w-28')}>Status</TableHead>
              <TableHead className={cn(headClassName, 'w-28 text-right')}>
                Acesso
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="px-4 py-16">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <LoaderCircleIcon className="size-4 animate-spin" />
                    Carregando assinantes
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
                      onClick={() => void loadTenants()}
                    >
                      Tentar de novo
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredTenants.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="px-4 py-16">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-3 text-center">
                    <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
                      <Building2Icon className="size-4" strokeWidth={1.75} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium tracking-tight">
                        {tenants.length === 0
                          ? 'Nenhum assinante ainda'
                          : 'Nenhum assinante para esse filtro'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {tenants.length === 0
                          ? 'Cadastre a primeira empresa cliente da RPG.'
                          : 'Tente outro nome, CNPJ ou status.'}
                      </p>
                    </div>
                    {tenants.length === 0 ? (
                      <Button type="button" size="sm" onClick={openCreateForm}>
                        <PlusIcon />
                        Novo Cliente
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredTenants.map((tenant) => {
                const isPending = pendingIds.has(tenant.id)

                return (
                  <TableRow key={tenant.id}>
                    <TableCell className="px-4">
                      <Link
                        to={`/rpg-admin/tenant/${tenant.id}`}
                        className={cn(
                          'flex min-w-0 items-center gap-3 transition-opacity hover:opacity-80',
                          !tenant.active && 'opacity-50',
                        )}
                      >
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-[0.65rem] font-semibold text-muted-foreground">
                          {getInitials(tenant.tradeName || tenant.name)}
                        </span>
                        <span
                          className={cn(
                            'truncate font-medium text-foreground underline-offset-4 hover:underline',
                            !tenant.active &&
                              'line-through decoration-muted-foreground/40',
                          )}
                          title={tenant.name}
                        >
                          {tenant.name}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell
                      className={cn(
                        'px-4 text-muted-foreground transition-opacity',
                        !tenant.active && 'opacity-50',
                      )}
                    >
                      {tenant.tradeName ? (
                        <Link
                          to={`/rpg-admin/tenant/${tenant.id}`}
                          className="block truncate underline-offset-4 hover:text-foreground hover:underline"
                          title={tenant.tradeName}
                        >
                          {tenant.tradeName}
                        </Link>
                      ) : (
                        <span className="block truncate">—</span>
                      )}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'px-4 font-mono text-xs whitespace-nowrap text-muted-foreground tabular-nums transition-opacity',
                        !tenant.active && 'opacity-50',
                      )}
                    >
                      {tenant.cnpj ? formatCnpj(tenant.cnpj) : '—'}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'px-4 whitespace-nowrap text-muted-foreground transition-opacity',
                        !tenant.active && 'opacity-50',
                      )}
                    >
                      {formatDate(tenant.createdAt)}
                    </TableCell>
                    <TableCell className="px-4">
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
                    </TableCell>
                    <TableCell className="px-4">
                      <div className="flex items-center justify-end gap-2">
                        {isPending ? (
                          <LoaderCircleIcon className="size-3.5 animate-spin text-muted-foreground" />
                        ) : null}
                        <Switch
                          checked={tenant.active}
                          disabled={isPending}
                          onCheckedChange={() => handleSwitchChange(tenant)}
                          aria-label={
                            tenant.active
                              ? `Desativar ${tenant.name}`
                              : `Ativar ${tenant.name}`
                          }
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <TenantForm
        key={formSession}
        open={isFormOpen}
        isSubmitting={isSaving}
        onOpenChange={setIsFormOpen}
        onSubmit={handleCreate}
      />

      <AlertDialog
        open={tenantToDeactivate !== null}
        onOpenChange={(open) => {
          if (!open && !isDeactivating) setTenantToDeactivate(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar cliente</AlertDialogTitle>
            <AlertDialogDescription>
              {tenantToDeactivate?.tradeName || tenantToDeactivate?.name} e
              todos os seus usuários perdem o acesso ao sistema até que o
              cliente seja reativado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeactivating}>
              Cancelar
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeactivating}
              onClick={() => {
                if (tenantToDeactivate) void toggleTenant(tenantToDeactivate)
              }}
            >
              {isDeactivating ? (
                <>
                  <LoaderCircleIcon className="animate-spin" />
                  Desativando
                </>
              ) : (
                'Desativar'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
