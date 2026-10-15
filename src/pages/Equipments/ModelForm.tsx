import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircleIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { EquipmentModel } from '@/services/equipmentModelService'

import {
  modelFormSchema,
  toModelFormValues,
  type ModelFormValues,
} from './schema'

type ModelFormProps = {
  open: boolean
  model: EquipmentModel | null
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: ModelFormValues) => Promise<void>
}

export function ModelForm({
  open,
  model,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: ModelFormProps) {
  const form = useForm<ModelFormValues>({
    resolver: zodResolver(modelFormSchema),
    defaultValues: toModelFormValues(model),
  })

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (isSubmitting) return
        onOpenChange(nextOpen)
      }}
    >
      <SheetContent className="w-full gap-0 overflow-hidden p-0 sm:max-w-md">
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle className="tracking-tight">
            {model ? 'Editar modelo' : 'Novo modelo'}
          </SheetTitle>
          <SheetDescription>
            {model
              ? 'Atualize o nome e a marca deste modelo no catálogo.'
              : 'Cadastre uma família de equipamento suportada.'}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
          >
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do modelo</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ex: Microscópio Binocular X200"
                        autoComplete="off"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marca</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ex: Olympus"
                        autoComplete="off"
                        disabled={isSubmitting}
                      />
                    </FormControl>
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <LoaderCircleIcon className="animate-spin" />
                    Salvando
                  </>
                ) : model ? (
                  'Salvar alterações'
                ) : (
                  'Criar modelo'
                )}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
