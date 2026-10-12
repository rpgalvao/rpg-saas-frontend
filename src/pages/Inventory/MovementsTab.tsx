import { HistoryIcon, LoaderCircleIcon, PlusIcon, SearchIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

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
import {
  createStockMovement,
  listStockMovements,
  type StockMovement,
} from '@/services/stockMovementService'
import { getApiErrorMessage } from '@/services/supplierService'

import { MovementForm } from './MovementForm'
import { toMovementPayload, type MovementFormValues } from './schema'

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function MovementsTab() {
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formSession, setFormSession] = useState(0)
  const [isSaving, setIsSaving] = useState(false)

  async function loadMovements() {
    setIsLoading(true)
    setLoadError(null)

    try {
      const data = await listStockMovements()
      setMovements(data)
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        'Não foi possível carregar as movimentações.',
      )
      setMovements([])
      setLoadError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let ignore = false

    listStockMovements()
      .then((data) => {
        if (!ignore) setMovements(data)
      })
      .catch((error: unknown) => {
        if (ignore) return

        const message = getApiErrorMessage(
          error,
          'Não foi possível carregar as movimentações.',
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

  function openMovementForm() {
    setFormSession((session) => session + 1)
    setIsFormOpen(true)
  }

  async function handleMovement(values: MovementFormValues) {
    setIsSaving(true)

    try {
      await createStockMovement(toMovementPayload(values))
      toast.success('Movimentação registrada.')
      setIsFormOpen(false)
      await loadMovements()
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Não foi possível registrar a movimentação.'),
      )
    } finally {
      setIsSaving(false)
    }
  }

  const filteredMovements = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR')

    if (!query) return movements

    return movements.filter((movement) => {
      const haystack = [
        movement.part?.name,
        movement.part?.sku,
        movement.reason,
        movement.user?.name,
      ]
        .filter((value): value is string => Boolean(value))
        .join(' ')
        .toLocaleLowerCase('pt-BR')

      return haystack.includes(query)
    })
  }, [movements, search])

  const countLabel =
    movements.length === 1
      ? '1 movimentação'
      : `${movements.length} movimentações`

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {isLoading ? 'Carregando o histórico...' : countLabel}
        </p>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative sm:w-80">
            <SearchIcon
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              strokeWidth={1.75}
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              type="search"
              placeholder="Buscar por peça, motivo ou usuário"
              aria-label="Buscar movimentações"
              className="pl-9"
            />
          </div>
          <Button type="button" onClick={openMovementForm}>
            <PlusIcon />
            Nova Movimentação
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-4 text-xs font-medium tracking-wide text-muted-foreground">
                Data
              </TableHead>
              <TableHead className="px-4 text-xs font-medium tracking-wide text-muted-foreground">
                Peça
              </TableHead>
              <TableHead className="px-4 text-xs font-medium tracking-wide text-muted-foreground">
                Tipo
              </TableHead>
              <TableHead className="px-4 text-xs font-medium tracking-wide text-muted-foreground">
                Quantidade
              </TableHead>
              <TableHead className="px-4 text-xs font-medium tracking-wide text-muted-foreground">
                Motivo
              </TableHead>
              <TableHead className="px-4 text-xs font-medium tracking-wide text-muted-foreground">
                Usuário
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="px-4 py-16">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <LoaderCircleIcon className="size-4 animate-spin" />
                    Carregando movimentações
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
                      onClick={() => void loadMovements()}
                    >
                      Tentar de novo
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredMovements.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="px-4 py-16">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-3 text-center">
                    <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
                      <HistoryIcon className="size-4" strokeWidth={1.75} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium tracking-tight">
                        {movements.length === 0
                          ? 'Nenhuma movimentação registrada'
                          : 'Nenhuma movimentação encontrada'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {movements.length === 0
                          ? 'As entradas e saídas aparecem aqui.'
                          : 'Tente outra peça, motivo ou usuário.'}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredMovements.map((movement) => {
                const isEntry = movement.type === 'IN'

                return (
                  <TableRow key={movement.id}>
                    <TableCell className="px-4 whitespace-nowrap text-muted-foreground">
                      {formatDateTime(movement.created_at)}
                    </TableCell>
                    <TableCell className="px-4">
                      <div className="font-medium">
                        {movement.part?.name || 'Peça removida'}
                      </div>
                      {movement.part?.sku ? (
                        <div className="font-mono text-xs text-muted-foreground">
                          {movement.part.sku}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="px-4">
                      <Badge
                        variant="outline"
                        className={
                          isEntry
                            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                            : 'border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400'
                        }
                      >
                        {isEntry ? 'Entrada' : 'Saída'}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 font-medium tabular-nums">
                      {isEntry ? '+' : '−'}
                      {movement.quantity}
                    </TableCell>
                    <TableCell className="px-4 text-muted-foreground">
                      {movement.reason}
                    </TableCell>
                    <TableCell className="px-4 text-muted-foreground">
                      {movement.user?.name || '—'}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <MovementForm
        key={`movement-${formSession}`}
        open={isFormOpen}
        part={null}
        isSubmitting={isSaving}
        onOpenChange={setIsFormOpen}
        onSubmit={handleMovement}
      />
    </div>
  )
}
