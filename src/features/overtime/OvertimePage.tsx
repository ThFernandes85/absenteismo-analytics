import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { FullPageSpinner } from '@/components/ui/Spinner'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useOccurrencesByDateRange } from '@/features/occurrences/api'
import { usePositionOvertimeRates } from './ratesApi'
import { PeriodFilter } from '@/features/dashboard/PeriodFilter'
import { PERIOD_LABELS, resolvePeriod, type PeriodPreset } from '@/features/dashboard/periods'

export function OvertimePage() {
  const [preset, setPreset] = useState<PeriodPreset>('mes')
  const [customStart, setCustomStart] = useState(dayjs().startOf('month').format('YYYY-MM-DD'))
  const [customEnd, setCustomEnd] = useState(dayjs().format('YYYY-MM-DD'))
  const { start, end } = resolvePeriod(preset, customStart, customEnd)

  const { data: occurrences, isLoading: loadingOccurrences } = useOccurrencesByDateRange(start, end)
  const { data: rates, isLoading: loadingRates } = usePositionOvertimeRates()

  const rateByPosition = useMemo(() => {
    const map = new Map<string, { rate_50: number; rate_100: number }>()
    rates?.forEach((r) => map.set(r.position, { rate_50: r.rate_50, rate_100: r.rate_100 }))
    return map
  }, [rates])

  const overtimeLaunches = useMemo(
    () => (occurrences ?? []).filter((o) => o.type === 'hora_extra'),
    [occurrences],
  )

  const byEmployee = useMemo(() => {
    const map = new Map<
      string,
      { name: string; position: string; hours: number; value: number; launches: number; missingRate: boolean }
    >()
    overtimeLaunches.forEach((o) => {
      const hours = o.hours ?? 0
      const positionRates = rateByPosition.get(o.employees.position)
      const rate = o.overtime_percentage === '100' ? positionRates?.rate_100 ?? 0 : positionRates?.rate_50 ?? 0
      const value = hours * rate
      const entry =
        map.get(o.employee_id) ??
        { name: o.employees.full_name, position: o.employees.position, hours: 0, value: 0, launches: 0, missingRate: false }
      entry.hours += hours
      entry.value += value
      entry.launches += 1
      if (rate === 0) entry.missingRate = true
      map.set(o.employee_id, entry)
    })
    return Array.from(map.values()).sort((a, b) => b.hours - a.hours)
  }, [overtimeLaunches, rateByPosition])

  const totalHours = byEmployee.reduce((sum, e) => sum + e.hours, 0)
  const totalValue = byEmployee.reduce((sum, e) => sum + e.value, 0)
  const missingRate = byEmployee.some((e) => e.missingRate)

  const launchDetails = useMemo(() => {
    return overtimeLaunches
      .map((o) => {
        const hours = o.hours ?? 0
        const positionRates = rateByPosition.get(o.employees.position)
        const rate = o.overtime_percentage === '100' ? positionRates?.rate_100 ?? 0 : positionRates?.rate_50 ?? 0
        return {
          id: o.id,
          date: o.occurrence_date,
          name: o.employees.full_name,
          percentage: o.overtime_percentage,
          hours,
          value: hours * rate,
        }
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1))
  }, [overtimeLaunches, rateByPosition])

  const isLoading = loadingOccurrences || loadingRates

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Horas Extras</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Horas extras lançadas por colaborador e o saldo estimado no período.
        </p>
      </div>

      <Card>
        <CardContent className="pt-4">
          <PeriodFilter
            preset={preset}
            onPresetChange={setPreset}
            customStart={customStart}
            customEnd={customEnd}
            onCustomStartChange={setCustomStart}
            onCustomEndChange={setCustomEnd}
          />
        </CardContent>
      </Card>

      {isLoading ? (
        <FullPageSpinner />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-[var(--color-text-muted)]">Total de Horas — {PERIOD_LABELS[preset]}</p>
                <p className="text-2xl font-semibold text-violet-600 dark:text-violet-400">
                  {totalHours.toFixed(1)}h
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-[var(--color-text-muted)]">Colaboradores com Hora Extra</p>
                <p className="text-2xl font-semibold">{byEmployee.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-[var(--color-text-muted)]">Saldo do Período</p>
                <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(totalValue)}
                </p>
                {missingRate && (
                  <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">
                    Alguns cargos ainda não têm valor de hora extra configurado em{' '}
                    <Link to="/configuracoes" className="underline">
                      Configurações
                    </Link>
                    .
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Horas Extras por Colaborador — {PERIOD_LABELS[preset]}</CardTitle>
            </CardHeader>
            <CardContent>
              {byEmployee.length === 0 ? (
                <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">
                  Nenhuma hora extra lançada no período selecionado.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-text-muted)]">
                        <th className="py-2 font-medium">Colaborador</th>
                        <th className="py-2 font-medium">Função</th>
                        <th className="py-2 font-medium">Lançamentos</th>
                        <th className="py-2 font-medium">Total de Horas</th>
                        <th className="py-2 font-medium">Valor (R$)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byEmployee.map((e) => (
                        <tr key={e.name} className="border-b border-[var(--color-border)] last:border-0">
                          <td className="py-2 font-medium">{e.name}</td>
                          <td className="py-2 text-[var(--color-text-muted)]">{e.position}</td>
                          <td className="py-2 text-[var(--color-text-muted)]">{e.launches}</td>
                          <td className="py-2">{e.hours.toFixed(1)}h</td>
                          <td className="py-2">
                            {formatCurrency(e.value)}
                            {e.missingRate && (
                              <span className="ml-1 text-[11px] text-amber-600 dark:text-amber-400">
                                (sem valor de hora configurado)
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-[var(--color-border)] font-semibold">
                        <td className="py-2">Total</td>
                        <td className="py-2" />
                        <td className="py-2" />
                        <td className="py-2">{totalHours.toFixed(1)}h</td>
                        <td className="py-2">{formatCurrency(totalValue)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lançamentos de Hora Extra — {PERIOD_LABELS[preset]}</CardTitle>
            </CardHeader>
            <CardContent>
              {launchDetails.length === 0 ? (
                <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">
                  Nenhuma hora extra lançada no período selecionado.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-text-muted)]">
                        <th className="py-2 font-medium">Data</th>
                        <th className="py-2 font-medium">Colaborador</th>
                        <th className="py-2 font-medium">Percentual</th>
                        <th className="py-2 font-medium">Horas</th>
                        <th className="py-2 font-medium">Valor (R$)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {launchDetails.map((l) => (
                        <tr key={l.id} className="border-b border-[var(--color-border)] last:border-0">
                          <td className="py-2">{formatDate(l.date)}</td>
                          <td className="py-2 font-medium">{l.name}</td>
                          <td className="py-2 text-[var(--color-text-muted)]">
                            {l.percentage ? `${l.percentage}%` : '—'}
                          </td>
                          <td className="py-2">{l.hours.toFixed(1)}h</td>
                          <td className="py-2">{formatCurrency(l.value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
