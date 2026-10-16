import { LoaderCircleIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Control, FieldPath, FieldValues } from 'react-hook-form'

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { formatCep } from '@/lib/formatters'

type AddressFieldsProps<T extends FieldValues> = {
  control: Control<T>
  disabled?: boolean
  isFetchingCep?: boolean
}

function OptionalLabel({ children }: { children: ReactNode }) {
  return (
    <FormLabel>
      {children}{' '}
      <span className="font-normal text-muted-foreground">(opcional)</span>
    </FormLabel>
  )
}

export function AddressFields<T extends FieldValues>({
  control,
  disabled = false,
  isFetchingCep = false,
}: AddressFieldsProps<T>) {
  const fieldDisabled = disabled || isFetchingCep

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12 min-w-0 md:col-span-4">
        <FormField
          control={control}
          name={'cep' as FieldPath<T>}
          render={({ field }) => (
            <FormItem>
              <OptionalLabel>CEP</OptionalLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    {...field}
                    inputMode="numeric"
                    placeholder="00000-000"
                    className="w-full tabular-nums pr-10"
                    disabled={fieldDisabled}
                    onChange={(event) =>
                      field.onChange(formatCep(event.target.value))
                    }
                  />
                </FormControl>
                {isFetchingCep ? (
                  <LoaderCircleIcon
                    className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
                    aria-label="Consultando CEP"
                  />
                ) : null}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="col-span-12 min-w-0 md:col-span-8">
        <FormField
          control={control}
          name={'street' as FieldPath<T>}
          render={({ field }) => (
            <FormItem>
              <OptionalLabel>Logradouro</OptionalLabel>
              <FormControl>
                <Input {...field} className="w-full" disabled={fieldDisabled} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="col-span-6 min-w-0 md:col-span-3">
        <FormField
          control={control}
          name={'number' as FieldPath<T>}
          render={({ field }) => (
            <FormItem>
              <OptionalLabel>Número</OptionalLabel>
              <FormControl>
                <Input {...field} className="w-full" disabled={disabled} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="col-span-6 min-w-0 md:col-span-3">
        <FormField
          control={control}
          name={'complement' as FieldPath<T>}
          render={({ field }) => (
            <FormItem>
              <OptionalLabel>Complemento</OptionalLabel>
              <FormControl>
                <Input {...field} className="w-full" disabled={disabled} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="col-span-12 min-w-0 md:col-span-6">
        <FormField
          control={control}
          name={'neighborhood' as FieldPath<T>}
          render={({ field }) => (
            <FormItem>
              <OptionalLabel>Bairro</OptionalLabel>
              <FormControl>
                <Input {...field} className="w-full" disabled={fieldDisabled} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="col-span-12 min-w-0 md:col-span-8">
        <FormField
          control={control}
          name={'city' as FieldPath<T>}
          render={({ field }) => (
            <FormItem>
              <OptionalLabel>Cidade</OptionalLabel>
              <FormControl>
                <Input {...field} className="w-full" disabled={fieldDisabled} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="col-span-12 min-w-0 md:col-span-4">
        <FormField
          control={control}
          name={'state' as FieldPath<T>}
          render={({ field }) => (
            <FormItem>
              <OptionalLabel>UF</OptionalLabel>
              <FormControl>
                <Input
                  {...field}
                  maxLength={2}
                  className="w-full uppercase"
                  disabled={fieldDisabled}
                  onChange={(event) =>
                    field.onChange(
                      event.target.value
                        .replace(/[^a-zA-Z]/g, '')
                        .slice(0, 2)
                        .toLocaleUpperCase('pt-BR'),
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}
