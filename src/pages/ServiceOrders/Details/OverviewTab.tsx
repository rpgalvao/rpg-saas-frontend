import { CameraIcon, LoaderCircleIcon, Trash2Icon } from 'lucide-react'
import type { ChangeEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type {
  ServiceOrder,
  ServiceOrderImage,
  ServiceOrderImageTag,
} from '@/services/serviceOrderService'

import { formatDateTime, typeLabel } from '../presentation'

const IMAGE_TAGS: ServiceOrderImageTag[] = ['ANTES', 'DURANTE', 'DEPOIS']

type OverviewTabProps = {
  order: ServiceOrder
  uploadingTag: ServiceOrderImageTag | null
  onUpload: (event: ChangeEvent<HTMLInputElement>, tag: ServiceOrderImageTag) => void
  onRemoveImage: (image: ServiceOrderImage) => void
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}

export function OverviewTab({
  order,
  uploadingTag,
  onUpload,
  onRemoveImage,
}: OverviewTabProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="gap-4 py-5 shadow-none">
          <CardHeader className="px-5">
            <CardTitle className="text-sm tracking-tight">Equipamento</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 px-5">
            <MetaRow
              label="Número de série"
              value={order.equipment?.serial_number || '—'}
            />
            <MetaRow label="Modelo" value={order.equipment?.model?.name || 'N/A'} />
            <MetaRow label="Natureza do serviço" value={typeLabel(order.type)} />
          </CardContent>
        </Card>

        <Card className="gap-4 py-5 shadow-none">
          <CardHeader className="px-5">
            <CardTitle className="text-sm tracking-tight">Histórico de datas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 px-5">
            <MetaRow label="Abertura" value={formatDateTime(order.opened_at)} />
            <MetaRow label="Aberto por" value={order.openedBy?.name || 'Sistema'} />
            {order.closed_at ? (
              <>
                <div className="border-t border-border" />
                <MetaRow
                  label={order.status === 'CANCELADA' ? 'Cancelamento' : 'Finalização'}
                  value={formatDateTime(order.closed_at)}
                />
                <MetaRow
                  label="Responsável"
                  value={order.closedBy?.name || 'Sistema'}
                />
              </>
            ) : null}

            {order.events && order.events.length > 0 ? (
              <div className="mt-1 flex flex-col gap-3 border-t border-border pt-4">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Reaberturas anteriores
                </p>
                {order.events.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-lg border border-border bg-muted/30 px-3 py-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium">{event.action}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {formatDateTime(event.created_at)}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Por {event.user?.name || 'Sistema'}
                    </p>
                    {event.notes ? (
                      <p className="mt-2 border-l-2 border-border pl-2 text-sm text-muted-foreground italic">
                        “{event.notes}”
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card className="gap-3 py-5 shadow-none">
        <CardHeader className="px-5">
          <CardTitle className="text-sm tracking-tight">Relato do problema</CardTitle>
        </CardHeader>
        <CardContent className="px-5">
          <p className="text-sm leading-6 whitespace-pre-wrap">
            {order.problem_description}
          </p>
        </CardContent>
      </Card>

      {order.status === 'CANCELADA' && order.cancellation_reason ? (
        <Card className="gap-3 border-destructive/20 bg-destructive/5 py-5 shadow-none">
          <CardHeader className="px-5">
            <CardTitle className="text-sm tracking-tight text-destructive">
              Motivo do cancelamento
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5">
            <p className="text-sm leading-6 whitespace-pre-wrap">
              {order.cancellation_reason}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {order.status === 'FINALIZADA' && order.solution_description ? (
        <Card className="gap-3 border-emerald-500/20 bg-emerald-500/5 py-5 shadow-none">
          <CardHeader className="px-5">
            <CardTitle className="text-sm tracking-tight text-emerald-700 dark:text-emerald-300">
              Solução aplicada
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5">
            <p className="text-sm leading-6 whitespace-pre-wrap">
              {order.solution_description}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {order.status === 'FINALIZADA' && order.technical_notes ? (
        <Card className="gap-3 border-amber-500/20 bg-amber-500/5 py-5 shadow-none">
          <CardHeader className="px-5">
            <CardTitle className="text-sm tracking-tight text-amber-800 dark:text-amber-200">
              Observações técnicas
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5">
            <p className="text-sm leading-6 whitespace-pre-wrap">
              {order.technical_notes}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card className="gap-4 py-5 shadow-none">
        <CardHeader className="px-5">
          <CardTitle className="flex items-center gap-2 text-sm tracking-tight">
            <CameraIcon className="size-4" strokeWidth={1.75} />
            Evidências fotográficas
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 px-5 md:grid-cols-3">
          {IMAGE_TAGS.map((tag) => {
            const images = order.images?.filter((image) => image.tag === tag) ?? []
            const isUploading = uploadingTag === tag

            return (
              <div
                key={tag}
                className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-4"
              >
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {tag} da manutenção
                </p>

                <div className="flex min-h-16 flex-wrap gap-2">
                  {images.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">
                      Nenhuma foto anexada.
                    </p>
                  ) : (
                    images.map((image) => (
                      <div
                        key={image.id}
                        className="group relative size-24 overflow-hidden rounded-lg border border-border"
                      >
                        <img
                          src={image.url}
                          alt={`Evidência ${tag.toLocaleLowerCase('pt-BR')}`}
                          className="size-full object-cover"
                        />
                        <Button
                          type="button"
                          size="icon-xs"
                          variant="destructive"
                          className="absolute top-1 right-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                          aria-label="Apagar foto"
                          onClick={() => onRemoveImage(image)}
                        >
                          <Trash2Icon />
                        </Button>
                      </div>
                    ))
                  )}
                </div>

                <label
                  className={`mt-auto flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground ${isUploading ? 'pointer-events-none opacity-60' : ''}`}
                >
                  {isUploading ? (
                    <LoaderCircleIcon className="size-4 animate-spin" />
                  ) : (
                    <>
                      <CameraIcon className="size-4" strokeWidth={1.75} />
                      Adicionar foto
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    aria-label={`Adicionar foto ${tag.toLocaleLowerCase('pt-BR')}`}
                    disabled={isUploading}
                    onChange={(event) => onUpload(event, tag)}
                  />
                </label>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {order.client_signature ? (
        <Card className="gap-3 py-5 shadow-none">
          <CardHeader className="px-5">
            <CardTitle className="text-sm tracking-tight">
              Assinatura do cliente
              {order.signer_name ? ` · ${order.signer_name}` : ''}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5">
            <div className="inline-flex rounded-lg border border-border bg-white p-3">
              <img
                src={order.client_signature}
                alt="Assinatura do cliente"
                className="h-24 object-contain"
              />
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
