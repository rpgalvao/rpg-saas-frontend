import {
  LoaderCircleIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  UserCheckIcon,
  UserCogIcon,
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
import { formatPhone } from '@/lib/formatters'
import {
  createUser,
  deactivateUser,
  getApiErrorMessage,
  listUsers,
  toggleUserStatus,
  updateUser,
  type TeamUser,
} from '@/services/userService'

import { roleLabels, toCreateUserPayload, toUpdateUserPayload, type UserFormValues } from './schema'
import { UserForm } from './UserForm'

type StatusAction = {
  user: TeamUser
  type: 'deactivate' | 'reactivate'
}

function displayPhone(value: string | null | undefined) {
  const phone = formatPhone(value)
  return phone || '—'
}

export function UsersPage() {
  const { user: currentUser } = useAuth()
  const isAdmin = currentUser?.role === 'ADMIN'
  const [users, setUsers] = useState<TeamUser[]>([])
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formSession, setFormSession] = useState(0)
  const [editingUser, setEditingUser] = useState<TeamUser | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [statusAction, setStatusAction] = useState<StatusAction | null>(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  async function loadUsers(options?: { silent?: boolean }) {
    if (!options?.silent) {
      setIsLoading(true)
      setLoadError(null)
    }

    try {
      const data = await listUsers(showInactive)
      setUsers(data)
      setLoadError(null)
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        'Não foi possível carregar os usuários.',
      )

      if (!options?.silent) {
        setUsers([])
        setLoadError(message)
      }

      toast.error(message)
    } finally {
      if (!options?.silent) setIsLoading(false)
    }
  }

  useEffect(() => {
    let ignore = false

    listUsers(showInactive)
      .then((data) => {
        if (!ignore) setUsers(data)
      })
      .catch((error: unknown) => {
        if (ignore) return

        const message = getApiErrorMessage(
          error,
          'Não foi possível carregar os usuários.',
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

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR')

    if (!query) return users

    const digits = query.replace(/\D/g, '')

    return users.filter((user) => {
      const haystack = [user.name, user.email, roleLabels[user.role]]
        .join(' ')
        .toLocaleLowerCase('pt-BR')

      if (haystack.includes(query)) return true

      return Boolean(digits && user.phone?.replace(/\D/g, '').includes(digits))
    })
  }, [search, users])

  function openCreateForm() {
    setEditingUser(null)
    setFormSession((session) => session + 1)
    setIsFormOpen(true)
  }

  function openEditForm(user: TeamUser) {
    setEditingUser(user)
    setFormSession((session) => session + 1)
    setIsFormOpen(true)
  }

  async function handleSubmit(values: UserFormValues) {
    setIsSaving(true)

    try {
      if (editingUser) {
        await updateUser(editingUser.id, toUpdateUserPayload(values))
        toast.success('Usuário atualizado.')
      } else {
        await createUser(toCreateUserPayload(values))
        toast.success('Usuário criado.')
      }

      setIsFormOpen(false)
      await loadUsers({ silent: true })
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Não foi possível salvar o usuário.'),
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleStatusChange() {
    if (!statusAction) return

    setIsUpdatingStatus(true)

    try {
      if (statusAction.type === 'deactivate') {
        await deactivateUser(statusAction.user.id)
        toast.success('Usuário desativado.')
      } else {
        await toggleUserStatus(statusAction.user.id)
        toast.success('Usuário reativado.')
      }

      setStatusAction(null)
      await loadUsers({ silent: true })
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Não foi possível alterar o status.'),
      )
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const userCountLabel = users.length === 1 ? '1 usuário' : `${users.length} usuários`

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Usuários / Técnicos
          </h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? 'Carregando a equipe...' : userCountLabel}
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
              placeholder="Buscar por nome ou e-mail"
              aria-label="Buscar usuários"
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
              Novo Usuário
            </Button>
          ) : null}
        </div>
      </header>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[22%] px-4 text-xs font-medium tracking-wide text-muted-foreground">
                Nome
              </TableHead>
              <TableHead className="px-4 text-xs font-medium tracking-wide text-muted-foreground">
                E-mail
              </TableHead>
              <TableHead className="w-36 px-4 text-xs font-medium tracking-wide text-muted-foreground">
                Telefone
              </TableHead>
              <TableHead className="w-32 px-4 text-xs font-medium tracking-wide text-muted-foreground">
                Nível
              </TableHead>
              <TableHead className="w-24 px-4 text-xs font-medium tracking-wide text-muted-foreground">
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
                <TableCell colSpan={6} className="px-4 py-16">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <LoaderCircleIcon className="size-4 animate-spin" />
                    Carregando usuários
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
                      onClick={() => void loadUsers()}
                    >
                      Tentar de novo
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="px-4 py-16">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-3 text-center">
                    <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
                      <UserCogIcon className="size-4" strokeWidth={1.75} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium tracking-tight">
                        {users.length === 0
                          ? 'Nenhum usuário encontrado'
                          : 'Nenhum usuário para essa busca'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {users.length === 0
                          ? 'Cadastre um técnico ou administrador para a equipe.'
                          : 'Tente outro nome ou e-mail.'}
                      </p>
                    </div>
                    {users.length === 0 && isAdmin ? (
                      <Button type="button" size="sm" onClick={openCreateForm}>
                        <PlusIcon />
                        Novo Usuário
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => {
                const isCurrentUser = user.id === currentUser?.id

                return (
                  <TableRow
                    key={user.id}
                    className={user.active ? undefined : 'text-muted-foreground'}
                  >
                    <TableCell className="px-4 font-medium text-foreground">
                      <span className="block truncate">
                        {user.name}
                        {isCurrentUser ? (
                          <span className="ml-2 text-xs font-normal text-muted-foreground">
                            Você
                          </span>
                        ) : null}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 text-muted-foreground">
                      <span className="block truncate" title={user.email}>
                        {user.email}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 whitespace-nowrap text-muted-foreground">
                      {displayPhone(user.phone)}
                    </TableCell>
                    <TableCell className="px-4">
                      <Badge
                        variant={user.role === 'ADMIN' ? 'default' : 'secondary'}
                      >
                        {roleLabels[user.role]}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4">
                      <Badge variant={user.active ? 'outline' : 'secondary'}>
                        {user.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4">
                      {isAdmin ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Editar ${user.name}`}
                            onClick={() => openEditForm(user)}
                          >
                            <PencilIcon />
                          </Button>
                          {user.active && !isCurrentUser ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="text-muted-foreground hover:text-destructive"
                              aria-label={`Desativar ${user.name}`}
                              onClick={() =>
                                setStatusAction({ user, type: 'deactivate' })
                              }
                            >
                              <Trash2Icon />
                            </Button>
                          ) : null}
                          {!user.active ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Reativar ${user.name}`}
                              onClick={() =>
                                setStatusAction({ user, type: 'reactivate' })
                              }
                            >
                              <UserCheckIcon />
                            </Button>
                          ) : null}
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

      <UserForm
        key={`${editingUser?.id ?? 'new'}-${formSession}`}
        open={isFormOpen}
        user={editingUser}
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
                ? 'Reativar usuário'
                : 'Desativar usuário'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {statusAction?.type === 'reactivate'
                ? `${statusAction.user.name} volta a acessar o sistema.`
                : `${statusAction?.user.name ?? 'Esse usuário'} perde o acesso ao sistema.`}
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
