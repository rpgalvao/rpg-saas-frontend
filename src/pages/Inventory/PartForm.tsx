import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircleIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { Part } from '@/services/partService'
import {
  getApiErrorMessage,
  listSuppliers,
  type Supplier,
} from '@/services/supplierService'

import {
  partFormSchema,
  toPartFormValues,
  type PartFormValues,
} from './schema'

const NO_SUPPLIER = '__none__'

type PartFormProps = {
  open: boolean
  part: Part | null
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: PartFormValues) => Promise<void>
}

export function PartForm({
  open,
  part,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: PartFormProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(true)
  const [suppliersError, setSuppliersError] = useState<string | null>(null)
  const [suppliersSession, setSuppliersSession] = useState(0)

  const form = useForm<PartFormValues>({
    resolver: zodResolver(partFormSchema),
    defaultValues: toPartFormValues(part),
  })

  useEffect(() => {
    if (!open) return

    let ignore = false

    listSuppliers()
      .then((data) => {
        if (!ignore) setSuppliers(data.filter((supplier) => supplier.active))
      })
      .catch((error: unknown) => {
        if (ignore) return

        const message = getApiErrorMessage(
          error,
          'Não foi possível carregar os fornecedores.',
        )
        setSuppliersError(message)
        toast.error(message)
      })
      .finally(() => {
        if (!ignore) setIsLoadingSuppliers(false)
      })

    return () => {
      ignore = true
    }
  }, [open, suppliersSession])

  const supplierOptions = useMemo(() => {
    if (
      !part?.supplier ||
      !part.supplierId ||
      suppliers.some((supplier) => supplier.id === part.supplierId)
    ) {
      return suppliers
    }

    return [
      {
        id: part.supplierId,
        name: part.supplier.name,
        document: null,
        email: null,
        phone: null,
        active: false,
        created_at: '',
      },
      ...suppliers,
    ]
  }, [part, suppliers])

  const isBusy = isSubmitting || isLoadingSuppliers

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (isSubmitting) return
        onOpenChange(nextOpen)
      }}
    >
      <SheetContent className="w-full gap-0 overflow-hidden p-0 sm:max-w-lg">
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle className="tracking-tight">
            {part ? 'Editar peça' : 'Nova peça'}
          </SheetTitle>
          <SheetDescription>
            {part
              ? 'Atualize preços, estoque e o fornecedor desta peça.'
              : 'Cadastre um item do catálogo de peças.'}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
          >
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
              {isLoadingSuppliers ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LoaderCircleIcon className="size-4 animate-spin" />
                  Carregando fornecedores
                </div>
              ) : null}

              {suppliersError ? (
                <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 p-3">
                  <p className="text-sm text-muted-foreground">{suppliersError}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="self-start"
                    onClick={() => {
                      setIsLoadingSuppliers(true)
                      setSuppliersError(null)
                      setSuppliersSession((session) => session + 1)
                    }}
                  >
                    Tentar de novo
                  </Button>
                </div>
              ) : null}

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ex: Placa principal"
                        autoComplete="off"
                        disabled={isBusy}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ex: BR-9988-X"
                        autoComplete="off"
                        disabled={isBusy}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="cost_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço de custo</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="0.01"
                          disabled={isBusy}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sale_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço de venda</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="0.01"
                          disabled={isBusy}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="current_stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estoque atual</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          inputMode="numeric"
                          min="0"
                          step="1"
                          disabled={isBusy}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="min_stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estoque mínimo</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          inputMode="numeric"
                          min="0"
                          step="1"
                          disabled={isBusy}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fornecedor</FormLabel>
                    <Select
                      value={field.value || NO_SUPPLIER}
                      onValueChange={(value) =>
                        field.onChange(value === NO_SUPPLIER ? '' : value)
                      }
                      disabled={isBusy}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sem fornecedor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent position="popper">
                        <SelectItem value={NO_SUPPLIER}>Sem fornecedor</SelectItem>
                        {supplierOptions.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Opcional.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <SheetFooter className="flex-row justify-end border-t bg-muted/40">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isBusy}>
                {isSubmitting ? (
                  <>
                    <LoaderCircleIcon className="animate-spin" />
                    Salvando
                  </>
                ) : part ? (
                  'Salvar alterações'
                ) : (
                  'Criar peça'
                )}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
