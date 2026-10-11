import {
  LoaderCircleIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  UsersIcon,
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
  createCustomer,
  deleteCustomer,
  getApiErrorMessage,
  listCustomers,
  updateCustomer,
  type Customer,
} from '@/services/customerService'

import { CustomerForm } from './CustomerForm'
import { toCustomerPayload, type CustomerFormValues } from './schema'

function displayValue(value: string | null | undefined) {
  const text = value?.trim()
  return text ? text : '—'
}

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formSession, setFormSession] = useState(0)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  async function loadCustomers(options?: { silent?: boolean }) {
    if (!options?.silent) {
      setIsLoading(true)
      setLoadError(null)
    }

    try {
      const data = await listCustomers()
      setCustomers(data)
      setLoadError(null)
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        'Não foi possível carregar os clientes.',
      )

      if (!options?.silent) {
        setCustomers([])
        setLoadError(message)
      }

      toast.error(message)
    } finally {
      if (!options?.silent) setIsLoading(false)
    }
  }

  useEffect(() => {
    let ignore = false

    listCustomers()
      .then((data) => {
        if (!ignore) setCustomers(data)
      })
      .catch((error: unknown) => {
        if (ignore) return

        const message = getApiErrorMessage(
          error,
          'Não foi possível carregar os clientes.',
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

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR')

    if (!query) return customers

    const digits = query.replace(/\D/g, '')

    return customers.filter((customer) => {
      const haystack = [
        customer.name,
        customer.email,
        customer.city,
        customer.state,
      ]
        .filter((value): value is string => Boolean(value))
        .join(' ')
        .toLocaleLowerCase('pt-BR')

      if (haystack.includes(query)) return true

      return Boolean(
        digits && customer.phone?.replace(/\D/g, '').includes(digits),
      )
    })
  }, [customers, search])

  function openCreateForm() {
    setEditingCustomer(null)
    setFormSession((session) => session + 1)
    setIsFormOpen(true)
  }

  function openEditForm(customer: Customer) {
    setEditingCustomer(customer)
    setFormSession((session) => session + 1)
    setIsFormOpen(true)
  }

  async function handleSubmit(values: CustomerFormValues) {
    setIsSaving(true)
    const payload = toCustomerPayload(values)

    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, payload)
        toast.success('Cliente atualizado.')
      } else {
        await createCustomer(payload)
        toast.success('Cliente criado.')
      }

      setIsFormOpen(false)
      await loadCustomers({ silent: true })
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Não foi possível salvar o cliente.'),
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!customerToDelete) return

    setIsDeleting(true)

    try {
      await deleteCustomer(customerToDelete.id)
      toast.success('Cliente excluído.')
      setCustomerToDelete(null)
      await loadCustomers({ silent: true })
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Não foi possível excluir o cliente.'),
      )
    } finally {
      setIsDeleting(false)
    }
  }

  const customerCountLabel =
    customers.length === 1 ? '1 cliente' : `${customers.length} clientes`

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? 'Carregando a carteira...' : customerCountLabel}
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
              placeholder="Buscar por nome, e-mail ou cidade"
              aria-label="Buscar clientes"
              className="pl-9"
            />
          </div>
          <Button type="button" onClick={openCreateForm}>
            <PlusIcon />
            Novo Cliente
          </Button>
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
                E-mail
              </TableHead>
              <TableHead className="px-4 text-xs font-medium tracking-wide text-muted-foreground">
                Telefone
              </TableHead>
              <TableHead className="px-4 text-xs font-medium tracking-wide text-muted-foreground">
                Cidade / UF
              </TableHead>
              <TableHead className="px-4 text-right text-xs font-medium tracking-wide text-muted-foreground">
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
                    Carregando clientes
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
                      onClick={() => void loadCustomers()}
                    >
                      Tentar de novo
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredCustomers.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="px-4 py-16">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-3 text-center">
                    <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
                      <UsersIcon className="size-4" strokeWidth={1.75} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium tracking-tight">
                        {customers.length === 0
                          ? 'Nenhum cliente cadastrado'
                          : 'Nenhum cliente encontrado'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {customers.length === 0
                          ? 'Cadastre o primeiro cliente para começar a carteira.'
                          : 'Tente outro nome, e-mail ou cidade.'}
                      </p>
                    </div>
                    {customers.length === 0 ? (
                      <Button type="button" size="sm" onClick={openCreateForm}>
                        <PlusIcon />
                        Novo Cliente
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="px-4 font-medium">
                    {customer.name}
                  </TableCell>
                  <TableCell className="px-4 text-muted-foreground">
                    {displayValue(customer.email)}
                  </TableCell>
                  <TableCell className="px-4 whitespace-nowrap text-muted-foreground">
                    {displayValue(customer.phone)}
                  </TableCell>
                  <TableCell className="px-4 text-muted-foreground">
                    {customer.city} / {customer.state}
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Editar ${customer.name}`}
                        onClick={() => openEditForm(customer)}
                      >
                        <PencilIcon />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:text-destructive"
                        aria-label={`Excluir ${customer.name}`}
                        onClick={() => setCustomerToDelete(customer)}
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

      <CustomerForm
        key={`${editingCustomer?.id ?? 'new'}-${formSession}`}
        open={isFormOpen}
        customer={editingCustomer}
        isSubmitting={isSaving}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSubmit}
      />

      <AlertDialog
        open={customerToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setCustomerToDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente</AlertDialogTitle>
            <AlertDialogDescription>
              {customerToDelete
                ? `${customerToDelete.name} deixa de aparecer na lista de clientes.`
                : 'Esse cliente deixa de aparecer na lista.'}
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
