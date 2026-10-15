import {
  CpuIcon,
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
  createEquipmentModel,
  getApiErrorMessage,
  listEquipmentModels,
  toggleEquipmentModelStatus,
  updateEquipmentModel,
  type EquipmentModel,
} from '@/services/equipmentModelService'

import { ModelForm } from './ModelForm'
import { toModelPayload, type ModelFormValues } from './schema'

type StatusAction = {
  model: EquipmentModel
  type: 'deactivate' | 'reactivate'
}

export function ModelsTab() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const [models, setModels] = useState<EquipmentModel[]>([])
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formSession, setFormSession] = useState(0)
  const [editingModel, setEditingModel] = useState<EquipmentModel | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [statusAction, setStatusAction] = useState<StatusAction | null>(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  async function loadModels(options?: { silent?: boolean }) {
    if (!options?.silent) {
      setIsLoading(true)
      setLoadError(null)
    }

    try {
      const data = await listEquipmentModels(showInactive)
      setModels(data)
      setLoadError(null)
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        'Não foi possível carregar os modelos.',
      )

      if (!options?.silent) {
        setModels([])
        setLoadError(message)
      }

      toast.error(message)
    } finally {
      if (!options?.silent) setIsLoading(false)
    }
  }

  useEffect(() => {
    let ignore = false

    listEquipmentModels(showInactive)
      .then((data) => {
        if (!ignore) setModels(data)
      })
      .catch((error: unknown) => {
        if (ignore) return

        const message = getApiErrorMessage(
          error,
          'Não foi possível carregar os modelos.',
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

  const filteredModels = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR')

    if (!query) return models

    return models.filter((model) => {
      const haystack = [model.name, model.brand ?? '']
        .join(' ')
        .toLocaleLowerCase('pt-BR')

      return haystack.includes(query)
    })
  }, [models, search])

  function openCreateForm() {
    setEditingModel(null)
    setFormSession((session) => session + 1)
    setIsFormOpen(true)
  }

  function openEditForm(model: EquipmentModel) {
    setEditingModel(model)
    setFormSession((session) => session + 1)
    setIsFormOpen(true)
  }

  async function handleSubmit(values: ModelFormValues) {
    setIsSaving(true)

    try {
      if (editingModel) {
        await updateEquipmentModel(editingModel.id, toModelPayload(values))
        toast.success('Modelo atualizado.')
      } else {
        await createEquipmentModel(toModelPayload(values))
        toast.success('Modelo criado.')
      }

      setIsFormOpen(false)
      await loadModels({ silent: true })
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível salvar o modelo.'))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleStatusChange() {
    if (!statusAction) return

    setIsUpdatingStatus(true)

    try {
      await toggleEquipmentModelStatus(statusAction.model.id)
      toast.success(
        statusAction.type === 'reactivate'
          ? 'Modelo reativado.'
          : 'Modelo desativado.',
      )
      setStatusAction(null)
      await loadModels({ silent: true })
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Não foi possível alterar o status do modelo.'),
      )
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const modelCountLabel =
    models.length === 1 ? '1 modelo' : `${models.length} modelos`

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {isLoading ? 'Carregando o catálogo...' : modelCountLabel}
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
              placeholder="Buscar por nome ou marca"
              aria-label="Buscar modelos"
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
              Novo Modelo
            </Button>
          ) : null}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-4 text-xs font-medium tracking-wide text-muted-foreground">
                Modelo
              </TableHead>
              <TableHead className="px-4 text-xs font-medium tracking-wide text-muted-foreground">
                Marca
              </TableHead>
              <TableHead className="w-32 px-4 text-xs font-medium tracking-wide text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="w-28 px-4 text-right text-xs font-medium tracking-wide text-muted-foreground">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="px-4 py-16">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <LoaderCircleIcon className="size-4 animate-spin" />
                    Carregando modelos
                  </div>
                </TableCell>
              </TableRow>
            ) : loadError ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="px-4 py-16">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-3 text-center">
                    <p className="text-sm text-muted-foreground">{loadError}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void loadModels()}
                    >
                      Tentar de novo
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredModels.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="px-4 py-16">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-3 text-center">
                    <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
                      <CpuIcon className="size-4" strokeWidth={1.75} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium tracking-tight">
                        {models.length === 0
                          ? 'Nenhum modelo cadastrado'
                          : 'Nenhum modelo encontrado'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {models.length === 0
                          ? 'Cadastre o primeiro modelo do catálogo.'
                          : 'Tente outro nome.'}
                      </p>
                    </div>
                    {models.length === 0 && isAdmin ? (
                      <Button type="button" size="sm" onClick={openCreateForm}>
                        <PlusIcon />
                        Novo Modelo
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredModels.map((model) => (
                <TableRow
                  key={model.id}
                  className={model.active ? undefined : 'text-muted-foreground'}
                >
                  <TableCell className="px-4 font-medium text-foreground">
                    {model.name}
                  </TableCell>
                  <TableCell className="px-4 text-muted-foreground">
                    {model.brand?.trim() || '—'}
                  </TableCell>
                  <TableCell className="px-4">
                    <Badge
                      variant="outline"
                      className={
                        model.active
                          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                          : 'border-border bg-muted text-muted-foreground'
                      }
                    >
                      {model.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4">
                    {isAdmin ? (
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Editar ${model.name}`}
                          onClick={() => openEditForm(model)}
                        >
                          <PencilIcon />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className={
                            model.active
                              ? 'text-muted-foreground hover:text-destructive'
                              : 'text-muted-foreground hover:text-foreground'
                          }
                          aria-label={
                            model.active
                              ? `Desativar ${model.name}`
                              : `Reativar ${model.name}`
                          }
                          onClick={() =>
                            setStatusAction({
                              model,
                              type: model.active ? 'deactivate' : 'reactivate',
                            })
                          }
                        >
                          {model.active ? <PowerOffIcon /> : <PowerIcon />}
                        </Button>
                      </div>
                    ) : (
                      <div className="text-right text-sm text-muted-foreground">
                        —
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ModelForm
        key={`${editingModel?.id ?? 'new'}-${formSession}`}
        open={isFormOpen}
        model={editingModel}
        isSubmitting={isSaving}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSubmit}
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
                ? 'Reativar modelo'
                : 'Desativar modelo'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {statusAction?.type === 'reactivate'
                ? `${statusAction.model.name} volta a ficar disponível para novos equipamentos.`
                : `${statusAction?.model.name ?? 'Esse modelo'} deixa de aparecer na lista de modelos ativos.`}
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
