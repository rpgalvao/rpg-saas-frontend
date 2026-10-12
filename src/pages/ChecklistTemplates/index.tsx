import {
  ListChecksIcon,
  LoaderCircleIcon,
  PencilIcon,
  PlusIcon,
  PowerIcon,
  PowerOffIcon,
  SearchIcon,
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
import {
  createChecklistTemplate,
  getApiErrorMessage,
  listChecklistTemplates,
  toggleChecklistTemplateStatus,
  updateChecklistTemplate,
  type ChecklistTemplate,
} from '@/services/checklistTemplateService'

import { QuestionsManager } from './QuestionsManager'
import { toTemplatePayload, type TemplateFormValues } from './schema'
import { TemplateForm } from './TemplateForm'

type StatusAction = {
  template: ChecklistTemplate
  type: 'deactivate' | 'reactivate'
}

export function ChecklistTemplatesPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([])
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formSession, setFormSession] = useState(0)
  const [editingTemplate, setEditingTemplate] = useState<ChecklistTemplate | null>(
    null,
  )
  const [isSaving, setIsSaving] = useState(false)
  const [statusAction, setStatusAction] = useState<StatusAction | null>(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [managingTemplateId, setManagingTemplateId] = useState<string | null>(null)
  const [sheetTemplate, setSheetTemplate] = useState<ChecklistTemplate | null>(null)

  async function loadTemplates(options?: { silent?: boolean }) {
    if (!isAdmin) {
      setTemplates([])
      setLoadError('Acesso restrito a administradores.')
      setIsLoading(false)
      return
    }

    if (!options?.silent) {
      setIsLoading(true)
      setLoadError(null)
    }

    try {
      const data = await listChecklistTemplates(showInactive)
      setTemplates(data)
      setLoadError(null)
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        'Não foi possível carregar os templates.',
      )

      if (!options?.silent) {
        setTemplates([])
        setLoadError(message)
      }

      toast.error(message)
    } finally {
      if (!options?.silent) setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!isAdmin) {
      setIsLoading(false)
      setLoadError('Acesso restrito a administradores.')
      return
    }

    let ignore = false

    listChecklistTemplates(showInactive)
      .then((data) => {
        if (!ignore) setTemplates(data)
      })
      .catch((error: unknown) => {
        if (ignore) return

        const message = getApiErrorMessage(
          error,
          'Não foi possível carregar os templates.',
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
  }, [isAdmin, showInactive])

  const filteredTemplates = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR')

    if (!query) return templates

    return templates.filter((template) => {
      const haystack = [template.name, template.model?.name]
        .filter((value): value is string => Boolean(value))
        .join(' ')
        .toLocaleLowerCase('pt-BR')

      return haystack.includes(query)
    })
  }, [search, templates])

  const managingTemplate =
    templates.find((template) => template.id === managingTemplateId) ?? null

  useEffect(() => {
    if (managingTemplate) setSheetTemplate(managingTemplate)
  }, [managingTemplate])

  function openCreateForm() {
    setEditingTemplate(null)
    setFormSession((session) => session + 1)
    setIsFormOpen(true)
  }

  function openEditForm(template: ChecklistTemplate) {
    setEditingTemplate(template)
    setFormSession((session) => session + 1)
    setIsFormOpen(true)
  }

  async function handleSubmit(values: TemplateFormValues) {
    setIsSaving(true)

    try {
      if (editingTemplate) {
        await updateChecklistTemplate(editingTemplate.id, toTemplatePayload(values))
        toast.success('Template atualizado.')
      } else {
        await createChecklistTemplate(toTemplatePayload(values))
        toast.success('Template criado.')
      }

      setIsFormOpen(false)
      await loadTemplates({ silent: true })
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Não foi possível salvar o template.'),
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleStatusChange() {
    if (!statusAction) return

    setIsUpdatingStatus(true)

    try {
      await toggleChecklistTemplateStatus(statusAction.template.id)
      toast.success(
        statusAction.type === 'reactivate'
          ? 'Template reativado.'
          : 'Template desativado.',
      )
      setStatusAction(null)
      await loadTemplates({ silent: true })
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Não foi possível alterar o status do template.'),
      )
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Templates de Checklist
          </h1>
          <p className="text-sm text-muted-foreground">
            Gabaritos de manutenção vinculados aos modelos de equipamento.
          </p>
        </div>

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
              placeholder="Buscar por nome ou modelo"
              aria-label="Buscar templates"
              className="pl-9"
            />
          </div>
          {isAdmin ? (
            <Button
              type="button"
              variant={showInactive ? 'secondary' : 'outline'}
              onClick={() => {
                setIsLoading(true)
                setShowInactive((current) => !current)
              }}
            >
              {showInactive ? 'Ocultar inativos' : 'Mostrar inativos'}
            </Button>
          ) : null}
          {isAdmin ? (
            <Button type="button" onClick={openCreateForm}>
              <PlusIcon />
              Novo template
            </Button>
          ) : null}
        </div>
      </header>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-4 text-xs font-medium tracking-wide text-muted-foreground">
                Nome
              </TableHead>
              <TableHead className="px-4 text-xs font-medium tracking-wide text-muted-foreground">
                Modelo
              </TableHead>
              <TableHead className="w-28 px-4 text-xs font-medium tracking-wide text-muted-foreground">
                Perguntas
              </TableHead>
              <TableHead className="w-28 px-4 text-xs font-medium tracking-wide text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="w-36 px-4 text-right text-xs font-medium tracking-wide text-muted-foreground">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="px-4 py-16">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <LoaderCircleIcon className="size-4 animate-spin" />
                    Carregando templates
                  </div>
                </TableCell>
              </TableRow>
            ) : loadError ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="px-4 py-16">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-3 text-center">
                    <p className="text-sm text-muted-foreground">{loadError}</p>
                    {isAdmin ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void loadTemplates()}
                      >
                        Tentar de novo
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredTemplates.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="px-4 py-16">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-3 text-center">
                    <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
                      <ListChecksIcon className="size-4" strokeWidth={1.75} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium tracking-tight">
                        {templates.length === 0
                          ? 'Nenhum template cadastrado'
                          : 'Nenhum template encontrado'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {templates.length === 0
                          ? 'Crie o primeiro gabarito de checklist.'
                          : 'Tente outro nome ou modelo.'}
                      </p>
                    </div>
                    {templates.length === 0 && isAdmin ? (
                      <Button type="button" size="sm" onClick={openCreateForm}>
                        <PlusIcon />
                        Novo template
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredTemplates.map((template) => {
                const questionsCount = template.questions?.length ?? 0

                return (
                  <TableRow
                    key={template.id}
                    className={template.active ? undefined : 'text-muted-foreground'}
                  >
                    <TableCell className="px-4 font-medium text-foreground">
                      {template.name}
                    </TableCell>
                    <TableCell className="px-4 text-muted-foreground">
                      {template.model?.name || '—'}
                    </TableCell>
                    <TableCell className="px-4 tabular-nums text-muted-foreground">
                      {questionsCount}
                    </TableCell>
                    <TableCell className="px-4">
                      <Badge
                        variant="outline"
                        className={
                          template.active
                            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                            : 'border-border bg-muted text-muted-foreground'
                        }
                      >
                        {template.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4">
                      {isAdmin ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Editar ${template.name}`}
                            onClick={() => openEditForm(template)}
                          >
                            <PencilIcon />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Gerenciar perguntas de ${template.name}`}
                            title="Gerenciar Perguntas"
                            onClick={() => setManagingTemplateId(template.id)}
                          >
                            <ListChecksIcon />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className={
                              template.active
                                ? 'text-muted-foreground hover:text-destructive'
                                : 'text-muted-foreground hover:text-foreground'
                            }
                            aria-label={
                              template.active
                                ? `Desativar ${template.name}`
                                : `Reativar ${template.name}`
                            }
                            onClick={() =>
                              setStatusAction({
                                template,
                                type: template.active ? 'deactivate' : 'reactivate',
                              })
                            }
                          >
                            {template.active ? <PowerOffIcon /> : <PowerIcon />}
                          </Button>
                        </div>
                      ) : (
                        <div className="text-right text-sm text-muted-foreground">
                          —
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <TemplateForm
        key={`${editingTemplate?.id ?? 'new'}-${formSession}`}
        open={isFormOpen}
        template={editingTemplate}
        isSubmitting={isSaving}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSubmit}
      />

      <QuestionsManager
        open={managingTemplateId !== null}
        template={managingTemplate ?? sheetTemplate}
        onOpenChange={(open) => {
          if (!open) setManagingTemplateId(null)
        }}
        onChanged={() => loadTemplates({ silent: true })}
      />

      <AlertDialog
        open={statusAction !== null}
        onOpenChange={(open) => {
          if (!open && !isUpdatingStatus) setStatusAction(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {statusAction?.type === 'reactivate'
                ? 'Reativar template'
                : 'Desativar template'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {statusAction?.type === 'reactivate'
                ? `${statusAction.template.name} volta a ficar disponível para novas ordens de serviço.`
                : `${statusAction?.template.name ?? 'Esse template'} deixa de aparecer na lista de templates ativos.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdatingStatus}>
              Cancelar
            </AlertDialogCancel>
            <Button
              type="button"
              variant={
                statusAction?.type === 'reactivate' ? 'default' : 'destructive'
              }
              disabled={isUpdatingStatus}
              onClick={() => void handleStatusChange()}
            >
              {isUpdatingStatus ? (
                <>
                  <LoaderCircleIcon className="animate-spin" />
                  Salvando
                </>
              ) : statusAction?.type === 'reactivate' ? (
                'Reativar'
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
