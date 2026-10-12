import {
  ArrowLeftIcon,
  CheckSquareIcon,
  CircleCheckIcon,
  ClipboardListIcon,
  LoaderCircleIcon,
  MessageCircleIcon,
  PrinterIcon,
  QrCodeIcon,
  RotateCcwIcon,
  WrenchIcon,
  XIcon,
} from 'lucide-react'
import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { listParts, type Part } from '@/services/partService'
import {
  addOrderPart,
  cancelOrder,
  getApiErrorMessage,
  getOrderById,
  removeOrderImage,
  reopenOrder,
  serviceOrderService,
  updateChecklist,
  updateOrder,
  uploadOrderImage,
  type ServiceOrder,
  type ServiceOrderImage,
  type ServiceOrderImageTag,
} from '@/services/serviceOrderService'

import { CancelOrderDialog } from '../CancelOrderDialog'
import { FinishOrderDialog } from '../FinishOrderDialog'
import { OrderStatusBadge, OrderTypeIcon } from '../OrderMeta'
import { formatOrderNumber, typeLabel } from '../presentation'
import { ReopenOrderDialog } from '../ReopenOrderDialog'
import { SendWhatsAppDialog } from '../SendWhatsAppDialog'
import { ChecklistTab, type ChecklistDraftAnswer } from './ChecklistTab'
import { OverviewTab } from './OverviewTab'
import { PartsTab } from './PartsTab'
import type { FinishOrderPayload } from '../schema'

function applyChecklist(order: ServiceOrder) {
  const isCompleted = Boolean(order.checklist?.completed_at)

  return {
    notes: order.checklist?.notes ?? '',
    answers: (order.checklist?.answers ?? []).map((answer) => ({
      ...answer,
      is_evaluated: isCompleted,
    })),
  }
}

