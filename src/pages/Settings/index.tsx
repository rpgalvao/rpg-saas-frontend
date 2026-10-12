import { Building2Icon, UserIcon } from 'lucide-react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/contexts/AuthContext'

import { ProfileTab } from './ProfileTab'
import { TenantTab } from './TenantTab'

export function SettingsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie seu perfil e as preferências da conta.
        </p>
      </header>

      <Tabs defaultValue="perfil">
        <TabsList>
          <TabsTrigger value="perfil">
            <UserIcon />
            Meu Perfil
          </TabsTrigger>
          {isAdmin ? (
            <TabsTrigger value="empresa">
              <Building2Icon />
              Empresa
            </TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="perfil" className="mt-2">
          <ProfileTab />
        </TabsContent>
        {isAdmin ? (
          <TabsContent value="empresa" className="mt-2">
            <TenantTab />
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  )
}
