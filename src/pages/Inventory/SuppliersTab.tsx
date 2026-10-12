import {
  Building2Icon,
  LoaderCircleIcon,
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
import { formatPhone } from '@/lib/formatters'
import {
  createSupplier,
  deleteSupplier,
  getApiErrorMessage,
  listSuppliers,
  updateSupplier,
  type Supplier,
} from '@/services/supplierService'

import { toSupplierPayload, type SupplierFormValues } from './schema'
import { SupplierForm } from './SupplierForm'

function contactLines(supplier: Supplier) {
  const phone = formatPhone(supplier.phone)
  const lines = [supplier.email, phone].filter(
    (value): value is string => Boolean(value),
  )

  return lines
}

export function SuppliersTab() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formSession, setFormSession] = useState(0)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [supplierToDeactivate, setSupplierToDeactivate] = useState<Supplier | null>(
    null,
  )
  const [isDeactivating, setIsDeactivating] = useState(false)
  const [reactivatingId, setReactivatingId] = useState<string | null>(null)

  async function loadSuppliers(options?: { silent?: boolean }) {
    if (!options?.silent) {
      setIsLoading(true)
      setLoadError(null)
    }

    try {
      const data = await listSuppliers(showInactive)
      setSuppliers(data)
      setLoadError(null)
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        'Não foi possível carregar os fornecedores.',
      )

      if (!options?.silent) {
        setSuppliers([])
        setLoadError(message)
      }

      toast.error(message)
    } finally {
      if (!options?.silent) setIsLoading(false)
    }
  }

  useEffect(() => {
    let ignore = false

    listSuppliers(showInactive)
      .then((data) => {
        if (!ignore) setSuppliers(data)
      })
      .catch((error: unknown) => {
        if (ignore) return

        const message = getApiErrorMessage(
          error,
          'Não foi possível carregar os fornecedores.',
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

  const filteredSuppliers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR')

    if (!query) return suppliers

    const digits = query.replace(/\D/g, '')

    return suppliers.filter((supplier) => {
      const haystack = [supplier.name, supplier.email, supplier.document]
        .filter((value): value is string => Boolean(value))
        .join(' ')
        .toLocaleLowerCase('pt-BR')

      if (haystack.includes(query)) return true

      return Boolean(
        digits &&
          (supplier.document?.replace(/\D/g, '').includes(digits) ||
            supplier.phone?.replace(/\D/g, '').includes(digits)),
      )
    })
  }, [search, suppliers])

  function openCreateForm() {
    setEditingSupplier(null)
    setFormSession((session) => session + 1)
    setIsFormOpen(true)
  }

  function openEditForm(supplier: Supplier) {
    setEditingSupplier(supplier)
    setFormSession((session) => session + 1)
    setIsFormOpen(true)
  }

  async function handleSubmit(values: SupplierFormValues) {
    setIsSaving(true)

    try {
      if (editingSupplier) {
        await updateSupplier(
          editingSupplier.id,
          toSupplierPayload(values, 'update'),
        )
        toast.success('Fornecedor atualizado.')
      } else {
        await createSupplier(toSupplierPayload(values, 'create'))
        toast.success('Fornecedor criado.')
      }

      setIsFormOpen(false)
      await loadSuppliers({ silent: true })
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Não foi possível salvar o fornecedor.'),
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeactivate() {
    if (!supplierToDeactivate) return

    setIsDeactivating(true)

    try {
      await deleteSupplier(supplierToDeactivate.id)
      toast.success('Fornecedor inativado.')
      setSupplierToDeactivate(null)
      await loadSuppliers({ silent: true })
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Não foi possível inativar o fornecedor.'),
      )
    } finally {
      setIsDeactivating(false)
    }
  }

  async function handleReactivate(supplier: Supplier) {
    setReactivatingId(supplier.id)

    try {
      await updateSupplier(supplier.id, { name: supplier.name, active: true })
      toast.success('Fornecedor reativado.')
      await loadSuppliers({ silent: true })
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Não foi possível reativar o fornecedor.'),
      )
    } finally {
      setReactivatingId(null)
    }
  }

  const countLabel =
    suppliers.length === 1 ? '1 fornecedor' : `${suppliers.length} fornecedores`

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {isLoading ? 'Carregando fornecedores...' : countLabel}
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
              placeholder="Buscar por nome ou documento"
              aria-label="Buscar fornecedores"
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
            {showInactive ? 'Ocultar inativos' : 'Mostrar inativos'}
          </Button>
          <Button type="button" onClick={openCreateForm}>
            <PlusIcon />
            Novo Fornecedor
          </Button>
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
                Contato
              </TableHead>
              <TableHead className="w-28 px-4 text-xs font-medium tracking-wide text-muted-foreground">
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
                    Carregando fornecedores
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
                      onClick={() => void loadSuppliers()}
                    >
                      Tentar de novo
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredSuppliers.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="px-4 py-16">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-3 text-center">
                    <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
                      <Building2Icon className="size-4" strokeWidth={1.75} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium tracking-tight">
                        {suppliers.length === 0
                          ? 'Nenhum fornecedor cadastrado'
                          : 'Nenhum fornecedor encontrado'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {suppliers.length === 0
                          ? 'Cadastre o primeiro distribuidor de peças.'
                          : 'Tente outro nome ou documento.'}
                      </p>
                    </div>
                    {suppliers.length === 0 ? (
                      <Button type="button" size="sm" onClick={openCreateForm}>
                        <PlusIcon />
                        Novo Fornecedor
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredSuppliers.map((supplier) => {
                const contact = contactLines(supplier)

                return (
                  <TableRow
                    key={supplier.id}
                    className={supplier.active ? undefined : 'text-muted-foreground'}
                  >
                    <TableCell className="px-4">
                      <div className="font-medium text-foreground">{supplier.name}</div>
                      {supplier.document ? (
                        <div className="text-xs text-muted-foreground">
                          {supplier.document}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="px-4 text-muted-foreground">
                      {contact.length === 0 ? (
                        '—'
                      ) : (
                        <div className="flex flex-col">
                          {contact.map((line) => (
                            <span key={line}>{line}</span>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="px-4">
                      <Badge
                        variant="outline"
                        className={
                          supplier.active
                            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                            : 'border-border bg-muted text-muted-foreground'
                        }
                      >
                        {supplier.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Editar ${supplier.name}`}
                          onClick={() => openEditForm(supplier)}
                        >
                          <PencilIcon />
                        </Button>
                        {supplier.active ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground hover:text-destructive"
                            aria-label={`Inativar ${supplier.name}`}
                            onClick={() => setSupplierToDeactivate(supplier)}
                          >
                            <Trash2Icon />
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Reativar ${supplier.name}`}
                            disabled={reactivatingId === supplier.id}
                            onClick={() => void handleReactivate(supplier)}
                          >
                            {reactivatingId === supplier.id ? (
                              <LoaderCircleIcon className="animate-spin" />
                            ) : (
                              <UserCheckIcon />
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <SupplierForm
        key={`${editingSupplier?.id ?? 'new'}-${formSession}`}
        open={isFormOpen}
        supplier={editingSupplier}
        isSubmitting={isSaving}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSubmit}
      />

      <AlertDialog
        open={supplierToDeactivate !== null}
        onOpenChange={(open) => {
          if (!open && !isDeactivating) setSupplierToDeactivate(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Inativar fornecedor</AlertDialogTitle>
            <AlertDialogDescription>
              {supplierToDeactivate
                ? `${supplierToDeactivate.name} deixa de aparecer na lista de fornecedores ativos.`
                : 'Esse fornecedor deixa de aparecer na lista.'}
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