export function ServiceOrderDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [order, setOrder] = useState<ServiceOrder | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [checklistNotes, setChecklistNotes] = useState('')
  const [checklistAnswers, setChecklistAnswers] = useState<ChecklistDraftAnswer[]>(
    [],
  )
  const [isSavingChecklist, setIsSavingChecklist] = useState(false)
  const [isCancelOpen, setIsCancelOpen] = useState(false)
  const [cancelSession, setCancelSession] = useState(0)
  const [isFinishOpen, setIsFinishOpen] = useState(false)
  const [finishSession, setFinishSession] = useState(0)
  const [isReopenOpen, setIsReopenOpen] = useState(false)
  const [reopenSession, setReopenSession] = useState(0)
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false)
  const [whatsAppSession, setWhatsAppSession] = useState(0)
  const [availableParts, setAvailableParts] = useState<Part[]>([])
  const [isLoadingParts, setIsLoadingParts] = useState(false)
  const [selectedPartId, setSelectedPartId] = useState('')
  const [selectedQuantity, setSelectedQuantity] = useState(1)
  const [isAddingPart, setIsAddingPart] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [isGeneratingLabel, setIsGeneratingLabel] = useState(false)
  const [uploadingTag, setUploadingTag] = useState<ServiceOrderImageTag | null>(null)
  const [imageToRemove, setImageToRemove] = useState<ServiceOrderImage | null>(null)
  const [isRemovingImage, setIsRemovingImage] = useState(false)
  const partsRequested = useRef(false)

  function storeOrder(data: ServiceOrder) {
    const checklist = applyChecklist(data)
    setOrder(data)
    setChecklistNotes(checklist.notes)
    setChecklistAnswers(checklist.answers)
  }

  async function loadOrderDetails(options?: { silent?: boolean }) {
    if (!id) return

    if (!options?.silent) {
      setIsLoading(true)
      setError('')
    }

    try {
      const data = await getOrderById(id)
      storeOrder(data)
      setError('')
    } catch (loadError) {
      const message = getApiErrorMessage(
        loadError,
        'Não foi possível carregar as informações.',
      )

      if (!options?.silent) {
        setOrder(null)
        setError(message)
      }

      toast.error(message)
    } finally {
      if (!options?.silent) setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!id) return

    let ignore = false

    getOrderById(id)
      .then((data) => {
        if (ignore) return
        const checklist = applyChecklist(data)
        setOrder(data)
        setChecklistNotes(checklist.notes)
        setChecklistAnswers(checklist.answers)
      })
      .catch((loadError: unknown) => {
        if (ignore) return

        const message = getApiErrorMessage(
          loadError,
          'Não foi possível carregar as informações.',
        )
        setError(message)
        toast.error(message)
      })
      .finally(() => {
        if (!ignore) setIsLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [id])

  async function loadParts() {
    partsRequested.current = true
    setIsLoadingParts(true)

    try {
      const data = await listParts()
      setAvailableParts(data.filter((part) => part.active))
    } catch (loadError) {
      partsRequested.current = false
      toast.error(
        getApiErrorMessage(loadError, 'Não foi possível carregar as peças.'),
      )
    } finally {
      setIsLoadingParts(false)
    }
  }

  function handleTabChange(value: string) {
    if (value === 'pecas' && !partsRequested.current) {
      void loadParts()
    }
  }

  async function handleExportPdf() {
    if (!id) return

    setIsExportingPdf(true)

    try {
      const pdfUrl = await serviceOrderService.exportPdf(id)
      window.open(pdfUrl, '_blank')
    } catch (exportError) {
      toast.error(
        getApiErrorMessage(exportError, 'Erro ao gerar o PDF da ordem de serviço.'),
      )
    } finally {
      setIsExportingPdf(false)
    }
  }

  async function handleGenerateLabel() {
    if (!id) return

    setIsGeneratingLabel(true)

    try {
      const response = await serviceOrderService.generateLabel(id)
      window.open(response.labelUrl, '_blank')
    } catch (labelError) {
      toast.error(getApiErrorMessage(labelError, 'Erro ao gerar a etiqueta.'))
    } finally {
      setIsGeneratingLabel(false)
    }
  }

  async function handleSendWhatsApp(customPhone: string) {
    if (!order || !id) return

    const cleanPhone = customPhone.replace(/\D/g, '')

    setIsExportingPdf(true)

    try {
      const pdfUrl = await serviceOrderService.exportPdf(id)
      const message = `Olá, ${order.customer?.name}!\n\nAqui é da *DWL Diagnóstica*.\nA Ordem de Serviço *#${String(order.number).padStart(4, '0')}* referente ao equipamento *${order.equipment?.model?.name || 'N/A'}* encontra-se com o status: *${order.status}*.\n\nVocê pode baixar o relatório técnico completo acessando o link abaixo:\n🔗 ${pdfUrl}\n\nQualquer dúvida, estamos à disposição!`
      const encodedMessage = encodeURIComponent(message)
      window.open(
        'https://wa.me/55' + cleanPhone + '?text=' + encodedMessage,
        '_blank',
      )
      setIsWhatsAppOpen(false)
    } catch (whatsappError) {
      toast.error(
        getApiErrorMessage(
          whatsappError,
          'Erro ao preparar o documento para o WhatsApp.',
        ),
      )
    } finally {
      setIsExportingPdf(false)
    }
  }

  async function handleCancelOrder(reason: string) {
    if (!id) return

    try {
      await cancelOrder(id, reason)
      toast.success('Ordem de serviço cancelada.')
      setIsCancelOpen(false)
      await loadOrderDetails({ silent: true })
    } catch (cancelError) {
      toast.error(getApiErrorMessage(cancelError, 'Erro ao cancelar a O.S.'))
    }
  }

  function openFinishDialog() {
    if (order?.checklist && !order.checklist.completed_at) {
      toast.error(
        'Não é possível finalizar a ordem de serviço pois o checklist obrigatório ainda não foi preenchido.',
      )
      return
    }

    setFinishSession((session) => session + 1)
    setIsFinishOpen(true)
  }

  async function handleFinishOrder(payload: FinishOrderPayload) {
    if (!id) return

    try {
      await updateOrder(id, {
        status: 'FINALIZADA',
        solution_description: payload.solution_description,
        technical_notes: payload.technical_notes,
        client_signature: payload.client_signature,
        signer_name: payload.signer_name,
        labor_cost: payload.labor_cost,
        travel_cost: payload.travel_cost,
        accommodation_cost: payload.accommodation_cost,
      })
      toast.success('Ordem de serviço finalizada.')
      setIsFinishOpen(false)
      await loadOrderDetails({ silent: true })
    } catch (finishError) {
      toast.error(getApiErrorMessage(finishError, 'Erro ao finalizar a O.S.'))
    }
  }

  async function handleReopenOrder(reason: string) {
    if (!id) return

    try {
      await reopenOrder(id, reason)
      toast.success('Ordem de serviço reaberta.')
      setIsReopenOpen(false)
      await loadOrderDetails({ silent: true })
    } catch (reopenError) {
      toast.error(getApiErrorMessage(reopenError, 'Erro ao reabrir a O.S.'))
    }
  }

  async function handleSaveChecklist() {
    if (!id || !order?.checklist) return

    const allEvaluated = checklistAnswers.every((answer) => answer.is_evaluated)

    if (!allEvaluated) {
      toast.error(
        'Você precisa responder com OK ou Com Problema para todas as perguntas antes de salvar.',
      )
      return
    }

    setIsSavingChecklist(true)

    try {
      await updateChecklist(id, {
        notes: checklistNotes,
        answers: checklistAnswers.map((answer) => ({
          id: answer.id,
          is_ok: answer.is_ok === true,
          comment: answer.comment || undefined,
        })),
      })
      toast.success('Checklist salvo com sucesso!')
      await loadOrderDetails({ silent: true })
    } catch (saveError) {
      toast.error(
        getApiErrorMessage(
          saveError,
          'Erro ao salvar as respostas do checklist no servidor.',
        ),
      )
    } finally {
      setIsSavingChecklist(false)
    }
  }

  function updateAnswer(
    answerId: string,
    field: 'is_ok' | 'comment',
    value: boolean | string,
  ) {
    setChecklistAnswers((current) =>
      current.map((answer) => {
        if (answer.id !== answerId) return answer

        if (field === 'is_ok') {
          return {
            ...answer,
            is_ok: value === true,
            is_evaluated: true,
          }
        }

        return {
          ...answer,
          comment: String(value),
        }
      }),
    )
  }

  async function handleAddPart() {
    if (
      !id ||
      !selectedPartId ||
      !Number.isInteger(selectedQuantity) ||
      selectedQuantity < 1
    ) {
      return
    }

    setIsAddingPart(true)

    try {
      await addOrderPart(id, selectedPartId, selectedQuantity)
      toast.success('Peça adicionada e estoque atualizado.')
      setSelectedPartId('')
      setSelectedQuantity(1)
      await Promise.all([loadOrderDetails({ silent: true }), loadParts()])
    } catch (partError) {
      toast.error(getApiErrorMessage(partError, 'Erro ao adicionar peça.'))
    } finally {
      setIsAddingPart(false)
    }
  }

  async function handleImageUpload(
    event: ChangeEvent<HTMLInputElement>,
    tag: ServiceOrderImageTag,
  ) {
    const file = event.target.files?.[0]
    if (!file || !order) return

    setUploadingTag(tag)

    try {
      await uploadOrderImage(order.id, tag, file)
      toast.success('Foto adicionada.')
      await loadOrderDetails({ silent: true })
    } catch (uploadError) {
      toast.error(getApiErrorMessage(uploadError, 'Erro ao salvar imagem.'))
    } finally {
      setUploadingTag(null)
      event.target.value = ''
    }
  }

  async function handleRemoveImage() {
    if (!imageToRemove) return

    setIsRemovingImage(true)

    try {
      await removeOrderImage(imageToRemove.id)
      toast.success('Evidência apagada.')
      setImageToRemove(null)
      await loadOrderDetails({ silent: true })
    } catch (removeError) {
      toast.error(getApiErrorMessage(removeError, 'Erro ao apagar imagem.'))
    } finally {
      setIsRemovingImage(false)
    }
  }

  if (!id) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p className="text-sm text-muted-foreground">
          Ordem de serviço não encontrada.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/ordens-de-servico')}
        >
          Voltar para a lista
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-md" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p className="text-sm text-muted-foreground">
          {error || 'Ordem de serviço não encontrada.'}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/ordens-de-servico')}
          >
            Voltar para a lista
          </Button>
          {id ? (
            <Button type="button" onClick={() => void loadOrderDetails()}>
              Tentar de novo
            </Button>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Voltar para a lista"
            onClick={() => navigate('/ordens-de-servico')}
          >
            <ArrowLeftIcon />
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                O.S. {formatOrderNumber(order.number)}
              </h1>
              <OrderStatusBadge status={order.status} />
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <OrderTypeIcon type={order.type} />
                {typeLabel(order.type)}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {order.customer?.name || 'Estoque interno'} · S/N:{' '}
              {order.equipment?.serial_number || '—'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isExportingPdf}
            className="border-emerald-600/30 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300"
            onClick={() => {
              setWhatsAppSession((session) => session + 1)
              setIsWhatsAppOpen(true)
            }}
          >
            <MessageCircleIcon />
            WhatsApp
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isExportingPdf}
            onClick={() => void handleExportPdf()}
          >
            {isExportingPdf ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              <PrinterIcon />
            )}
            {isExportingPdf ? 'Gerando...' : 'Gerar PDF'}
          </Button>
          {order.status === 'FINALIZADA' && order.type === 'PREVENTIVA' ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isGeneratingLabel}
              onClick={() => void handleGenerateLabel()}
            >
              {isGeneratingLabel ? (
                <LoaderCircleIcon className="animate-spin" />
              ) : (
                <QrCodeIcon />
              )}
              Imprimir Etiqueta
            </Button>
          ) : null}
          {order.status === 'ABERTA' ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setCancelSession((session) => session + 1)
                  setIsCancelOpen(true)
                }}
              >
                <XIcon />
                Cancelar
              </Button>
              <Button type="button" size="sm" onClick={openFinishDialog}>
                <CircleCheckIcon />
                Finalizar O.S.
              </Button>
            </>
          ) : null}
          {order.status === 'FINALIZADA' || order.status === 'CANCELADA' ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setReopenSession((session) => session + 1)
                setIsReopenOpen(true)
              }}
            >
              <RotateCcwIcon />
              Reabrir O.S.
            </Button>
          ) : null}
        </div>
      </header>

      <Tabs defaultValue="visao-geral" onValueChange={handleTabChange}>
        <TabsList variant="line" className="h-10 w-full justify-start overflow-x-auto">
          <TabsTrigger value="visao-geral">
            <ClipboardListIcon />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="checklist">
            <CheckSquareIcon />
            Checklist
          </TabsTrigger>
          <TabsTrigger value="pecas">
            <WrenchIcon />
            Peças Utilizadas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="mt-4">
          <OverviewTab
            order={order}
            uploadingTag={uploadingTag}
            onUpload={(event, tag) => void handleImageUpload(event, tag)}
            onRemoveImage={setImageToRemove}
          />
        </TabsContent>
        <TabsContent value="checklist" className="mt-4">
          <ChecklistTab
            order={order}
            answers={checklistAnswers}
            notes={checklistNotes}
            isSaving={isSavingChecklist}
            onNotesChange={setChecklistNotes}
            onUpdateAnswer={updateAnswer}
            onSave={() => void handleSaveChecklist()}
          />
        </TabsContent>
        <TabsContent value="pecas" className="mt-4">
          <PartsTab
            order={order}
            parts={availableParts}
            isLoadingParts={isLoadingParts}
            selectedPartId={selectedPartId}
            quantity={selectedQuantity}
            isAdding={isAddingPart}
            onSelectedPartId={setSelectedPartId}
            onQuantity={setSelectedQuantity}
            onAdd={() => void handleAddPart()}
          />
        </TabsContent>
      </Tabs>

      <SendWhatsAppDialog
        key={whatsAppSession}
        open={isWhatsAppOpen}
        defaultPhone={order.customer?.phone}
        onOpenChange={setIsWhatsAppOpen}
        onConfirm={handleSendWhatsApp}
      />
      <CancelOrderDialog
        key={cancelSession}
        open={isCancelOpen}
        onOpenChange={setIsCancelOpen}
        onConfirm={handleCancelOrder}
      />
      <FinishOrderDialog
        key={finishSession}
        open={isFinishOpen}
        onOpenChange={setIsFinishOpen}
        onConfirm={handleFinishOrder}
      />
      <ReopenOrderDialog
        key={reopenSession}
        open={isReopenOpen}
        onOpenChange={setIsReopenOpen}
        onConfirm={handleReopenOrder}
      />

      <AlertDialog
        open={imageToRemove !== null}
        onOpenChange={(open) => {
          if (!open && !isRemovingImage) setImageToRemove(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar evidência</AlertDialogTitle>
            <AlertDialogDescription>
              Esta foto deixa de fazer parte da ordem de serviço.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemovingImage}>Voltar</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={isRemovingImage}
              onClick={() => void handleRemoveImage()}
            >
              {isRemovingImage ? (
                <>
                  <LoaderCircleIcon className="animate-spin" />
                  Apagando
                </>
              ) : (
                'Apagar foto'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
