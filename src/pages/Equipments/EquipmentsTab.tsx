import {
  LoaderCircleIcon,
  MonitorSmartphoneIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
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
import {
  createEquipment,
  deleteEquipment,
  getApiErrorMessage,
  listEquipments,
  updateEquipment,
  type Equipment,
  type EquipmentStatus,
} from '@/services/equipmentService'

import { EquipmentForm } from './EquipmentForm'
import {
  equipmentStatusLabels,
  toEquipmentPayload,
  type EquipmentFormValues,
} from './schema'

const statusBadgeClass: Record<EquipmentStatus, string> = {
  INSTALADO:
    'border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300',
  RECEBIDO: 'border-border bg-muted text-muted-foreground',
  EM_ANALISE:
    'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  REPARO: 'border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300',
  FINALIZADO:
    'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  OS_CANCELADA: 'border-destructive/20 bg-destructive/10 text-destructive',
}

export function EquipmentsTab() {
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formSession, setFormSession] = useState(0)
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(
    null,
  )
  const [isSaving, setIsSaving] = useState(false)
  const [equipmentToDelete, setEquipmentToDelete] = useState<Equipment | null>(
    null,
  )
  const [isDeleting, setIsDeleting] = useState(false)

  async function loadEquipments(options?: { silent?: boolean }) {
    if (!options?.silent) {
      setIsLoading(true)
      setLoadError(null)
    }

    try {
      const data = await listEquipments()
      setEquipments(data)
      setLoadError(null)
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        'Não foi possível carregar os equipamentos.',
      )

      if (!options?.silent) {
        setEquipments([])
        setLoadError(message)
      }

      toast.error(message)
    } finally {
      if (!options?.silent) setIsLoading(false)
    }
  }

  useEffect(() => {
    let ignore = false

    listEquipments()
      .then((data) => {
        if (!ignore) setEquipments(data)
      })
      .catch((error: unknown) => {
        if (ignore) return

        const message = getApiErrorMessage(
          error,
          'Não foi possível carregar os equipamentos.',
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

  const filteredEquipments = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR')

    if (!query) return equipments

    return equipments.filter((equipment) => {
      const haystack = [
        equipment.serial_number,
        equipment.model?.name,
        equipment.customer?.name,
        equipmentStatusLabels[equipment.status],
      ]
        .filter((value): value is string => Boolean(value))
        .join(' ')
        .toLocaleLowerCase('pt-BR')

      return haystack.includes(query)
    })
  }, [equipments, search])

  function openCreateForm() {
    setEditingEquipment(null)
    setFormSession((session) => session + 1)
    setIsFormOpen(true)
  }

  function openEditForm(equipment: Equipment) {
    setEditingEquipment(equipment)
    setFormSession((session) => session + 1)
    setIsFormOpen(true)
  }

  async function handleSubmit(values: EquipmentFormValues) {
    setIsSaving(true)
    const payload = toEquipmentPayload(
      values,
      editingEquipment ? 'update' : 'create',
    )

    try {
      if (editingEquipment) {
        await updateEquipment(editingEquipment.id, payload)
        toast.success('Equipamento atualizado.')
      } else {
        await createEquipment(payload)
        toast.success('Equipamento criado.')
      }

      setIsFormOpen(false)
      await loadEquipments({ silent: true })
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Não foi possível salvar o equipamento.'),
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!equipmentToDelete) return

    setIsDeleting(true)

    try {
      await deleteEquipment(equipmentToDelete.id)
      toast.success('Equipamento excluído.')
      setEquipmentToDelete(null)
      await loadEquipments({ silent: true })
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Não foi possível excluir o equipamento.'),
      )
    } finally {
      setIsDeleting(false)
    }
  }

  const equipmentCountLabel =
    equipments.length === 1
      ? '1 equipamento'
      : `${equipments.length} equipamentos`

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {isLoading ? 'Carregando o parque...' : equipmentCountLabel}
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
              placeholder="Buscar por série, modelo ou cliente"
              aria-label="Buscar equipamentos"
              className="pl-9"
            />
          </div>
          <Button type="button" onClick={openCreateForm}>
            <PlusIcon />
            Novo Equipamento
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-4 text-xs font-medium tracking-wide text-muted-foreground">
                Número de série
              </TableHead>
              <TableHead className="px-4 text-xs font-medium tracking-wide text-muted-foreground">
                Modelo
              </TableHead>
              <TableHead className="px-4 text-xs font-medium tracking-wide text-muted-foreground">
                Cliente
              </TableHead>
              <TableHead className="w-36 px-4 text-xs font-medium tracking-wide text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="w-24 px-4 text-right text-xs font-medium tracking-wide text-muted-foreground">
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
                    Carregando equipamentos
                  </div>
                </TableCell>
              </TableRow>
            ) : loadError ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="px-4 py-16">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-3 text-center">
                    <p className="text-sm text-muted-foreground">{loadError}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void loadEquipments()}
                    >
                      Tentar de novo
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredEquipments.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="px-4 py-16">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-3 text-center">
                    <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
                      <MonitorSmartphoneIcon
                        className="size-4"
                        strokeWidth={1.75}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium tracking-tight">
                        {equipments.length === 0
                          ? 'Nenhum equipamento cadastrado'
                          : 'Nenhum equipamento encontrado'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {equipments.length === 0
                          ? 'Registre a primeira máquina do parque.'
                          : 'Tente outro número de série, modelo ou cliente.'}
                      </p>
                    </div>
                    {equipments.length === 0 ? (
                      <Button type="button" size="sm" onClick={openCreateForm}>
                        <PlusIcon />
                        Novo Equipamento
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredEquipments.map((equipment) => (
                <TableRow key={equipment.id}>
                  <TableCell className="px-4 font-medium font-mono tracking-tight">
                    {equipment.serial_number}
                  </TableCell>
                  <TableCell className="px-4 text-muted-foreground">
                    {equipment.model?.name ?? 'Modelo desconhecido'}
                  </TableCell>
                  <TableCell className="px-4">
                    {equipment.customer?.name ? (
                      <span>{equipment.customer.name}</span>
                    ) : (
                      <Badge variant="secondary">Em Estoque/Oficina</Badge>
                    )}
                  </TableCell>
                  <TableCell className="px-4">
                    <Badge
                      variant="outline"
                      className={statusBadgeClass[equipment.status]}
                    >
                      {equipmentStatusLabels[equipment.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Editar ${equipment.serial_number}`}
                        onClick={() => openEditForm(equipment)}
                      >
                        <PencilIcon />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:text-destructive"
                        aria-label={`Excluir ${equipment.serial_number}`}
                        onClick={() => setEquipmentToDelete(equipment)}
                      >
                        <Trash2Icon />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <EquipmentForm
        key={`${editingEquipment?.id ?? 'new'}-${formSession}`}
        open={isFormOpen}
        equipment={editingEquipment}
        isSubmitting={isSaving}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSubmit}
      />

      <AlertDialog
        open={equipmentToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setEquipmentToDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir equipamento</AlertDialogTitle>
            <AlertDialogDescription>
              {equipmentToDelete
                ? `${equipmentToDelete.serial_number} deixa de aparecer na lista de equipamentos.`
                : 'Esse equipamento deixa de aparecer na lista.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={() => void handleDelete()}
            >
              {isDeleting ? (
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
