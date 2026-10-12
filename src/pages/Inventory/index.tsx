import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { MovementsTab } from './MovementsTab'
import { PartsTab } from './PartsTab'
import { SuppliersTab } from './SuppliersTab'

export function InventoryPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Estoque e Peças</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie o catálogo de peças, os fornecedores e o histórico de movimentações.
        </p>
      </header>

      <Tabs defaultValue="pecas">
        <TabsList>
          <TabsTrigger value="pecas">Peças</TabsTrigger>
          <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
          <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
        </TabsList>

        <TabsContent value="pecas" className="mt-2">
          <PartsTab />
        </TabsContent>
        <TabsContent value="fornecedores" className="mt-2">
          <SuppliersTab />
        </TabsContent>
        <TabsContent value="movimentacoes" className="mt-2">
          <MovementsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
