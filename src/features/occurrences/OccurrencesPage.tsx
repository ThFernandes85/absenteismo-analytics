import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { FullPageSpinner } from '@/components/ui/Spinner'
import { formatDate, formatDateTime } from '@/lib/utils'
import { OCCURRENCE_COLORS, OCCURRENCE_ICONS, OCCURRENCE_LABELS } from '@/lib/constants'
import { isScheduledWorkDay } from '@/lib/schedule'
import { useEmployees } from '@/features/employees/api'
import { PendingAttendanceCard } from '@/features/dashboard/PendingAttendanceCard'
import { PeriodFilter } from '@/features/dashboard/PeriodFilter'
import { PERIOD_LABELS, resolvePeriod, type PeriodPreset } from '@/features/dashboard/periods'
import { useActiveLeaveToday, useDeleteOccurrence, useOccurrencesByDate, useOccurrencesByDateRange } from './api'
import { OccurrenceForm } from './OccurrenceForm'
import { AttachmentList } from './AttachmentList'
import { DailyAttendanceCard } from './DailyAttendanceCard'

export function OccurrencesPage() {
  const { data: allEmployees, isLoading: loadingEmployees } = useEmployees('all')
  const employees = allEmployees?.filter((e) => e.status !== 'inativo')

  const [preset, setPreset] = useState<PeriodPreset>('30dias')
  const [customStart, setCustomStart] = useState(dayjs().subtract(30, 'day').format('YYYY-MM-DD'))
  const [customEnd, setCustomEnd] = useState(dayjs().format('YYYY-MM-DD'))
  const { start, end } = resolvePeriod(preset, customStart, customEnd)

  const today = dayjs().format('YYYY-MM-DD')
  const { data: recentOccurrences, isLoading: loadingOccurrences } = useOccurrencesByDateRange(start, end)
  // Independente do período escolhido para a listagem: pendências de hoje
  // sempre olham para hoje, não para o filtro selecionado.
  const { data: todayOccurrences } = useOccurrencesByDate(today)
  const { data: activeLeaveToday } = useActiveLeaveToday()
  const deleteOccurrence = useDeleteOccurrence()
  const [prefillEmployeeId, setPrefillEmployeeId] = useState<string>()

  const pendingEmployees = useMemo(() => {
    const loggedTodayIds = new Set((todayOccurrences ?? []).map((o) => o.employee_id))
    const onLeaveIds = new Set((activeLeaveToday ?? []).map((o) => o.employee_id))
    return (allEmployees ?? []).filter(
      (e) =>
        e.status === 'ativo' &&
        !loggedTodayIds.has(e.id) &&
        !onLeaveIds.has(e.id) &&
        isScheduledWorkDay(e, today),
    )
  }, [allEmployees, todayOccurrences, activeLeaveToday, today])

  async function handleDelete(id: string) {
    if (!confirm('Remover este lançamento?')) return
    try {
      await deleteOccurrence.mutateAsync(id)
      toast.success('Lançamento removido.')
    } catch {
      toast.error('Erro ao remover lançamento.')
    }
  }

  if (loadingEmployees) return <FullPageSpinner />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Ocorrências</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Lance presenças, faltas, atestados, declarações e horas extras.
        </p>
      </div>

      <PendingAttendanceCard
        pendingEmployees={pendingEmployees}
        onSelectEmployee={(e) => setPrefillEmployeeId(e.id)}
      />

      <DailyAttendanceCard />

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Novo Lançamento</CardTitle>
          </CardHeader>
          <CardContent>
            <OccurrenceForm employees={employees ?? []} prefillEmployeeId={prefillEmployeeId} />
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Lançamentos — {PERIOD_LABELS[preset]}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <PeriodFilter
                preset={preset}
                onPresetChange={setPreset}
                customStart={customStart}
                customEnd={customEnd}
                onCustomStartChange={setCustomStart}
                onCustomEndChange={setCustomEnd}
              />
            </div>
            {loadingOccurrences ? (
              <FullPageSpinner />
            ) : (
              <ul className="space-y-3">
                {recentOccurrences?.map((o) => (
                  <li key={o.id} className="flex items-start gap-3 border-b border-[var(--color-border)] pb-3 last:border-0">
                    <span
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${OCCURRENCE_COLORS[o.type]}`}
                    >
                      {OCCURRENCE_ICONS[o.type]}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        <Link to={`/funcionarios/${o.employee_id}`} className="hover:underline">
                          {o.employees.full_name}
                        </Link>{' '}
                        — {OCCURRENCE_LABELS[o.type]}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {formatDate(o.occurrence_date)}
                        {o.end_date ? ` a ${formatDate(o.end_date)} (${o.days_count} dia(s))` : ''}
                        {o.notes ? ` · ${o.notes}` : ''}
                      </p>
                      <p className="text-[11px] text-[var(--color-text-muted)]">
                        Lançado em {formatDateTime(o.created_at)}
                      </p>
                      <AttachmentList occurrenceId={o.id} />
                    </div>
                    <button
                      onClick={() => handleDelete(o.id)}
                      className="rounded-md p-1.5 text-[var(--color-text-muted)] hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 cursor-pointer"
                      title="Remover"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
                {recentOccurrences?.length === 0 && (
                  <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">
                    Nenhum lançamento no período selecionado.
                  </p>
                )}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
