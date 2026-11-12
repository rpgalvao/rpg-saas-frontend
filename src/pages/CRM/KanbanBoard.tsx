import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from '@hello-pangea/dnd'
import {
  BriefcaseIcon,
  GripVerticalIcon,
  LoaderCircleIcon,
  PlusIcon,
  UserIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import {
  createDeal,
  getApiErrorMessage,
  getPipeline,
  moveDeal,
  type Deal,
  type DealStage,
} from '@/services/crmService'

import { DealDetailsSheet } from './DealDetailsSheet'
import { DealForm } from './DealForm'
import { toCreateDealPayload, type DealFormValues } from './schema'

function moveDealInStages(
  stages: DealStage[],
  dealId: string,
  sourceStageId: string,
  destinationStageId: string,
  destinationIndex: number,
): DealStage[] {
  const sourceStage = stages.find((stage) => stage.id === sourceStageId)
  const destinationStage = stages.find(
    (stage) => stage.id === destinationStageId,
  )

  if (!sourceStage || !destinationStage) return stages

  const dealIndex = sourceStage.deals.findIndex((deal) => deal.id === dealId)
  if (dealIndex < 0) return stages

  const deal = sourceStage.deals[dealIndex]
  if (!deal) return stages

  const nextStages = stages.map((stage) => ({
    ...stage,
    deals: [...stage.deals],
  }))

  const nextSource = nextStages.find((stage) => stage.id === sourceStageId)
  const nextDestination = nextStages.find(
    (stage) => stage.id === destinationStageId,
  )

  if (!nextSource || !nextDestination) return stages

  nextSource.deals.splice(dealIndex, 1)

  const movedDeal: Deal = {
    ...deal,
    stageId: destinationStageId,
  }

  const insertAt = Math.min(destinationIndex, nextDestination.deals.length)
  nextDestination.deals.splice(insertAt, 0, movedDeal)

  return nextStages
}

function DealCard({
  deal,
  index,
  onSelect,
}: {
  deal: Deal
  index: number
  onSelect: (deal: Deal) => void
}) {
  return (
    <Draggable draggableId={deal.id} index={index}>
      {(provided, snapshot) => (
        <article
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={cn(
            'group rounded-lg border border-border bg-card p-3 shadow-xs transition-shadow',
            snapshot.isDragging && 'shadow-md ring-1 ring-ring/30',
            !snapshot.isDragging && 'cursor-pointer hover:border-foreground/20',
          )}
          onClick={() => {
            if (snapshot.isDragging) return
            onSelect(deal)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              onSelect(deal)
            }
          }}
          role="button"
          tabIndex={0}
        >
          <div className="flex items-start gap-2">
            <div
              {...provided.dragHandleProps}
              className="mt-0.5 shrink-0 cursor-grab touch-none text-muted-foreground/60 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
              aria-label="Arrastar negócio"
              onClick={(event) => event.stopPropagation()}
            >
              <GripVerticalIcon className="size-3.5" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <h3 className="text-sm leading-snug font-medium tracking-tight">
                {deal.title}
              </h3>
              <p className="text-sm font-semibold tabular-nums text-foreground">
                {formatCurrency(deal.estimatedValue)}
              </p>
              {deal.customer?.name ? (
                <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                  <UserIcon className="size-3 shrink-0" strokeWidth={1.75} />
                  <span className="truncate">{deal.customer.name}</span>
                </p>
              ) : null}
            </div>
          </div>
        </article>
      )}
    </Draggable>
  )
}

function StageColumn({
  stage,
  onSelectDeal,
}: {
  stage: DealStage
  onSelectDeal: (deal: Deal) => void
}) {
  const totalValue = stage.deals.reduce(
    (sum, deal) => sum + Number(deal.estimatedValue || 0),
    0,
  )

  return (
    <section className="flex w-72 shrink-0 flex-col rounded-xl border border-border bg-muted/30">
      <header className="flex items-start justify-between gap-2 border-b border-border px-3 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold tracking-tight">
            {stage.name}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
            {stage.deals.length}{' '}
            {stage.deals.length === 1 ? 'negócio' : 'negócios'} ·{' '}
            {formatCurrency(totalValue)}
          </p>
        </div>
      </header>

      <Droppable droppableId={stage.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'flex min-h-40 flex-1 flex-col gap-2 overflow-y-auto p-2 transition-colors',
              snapshot.isDraggingOver && 'bg-accent/40',
            )}
          >
            {stage.deals.map((deal, index) => (
              <DealCard
                key={deal.id}
                deal={deal}
                index={index}
                onSelect={onSelectDeal}
              />
            ))}
            {provided.placeholder}
            {stage.deals.length === 0 && !snapshot.isDraggingOver ? (
              <p className="px-2 py-8 text-center text-xs text-muted-foreground">
                Arraste negócios para cá
              </p>
            ) : null}
          </div>
        )}
      </Droppable>
    </section>
  )
}

