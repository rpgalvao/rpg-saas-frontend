import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { EquipmentsTab } from './EquipmentsTab'
import { ModelsTab } from './ModelsTab'

export function EquipmentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Equipamentos</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie o parque de máquinas, números de série e o catálogo de modelos.
        </p>
      </header>

      <Tabs defaultValue="equipamentos">
        <TabsList>
          <TabsTrigger value="equipamentos">Equipamentos</TabsTrigger>
          <TabsTrigger value="modelos">Modelos</TabsTrigger>
        </TabsList>

        <TabsContent value="equipamentos" className="mt-2">
          <EquipmentsTab />
        </TabsContent>
        <TabsContent value="modelos" className="mt-2">
          <ModelsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
