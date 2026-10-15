import {
  CalendarCheckIcon,
  CircleCheckIcon,
  ClipboardListIcon,
  MonitorIcon,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAuth } from '@/contexts/AuthContext'
import {
  getApiErrorMessage,
  getDashboardMetrics,
  type DashboardMetrics,
} from '@/services/dashboardService'

const numberFormatter = new Intl.NumberFormat('pt-BR')
const hourFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 1,
})
const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const chartConfig = {
  abertas: {
    label: 'Abertas',
    color: 'var(--chart-2)',
  },
  finalizadas: {
    label: 'Finalizadas',
    color: 'var(--foreground)',
  },
} satisfies ChartConfig

const statusLabels: Record<string, string> = {
  ABERTA: 'Aberta',
  ORCAMENTO: 'Orçamento',
  FINALIZADA: 'Finalizada',
  CANCELADA: 'Cancelada',
}

const statusBadgeClass: Record<string, string> = {
  ABERTA:
    'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  ORCAMENTO:
    'border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300',
  FINALIZADA:
    'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  CANCELADA: 'border-destructive/20 bg-destructive/10 text-destructive',
}

const kpis: {
  key: keyof Pick<
    DashboardMetrics,
    'openOrders' | 'completedOS' | 'totalEquipments' | 'finishedOrdersThisMonth'
  >
  label: string
  hint: string
  icon: LucideIcon
}[] = [
  {
    key: 'openOrders',
    label: 'Ordens abertas',
    hint: 'Aguardando atendimento',
    icon: ClipboardListIcon,
  },
  {
    key: 'completedOS',
    label: 'OS concluídas',
    hint: 'Total histórico',
    icon: CircleCheckIcon,
  },
  {
    key: 'totalEquipments',
    label: 'Equipamentos',
    hint: 'Cadastrados na base',
    icon: MonitorIcon,
  },
  {
    key: 'finishedOrdersThisMonth',
    label: 'Finalizadas no mês',
    hint: 'Encerradas neste mês',
    icon: CalendarCheckIcon,
  },
]

function formatResolutionTime(hours: number) {
  if (!Number.isFinite(hours)) return '—'

  if (hours > 0 && hours < 1) {
    return `${Math.round(hours * 60)} min`
  }

  return `${hourFormatter.format(hours)} h`
}

function formatUpdatedAt(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '—'

  return dateTimeFormatter.format(date)
}

function statusLabel(status: string) {
  return (
    statusLabels[status] ??
    status.replaceAll('_', ' ').toLocaleLowerCase('pt-BR')
  )
}

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string
  value: number
  hint: string
  icon: LucideIcon
}) {
  return (
    <Card className="gap-3 py-5 shadow-none">
      <CardHeader className="px-5">
        <CardDescription className="text-xs font-medium">{label}</CardDescription>
        <div className="flex items-end justify-between gap-3">
          <CardTitle className="text-3xl font-semibold tracking-tight tabular-nums">
            {numberFormatter.format(value)}
          </CardTitle>
          <span className="mb-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
            <Icon className="size-4" strokeWidth={1.75} />
          </span>
        </div>
      </CardHeader>
      <CardContent className="px-5">
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  )
}