export function KanbanBoard() {
  const [stages, setStages] = useState<DealStage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)

  async function loadPipeline(options?: { silent?: boolean }) {
    if (!options?.silent) {
      setIsLoading(true)
      setLoadError(null)
    }

    try {
      const data = await getPipeline()
      setStages(data)
      setLoadError(null)
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        'Não foi possível carregar o pipeline.',
      )

      if (!options?.silent) {
        setStages([])
        setLoadError(message)
      }

      toast.error(message)
    } finally {
      if (!options?.silent) setIsLoading(false)
    }
  }

  useEffect(() => {
    let ignore = false

    getPipeline()
      .then((data) => {
        if (!ignore) setStages(data)
      })
      .catch((error: unknown) => {
        if (ignore) return

        const message = getApiErrorMessage(
          error,
          'Não foi possível carregar o pipeline.',
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

  async function handleDragEnd(result: DropResult) {
    const { destination, source, draggableId } = result

    if (!destination) return

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    const previousStages = stages
    const nextStages = moveDealInStages(
      stages,
      draggableId,
      source.droppableId,
      destination.droppableId,
      destination.index,
    )

    setStages(nextStages)

    if (destination.droppableId === source.droppableId) {
      return
    }

    try {
      await moveDeal(draggableId, destination.droppableId)
    } catch (error) {
      setStages(previousStages)
      toast.error(
        getApiErrorMessage(error, 'Não foi possível mover o negócio.'),
      )
    }
  }

  function handleCloseDealDetails() {
    setSelectedDeal(null)
    void loadPipeline({ silent: true })
  }

  async function handleCreateDeal(values: DealFormValues) {
    const firstStage = stages[0]

    if (!firstStage) {
      toast.error('Nenhum estágio disponível no pipeline.')
      return
    }

    setIsSaving(true)

    try {
      await createDeal(toCreateDealPayload(values, firstStage.id))
      toast.success('Negócio criado.')
      setIsFormOpen(false)
      await loadPipeline({ silent: true })
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Não foi possível criar o negócio.'),
      )
    } finally {
      setIsSaving(false)
    }
  }

  const openDealsCount = stages.reduce(
    (sum, stage) => sum + stage.deals.length,
    0,
  )

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            CRM / Negócios
          </h1>
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? 'Carregando o pipeline...'
              : `${openDealsCount} ${openDealsCount === 1 ? 'negócio aberto' : 'negócios abertos'}`}
          </p>
        </div>

        <Button type="button" onClick={() => setIsFormOpen(true)}>
          <PlusIcon />
          Novo Negócio
        </Button>
      </header>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card py-24 text-sm text-muted-foreground">
          <LoaderCircleIcon className="size-4 animate-spin" />
          Carregando pipeline
        </div>
      ) : loadError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card py-24 text-center">
          <BriefcaseIcon
            className="size-8 text-muted-foreground/50"
            strokeWidth={1.5}
          />
          <p className="max-w-sm text-sm text-muted-foreground">{loadError}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadPipeline()}
          >
            Tentar de novo
          </Button>
        </div>
      ) : (
        <DragDropContext onDragEnd={(result) => void handleDragEnd(result)}>
          <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto pb-2">
            {stages.map((stage) => (
              <StageColumn
                key={stage.id}
                stage={stage}
                onSelectDeal={setSelectedDeal}
              />
            ))}
          </div>
        </DragDropContext>
      )}

      <DealForm
        open={isFormOpen}
        isSubmitting={isSaving}
        onOpenChange={setIsFormOpen}
        onSubmit={handleCreateDeal}
      />

      {selectedDeal ? (
        <DealDetailsSheet
          key={selectedDeal.id}
          deal={selectedDeal}
          onClose={handleCloseDealDetails}
        />
      ) : null}
    </section>
  )
}
