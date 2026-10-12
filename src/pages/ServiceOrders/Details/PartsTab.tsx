import { LoaderCircleIcon, WrenchIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/formatters'
import type { Part } from '@/services/partService'
import type { ServiceOrder } from '@/services/serviceOrderService'

type PartsTabProps = {
  order: ServiceOrder
  parts: Part[]
  isLoadingParts: boolean
  selectedPartId: string
  quantity: number
  isAdding: boolean
  onSelectedPartId: (partId: string) => void
  onQuantity: (quantity: number) => void
  onAdd: () => void
}

export function PartsTab({
  order,
  parts,
  isLoadingParts,
  selectedPartId,
  quantity,
  isAdding,
  onSelectedPartId,
  onQuantity,
  onAdd,
}: PartsTabProps) {
  const [partQuery, setPartQuery] = useState('')
  const appliedParts = order.parts_replaced ?? []
  const partsTotal = appliedParts.reduce(
    (total, item) => total + item.quantity * Number(item.unit_price),
    0,
  )

  const visibleParts = useMemo(() => {
    const query = partQuery.trim().toLocaleLowerCase('pt-BR')

    return parts.filter((part) => {
      if (part.id === selectedPartId) return true
      if (!query) return true

      const haystack = `${part.name} ${part.sku ?? ''}`.toLocaleLowerCase('pt-BR')
      return haystack.includes(query)
    })
  }, [partQuery, parts, selectedPartId])

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      {order.status === 'ABERTA' ? (
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-medium tracking-tight">
            Aplicar peça no equipamento
          </h2>
          <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_9rem_auto] lg:items-end">
            <div className="flex flex-col gap-2">
              <Label htmlFor="part-search">Buscar peça no catálogo</Label>
              <Input
                id="part-search"
                value={partQuery}
                placeholder="Nome ou SKU"
                onChange={(event) => setPartQuery(event.target.value)}
              />
              <Select
                value={selectedPartId || undefined}
                onValueChange={onSelectedPartId}
                disabled={isLoadingParts || isAdding}
              >
                <SelectTrigger className="w-full" aria-label="Peça do catálogo">
                  <SelectValue
                    placeholder={
                      isLoadingParts ? 'Carregando peças...' : 'Selecione uma peça'
                    }
                  />
                </SelectTrigger>
                <SelectContent align="start" className="z-[60]">
                  {visibleParts.length === 0 ? (
                    <SelectItem value="__empty" disabled>
                      Nenhuma peça encontrada
                    </SelectItem>
                  ) : (
                    visibleParts.map((part) => (
                      <SelectItem
                        key={part.id}
                        value={part.id}
                        disabled={part.current_stock < 1}
                      >
                        {part.name} (estoque: {part.current_stock}) ·{' '}
                        {formatCurrency(part.sale_price)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="part-quantity">Quantidade</Label>
              <Input
                id="part-quantity"
                type="number"
                min={1}
                step={1}
                value={quantity}
                disabled={isAdding}
                onChange={(event) => onQuantity(Number(event.target.value))}
              />
            </div>

            <Button
              type="button"
              disabled={
                !selectedPartId ||
                !Number.isInteger(quantity) ||
                quantity < 1 ||
                isAdding
              }
              onClick={onAdd}
            >
              {isAdding ? (
                <>
                  <LoaderCircleIcon className="animate-spin" />
                  Salvando
                </>
              ) : (
                'Adicionar'
              )}
            </Button>
          </div>
        </section>
      ) : null}

      <div className="flex flex-col gap-3">
        <h2 className="text-base font-semibold tracking-tight">
          Peças aplicadas nesta O.S.
        </h2>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-4 text-xs font-medium tracking-wide text-muted-foreground">
                  Peça / SKU
                </TableHead>
                <TableHead className="px-4 text-center text-xs font-medium tracking-wide text-muted-foreground">
                  Quantidade
                </TableHead>
                <TableHead className="px-4 text-right text-xs font-medium tracking-wide text-muted-foreground">
                  Valor unit.
                </TableHead>
                <TableHead className="px-4 text-right text-xs font-medium tracking-wide text-muted-foreground">
                  Subtotal
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appliedParts.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={4} className="px-4 py-12">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <WrenchIcon
                        className="size-4 text-muted-foreground"
                        strokeWidth={1.75}
                      />
                      <p className="text-sm text-muted-foreground">
                        Nenhuma peça foi aplicada nesta ordem de serviço.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                appliedParts.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="px-4">
                      <p className="font-medium">{item.part.name}</p>
                      <p className="text-xs text-muted-foreground">
                        SKU: {item.part.sku || 'N/A'}
                      </p>
                    </TableCell>
                    <TableCell className="px-4 text-center tabular-nums">
                      {item.quantity} un
                    </TableCell>
                    <TableCell className="px-4 text-right tabular-nums">
                      {formatCurrency(item.unit_price)}
                    </TableCell>
                    <TableCell className="px-4 text-right font-medium tabular-nums">
                      {formatCurrency(item.quantity * Number(item.unit_price))}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {appliedParts.length > 0 ? (
              <TableFooter>
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={3} className="px-4 text-right font-medium">
                    Custo total em peças
                  </TableCell>
                  <TableCell className="px-4 text-right text-base font-semibold tabular-nums">
                    {formatCurrency(partsTotal)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            ) : null}
          </Table>
        </div>
      </div>
    </div>
  )
}