function KpiSkeleton() {
  return (
    <Card className="gap-3 py-5 shadow-none">
      <CardHeader className="px-5">
        <Skeleton className="h-3 w-24" />
        <div className="flex items-end justify-between gap-3">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="size-8 rounded-lg" />
        </div>
      </CardHeader>
      <CardContent className="px-5">
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  )
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-live="polite">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiSkeleton key={kpi.key} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="py-5 shadow-none lg:col-span-2">
          <CardHeader className="px-5">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-56" />
          </CardHeader>
          <CardContent className="px-5">
            <Skeleton className="h-[260px] w-full rounded-lg" />
          </CardContent>
        </Card>
        <Card className="py-5 shadow-none">
          <CardHeader className="px-5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-48" />
          </CardHeader>
          <CardContent className="flex flex-col gap-4 px-5">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="flex items-center justify-between gap-3">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-3.5 w-12" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card className="py-5 shadow-none">
        <CardHeader className="px-5">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-64" />
        </CardHeader>
        <CardContent className="px-5">
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-8 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function DashboardPage() {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let ignore = false

    setIsLoading(true)
    setError(null)

    getDashboardMetrics()
      .then((data) => {
        if (!ignore) setMetrics(data)
      })
      .catch((loadError: unknown) => {
        if (ignore) return

        const message = getApiErrorMessage(
          loadError,
          'Não foi possível carregar o painel.',
        )
        setMetrics(null)
        setError(message)
        toast.error(message)
      })
      .finally(() => {
        if (!ignore) setIsLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [reloadKey])

  const firstName = user?.name?.trim().split(/\s+/)[0]

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <p className="text-[0.68rem] font-medium tracking-[0.2em] text-muted-foreground uppercase">
          Painel
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-balance">
          {firstName ? `Olá, ${firstName}` : 'Visão geral'}
        </h1>
        <p className="text-sm text-muted-foreground">
          Ordens, equipamentos e desempenho da equipe.
        </p>
      </header>

      {isLoading ? <DashboardSkeleton /> : null}

      {!isLoading && error ? (
        <Card className="py-5 shadow-none">
          <CardHeader className="px-5">
            <CardTitle className="text-base">
              Não foi possível carregar o painel
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="px-5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReloadKey((current) => current + 1)}
            >
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && metrics ? (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((kpi) => (
              <KpiCard
                key={kpi.key}
                label={kpi.label}
                value={metrics[kpi.key]}
                hint={kpi.hint}
                icon={kpi.icon}
              />
            ))}
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="py-5 shadow-none lg:col-span-2">
              <CardHeader className="px-5">
                <CardTitle className="text-base tracking-tight">
                  Ordens por mês
                </CardTitle>
                <CardDescription>
                  Comparativo de OS abertas e finalizadas.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-5">
                {metrics.chartData.length === 0 ? (
                  <p className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                    Sem dados para o período.
                  </p>
                ) : (
                  <ChartContainer
                    config={chartConfig}
                    className="aspect-auto h-[280px] w-full"
                  >
                    <BarChart
                      accessibilityLayer
                      data={metrics.chartData}
                      margin={{ top: 8, right: 4, left: -12, bottom: 0 }}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        width={36}
                        allowDecimals={false}
                      />
                      <ChartTooltip
                        content={<ChartTooltipContent indicator="dot" />}
                      />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar
                        dataKey="abertas"
                        fill="var(--color-abertas)"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={28}
                      />
                      <Bar
                        dataKey="finalizadas"
                        fill="var(--color-finalizadas)"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={28}
                      />
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card className="py-5 shadow-none">
              <CardHeader className="px-5">
                <CardTitle className="text-base tracking-tight">
                  Desempenho da equipe
                </CardTitle>
                <CardDescription>
                  OS finalizadas e tempo médio de resolução.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col px-5">
                {metrics.techMetrics.length === 0 ? (
                  <p className="flex flex-1 items-center justify-center py-10 text-center text-sm text-muted-foreground">
                    Nenhuma OS finalizada para calcular o desempenho.
                  </p>
                ) : (
                  <ul className="flex max-h-80 flex-col divide-y divide-border overflow-y-auto">
                    {metrics.techMetrics.map((tech) => (
                      <li
                        key={tech.name}
                        className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium tracking-tight">
                            {tech.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {tech.osCount === 1
                              ? '1 OS'
                              : `${numberFormatter.format(tech.osCount)} OS`}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-medium tracking-tight tabular-nums">
                            {formatResolutionTime(tech.avgResolutionTimeHours)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            tempo médio
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </section>

          <Card className="py-5 shadow-none">
            <CardHeader className="px-5">
              <CardTitle className="text-base tracking-tight">
                Atividade recente
              </CardTitle>
              <CardDescription>
                Últimas atualizações de ordens de serviço.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-2 sm:px-5">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="px-3 text-xs font-medium tracking-wide text-muted-foreground">
                      OS
                    </TableHead>
                    <TableHead className="px-3 text-xs font-medium tracking-wide text-muted-foreground">
                      Cliente
                    </TableHead>
                    <TableHead className="hidden px-3 text-xs font-medium tracking-wide text-muted-foreground md:table-cell">
                      Equipamento
                    </TableHead>
                    <TableHead className="px-3 text-xs font-medium tracking-wide text-muted-foreground">
                      Status
                    </TableHead>
                    <TableHead className="hidden px-3 text-right text-xs font-medium tracking-wide text-muted-foreground sm:table-cell">
                      Atualização
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.recentActivities.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={5}
                        className="px-3 py-12 text-center text-sm text-muted-foreground"
                      >
                        Nenhuma atividade recente.
                      </TableCell>
                    </TableRow>
                  ) : (
                    metrics.recentActivities.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell className="px-3 font-medium tabular-nums">
                          #{activity.number}
                        </TableCell>
                        <TableCell className="max-w-40 truncate px-3">
                          {activity.customer?.name || '—'}
                        </TableCell>
                        <TableCell className="hidden max-w-48 truncate px-3 text-muted-foreground md:table-cell">
                          {activity.equipment?.model?.name || '—'}
                        </TableCell>
                        <TableCell className="px-3">
                          <Badge
                            variant="outline"
                            className={statusBadgeClass[activity.status]}
                          >
                            {statusLabel(activity.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden px-3 text-right text-muted-foreground tabular-nums sm:table-cell">
                          {formatUpdatedAt(activity.updated_at)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
