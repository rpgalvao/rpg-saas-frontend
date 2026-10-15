import {
  ArrowRightLeftIcon,
  LoaderCircleIcon,
  PackageIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  UserCheckIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency } from '@/lib/formatters'
import {
  createPart,
  deletePart,
  listParts,
  updatePart,
  type Part,
} from '@/services/partService'
import { createStockMovement } from '@/services/stockMovementService'
import { getApiErrorMessage } from '@/services/supplierService'

import { MovementForm } from './MovementForm'
import { PartForm } from './PartForm'
import {
  toMovementPayload,
  toPartPayload,
  type MovementFormValues,
  type PartFormValues,
} from './schema'

function isLowStock(part: Part) {
  return part.current_stock <= part.min_stock
}

export function PartsTab() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const columnCount = isAdmin ? 7 : 6
  const [parts, setParts] = useState<Part[]>([])
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formSession, setFormSession] = useState(0)
  const [editingPart, setEditingPart] = useState<Part | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [partToDeactivate, setPartToDeactivate] = useState<Part | null>(null)
  const [isDeactivating, setIsDeactivating] = useState(false)
  const [reactivatingId, setReactivatingId] = useState<string | null>(null)
  const [movementPart, setMovementPart] = useState<Part | null>(null)
  const [movementSession, setMovementSession] = useState(0)
  const [isMoving, setIsMoving] = useState(false)

  async function loadParts(options?: { silent?: boolean }) {
    if (!options?.silent) {
      setIsLoading(true)
      setLoadError(null)
    }

    try {
      const data = await listParts(showInactive)
      setParts(data)
      setLoadError(null)
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        'Não foi possível carregar as peças.',
      )

      if (!options?.silent) {
        setParts([])
        setLoadError(message)
      }

      toast.error(message)
    } finally {
      if (!options?.silent) setIsLoading(false)
    }
  }

  useEffect(() => {
    let ignore = false

    listParts(showInactive)
      .then((data) => {
        if (!ignore) setParts(data)
      })
      .catch((error: unknown) => {
        if (ignore) return

        const message = getApiErrorMessage(
          error,
          'Não foi possível carregar as peças.',
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
  }, [showInactive])

  const filteredParts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR')

    if (!query) return parts

    return parts.filter((part) => {
      const haystack = [part.name, part.sku, part.supplier?.name]
        .filter((value): value is string => Boolean(value))
        .join(' ')
        .toLocaleLowerCase('pt-BR')

      return haystack.includes(query)
    })
  }, [parts, search])

  function openCreateForm() {
    setEditingPart(null)
    setFormSession((session) => session + 1)
    setIsFormOpen(true)
  }

  function openEditForm(part: Part) {
    setEditingPart(part)
    setFormSession((session) => session + 1)
    setIsFormOpen(true)
  }

  function openMovement(part: Part) {
    setMovementPart(part)
    setMovementSession((session) => session + 1)
  }

  async function handleSubmit(values: PartFormValues) {
    setIsSaving(true)

    try {
      if (editingPart) {
        await updatePart(editingPart.id, toPartPayload(values, 'update'))
        toast.success('Peça atualizada.')
      } else {
        await createPart(toPartPayload(values, 'create'))
        toast.success('Peça criada.')
      }

      setIsFormOpen(false)
      await loadParts({ silent: true })
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível salvar a peça.'))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleMovement(values: MovementFormValues) {
    if (!movementPart) return

    setIsMoving(true)

    try {
      await createStockMovement(toMovementPayload(values))
      toast.success('Movimentação registrada.')
      setMovementPart(null)
      await loadParts({ silent: true })
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Não foi possível registrar a movimentação.'),
      )
    } finally {
      setIsMoving(false)
    }
  }

  async function handleDeactivate() {
    if (!partToDeactivate) return

    setIsDeactivating(true)

    try {
      await deletePart(partToDeactivate.id)
      toast.success('Peça inativada.')
      setPartToDeactivate(null)
      await loadParts({ silent: true })
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível inativar a peça.'))
    } finally {
      setIsDeactivating(false)
    }
  }

  async function handleReactivate(part: Part) {
    setReactivatingId(part.id)

    try {
      await updatePart(part.id, {
        name: part.name,
        cost_price: Number(part.cost_price),
        sale_price: Number(part.sale_price),
        current_stock: part.current_stock,
        min_stock: part.min_stock,
        supplierId: part.supplierId,
        active: true,
      })
      toast.success('Peça reativada.')
      await loadParts({ silent: true })
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível reativar a peça.'))
    } finally {
      setReactivatingId(null)
    }
  }

  const countLabel = parts.length === 1 ? '1 peça' : `${parts.length} peças`

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {isLoading ? 'Carregando o catálogo...' : countLabel}
        </p>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative sm:w-72">
            <SearchIcon
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              strokeWidth={1.75}
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              type="search"
              placeholder="Buscar por nome ou SKU"
              aria-label="Buscar peças"
              className="pl-9"
            />
          </div>
          <Button
            type="button"
            variant={showInactive ? 'secondary' : 'outline'}
            onClick={() => {
              setIsLoading(true)
              setShowInactive((current) => !current)
            }}
          >
            {showInactive ? 'Ocultar inativas' : 'Mostrar inativas'}
          </Button>
          {isAdmin && (
            <Button type="button" onClick={openCreateForm}>
              <PlusIcon />
              Nova Peça
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-4 text-xs font-medium tracking-wide text-muted-foreground">
                Nome
              </TableHead>
              <TableHead className="px-4 text-xs font-medium tracking-wide text-muted-foreground">
                SKU
              </TableHead>
              <TableHead className="px-4 text-xs font-medium tracking-wide text-muted-foreground">
                Fornecedor
              </TableHead>
              <TableHead className="px-4 text-xs font-medium tracking-wide text-muted-foreground">
                Custo
              </TableHead>
              <TableHead className="px-4 text-xs font-medium tracking-wide text-muted-foreground">
                Venda
              </TableHead>
              <TableHead className="px-4 text-xs font-medium tracking-wide text-muted-foreground">
                Estoque
              </TableHead>
              {isAdmin && (
                <TableHead className="w-32 px-4 text-right text-xs font-medium tracking-wide text-muted-foreground">
                  Ações
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columnCount} className="px-4 py-16">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <LoaderCircleIcon className="size-4 animate-spin" />
                    Carregando peças
                  </div>
                </TableCell>
              </TableRow>
            ) : loadError ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columnCount} className="px-4 py-16">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-3 text-center">
                    <p className="text-sm text-muted-foreground">{loadError}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void loadParts()}
                    >
                      Tentar de novo
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredParts.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columnCount} className="px-4 py-16">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-3 text-center">
                    <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
                      <PackageIcon className="size-4" strokeWidth={1.75} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium tracking-tight">
                        {parts.length === 0
                          ? 'Nenhuma peça cadastrada'
                          : 'Nenhuma peça encontrada'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {parts.length === 0
                          ? 'Cadastre o primeiro item do catálogo.'
                          : 'Tente outro nome ou SKU.'}
                      </p>
                    </div>
                    {parts.length === 0 && isAdmin ? (
                      <Button type="button" size="sm" onClick={openCreateForm}>
                        <PlusIcon />
                        Nova Peça
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredParts.map((part) => {
                const lowStock = part.active && isLowStock(part)

                return (
                  <TableRow
                    key={part.id}
                    className={part.active ? undefined : 'text-muted-foreground'}
                  >
                    <TableCell className="px-4 font-medium text-foreground">
                      {part.name}
                    </TableCell>
                    <TableCell className="px-4 font-mono text-xs text-muted-foreground">
                      {part.sku || '—'}
                    </TableCell>
                    <TableCell className="px-4 text-muted-foreground">
                      {part.supplier?.name || '—'}
                    </TableCell>
                    <TableCell className="px-4 whitespace-nowrap text-muted-foreground">
                      {formatCurrency(part.cost_price)}
                    </TableCell>
                    <TableCell className="px-4 whitespace-nowrap">
                      {formatCurrency(part.sale_price)}
                    </TableCell>
                    <TableCell className="px-4">
                      <div className="flex items-center gap-2">
                        <span className={lowStock ? 'font-medium text-amber-700 dark:text-amber-300' : undefined}>
                          {part.current_stock} un
                        </span>
                        {lowStock ? (
                          <Badge
                            variant="outline"
                            className="border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                          >
                            Abaixo do mínimo
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="px-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Editar ${part.name}`}
                            onClick={() => openEditForm(part)}
                          >
                            <PencilIcon />
                          </Button>
                          {part.active ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Movimentar ${part.name}`}
                              onClick={() => openMovement(part)}
                            >
                              <ArrowRightLeftIcon />
                            </Button>
                          ) : null}
                          {part.active ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="text-muted-foreground hover:text-destructive"
                              aria-label={`Inativar ${part.name}`}
                              onClick={() => setPartToDeactivate(part)}
                            >
                              <Trash2Icon />
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Reativar ${part.name}`}
                              disabled={reactivatingId === part.id}
                              onClick={() => void handleReactivate(part)}
                            >
                              {reactivatingId === part.id ? (
                                <LoaderCircleIcon className="animate-spin" />
                              ) : (
                                <UserCheckIcon />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <PartForm
        key={`${editingPart?.id ?? 'new'}-${formSession}`}
        open={isFormOpen}
        part={editingPart}
        isSubmitting={isSaving}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSubmit}
      />

      <MovementForm
        key={`${movementPart?.id ?? 'movement'}-${movementSession}`}
        open={movementPart !== null}
        part={movementPart}
        isSubmitting={isMoving}
        onOpenChange={(open) => {
          if (!open) setMovementPart(null)
        }}
        onSubmit={handleMovement}
      />

      <AlertDialog
        open={partToDeactivate !== null}
        onOpenChange={(open) => {
          if (!open && !isDeactivating) setPartToDeactivate(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Inativar peça</AlertDialogTitle>
            <AlertDialogDescription>
              {partToDeactivate
                ? `${partToDeactivate.name} deixa de aparecer no catálogo ativo.`
                : 'Essa peça deixa de aparecer no catálogo.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeactivating}>Cancelar</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeactivating}
              onClick={() => void handleDeactivate()}
            >
              {isDeactivating ? (
                <>
                  <LoaderCircleIcon className="animate-spin" />
                  Inativando
                </>
              ) : (
                'Inativar'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
