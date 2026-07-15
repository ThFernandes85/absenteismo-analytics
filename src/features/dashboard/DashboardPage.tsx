import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { UserCheck, UserX, Stethoscope, FileText, Clock, Users, Palmtree } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Label } from '@/components/ui/Input'
import { FullPageSpinner } from '@/components/ui/Spinner'
import { ExportMenu } from '@/components/ui/ExportMenu'
import { CHART_PALETTE, OCCURRENCE_LABELS } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { useCostCenters, useEmployees } from '@/features/employees/api'
import { useActiveLeaveToday, useOccurrencesByDate, useOccurrencesByDateRange } from '@/features/occurrences/api'
import { KpiCard } from './KpiCard'
import { HoursImpactCard } from './HoursImpactCard'
import { PendingAttendanceCard } from './PendingAttendanceCard'
import { PeriodFilter } from './PeriodFilter'
import { resolvePeriod, type PeriodPreset } from './periods'
import {
  calculateLostHours,
  calculateOvertimeHours,
  groupByCostCenter,
  groupByDimension,
  groupByType,
  groupOverTime,
} from './aggregations'

export function DashboardPage() {
  const [preset, setPreset] = useState<PeriodPreset>('30dias')
  const [customStart, setCustomStart] = useState(dayjs().subtract(30, 'day').format('YYYY-MM-DD'))
  const [customEnd, setCustomEnd] = useState(dayjs().format('YYYY-MM-DD'))
  const [costCenterFilter, setCostCenterFilter] = useState('all')
  const { start, end } = resolvePeriod(preset, customStart, customEnd)

  const today = dayjs().format('YYYY-MM-DD')
  const { data: costCenters } = useCostCenters()
  const { data: allActiveEmployees, isLoading: loadingEmployees } = useEmployees('ativo')
  const { data: allTodayOccurrences, isLoading: loadingToday } = useOccurrencesByDate(today)
  const { data: allPeriodOccurrences, isLoading: loadingPeriod } = useOccurrencesByDateRange(start, end)
  const { data: activeLeaveToday } = useActiveLeaveToday()

  const activeEmployees = useMemo(
    () =>
      costCenterFilter === 'all'
        ? allActiveEmployees
        : allActiveEmployees?.filter((e) => e.cost_center_id === costCenterFilter),
    [allActiveEmployees, costCenterFilter],
  )
  const todayOccurrences = useMemo(
    () =>
      costCenterFilter === 'all'
        ? allTodayOccurrences
        : allTodayOccurrences?.filter((o) => o.employees.cost_center_id === costCenterFilter),
    [allTodayOccurrences, costCenterFilter],
  )
  const periodOccurrences = useMemo(
    () =>
      costCenterFilter === 'all'
        ? allPeriodOccurrences
        : allPeriodOccurrences?.filter((o) => o.employees.cost_center_id === costCenterFilter),
    [allPeriodOccurrences, costCenterFilter],
  )

  const pendingEmployees = useMemo(() => {
    const loggedTodayIds = new Set((allTodayOccurrences ?? []).map((o) => o.employee_id))
    const onLeaveIds = new Set((activeLeaveToday ?? []).map((o) => o.employee_id))
    return (activeEmployees ?? []).filter((e) => !loggedTodayIds.has(e.id) && !onLeaveIds.has(e.id))
  }, [activeEmployees, allTodayOccurrences, activeLeaveToday])

  const todayCounts = useMemo(() => {
    const counts = { presenca: 0, falta: 0, atestado: 0, declaracao: 0, hora_extra: 0, ferias: 0 }
    todayOccurrences?.forEach((o) => {
      counts[o.type] += 1
    })
    return counts
  }, [todayOccurrences])

  // Férias e atestado são períodos: alguém pode estar "de férias hoje" mesmo
  // que o lançamento tenha ocorrence_date de um dia anterior. Por isso esses
  // dois contadores vêm de activeLeaveToday (que checa o período inteiro),
  // não de todayCounts (que só olha ocorrências com data exatamente hoje).
  const activeLeaveCounts = useMemo(() => {
    const counts = { ferias: 0, atestado: 0 }
    ;(activeLeaveToday ?? [])
      .filter((o) => costCenterFilter === 'all' || o.employees.cost_center_id === costCenterFilter)
      .forEach((o) => {
        counts[o.type as 'ferias' | 'atestado'] += 1
      })
    return counts
  }, [activeLeaveToday, costCenterFilter])

  const lostHours = useMemo(() => calculateLostHours(periodOccurrences ?? []), [periodOccurrences])
  const overtimeHours = useMemo(() => calculateOvertimeHours(periodOccurrences ?? []), [periodOccurrences])
  const byDepartment = useMemo(() => groupByDimension(periodOccurrences ?? [], 'department'), [periodOccurrences])
  const byPosition = useMemo(() => groupByDimension(periodOccurrences ?? [], 'position'), [periodOccurrences])
  const byEmployee = useMemo(
    () => groupByDimension(periodOccurrences ?? [], 'full_name').slice(0, 10),
    [periodOccurrences],
  )
  const byCostCenter = useMemo(
    () => groupByCostCenter(allPeriodOccurrences ?? [], costCenters ?? []),
    [allPeriodOccurrences, costCenters],
  )
  const byType = useMemo(() => groupByType(periodOccurrences ?? []), [periodOccurrences])
  const overTime = useMemo(() => groupOverTime(periodOccurrences ?? [], start, end), [periodOccurrences, start, end])

  if (loadingEmployees || loadingToday) return <FullPageSpinner />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Dashboard</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Visão geral do absenteísmo</p>
        </div>
        <ExportMenu
          filename={`relatorio-absenteismo-${start}-a-${end}`}
          title="Relatório de Absenteísmo"
          columns={[
            { key: 'date', header: 'Data' },
            { key: 'employee', header: 'Funcionário' },
            { key: 'costCenter', header: 'Centro de Lucro' },
            { key: 'department', header: 'Setor' },
            { key: 'position', header: 'Cargo' },
            { key: 'type', header: 'Tipo' },
            { key: 'details', header: 'Detalhes' },
          ]}
          rows={(periodOccurrences ?? []).map((o) => ({
            date: formatDate(o.occurrence_date),
            employee: o.employees.full_name,
            costCenter: costCenters?.find((cc) => cc.id === o.employees.cost_center_id)?.name ?? '—',
            department: o.employees.department,
            position: o.employees.position,
            type: OCCURRENCE_LABELS[o.type],
            details: o.reason || o.notes || (o.days_count ? `${o.days_count} dia(s)` : '') || '',
          }))}
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <KpiCard icon={Users} label="Ativos" value={activeEmployees?.length ?? 0} colorClass="bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400" />
        <KpiCard icon={UserCheck} label="Presentes Hoje" value={todayCounts.presenca} colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" />
        <KpiCard icon={UserX} label="Faltas Hoje" value={todayCounts.falta} colorClass="bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400" />
        <KpiCard icon={Stethoscope} label="Atestados Hoje" value={activeLeaveCounts.atestado} colorClass="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" />
        <KpiCard icon={FileText} label="Declarações Hoje" value={todayCounts.declaracao} colorClass="bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400" />
        <KpiCard icon={Clock} label="Horas Extras Hoje" value={todayCounts.hora_extra} colorClass="bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400" />
        <KpiCard icon={Palmtree} label="De Férias Hoje" value={activeLeaveCounts.ferias} colorClass="bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400" />
      </div>

      <PendingAttendanceCard pendingEmployees={pendingEmployees} />

      <Card>
        <CardContent className="space-y-4">
          <div className="max-w-xs">
            <Label htmlFor="cost-center-filter">Centro de Lucro</Label>
            <Select
              id="cost-center-filter"
              value={costCenterFilter}
              onChange={(e) => setCostCenterFilter(e.target.value)}
            >
              <option value="all">Todos os centros de lucro</option>
              {costCenters?.map((cc) => (
                <option key={cc.id} value={cc.id}>
                  {cc.code} — {cc.name}
                </option>
              ))}
            </Select>
          </div>
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

      {loadingPeriod ? (
        <FullPageSpinner />
      ) : (
        <>
          <HoursImpactCard lostHours={lostHours} overtimeHours={overtimeHours} />

          <Card>
            <CardHeader>
              <CardTitle>Absenteísmo ao Longo do Tempo</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={overTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" name="Faltas + Atestados" stroke={CHART_PALETTE[0]} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Absenteísmo por Centro de Lucro</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byCostCenter}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="total" name="Ocorrências" fill={CHART_PALETTE[5]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Absenteísmo por Setor</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byDepartment}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="total" name="Ocorrências" fill={CHART_PALETTE[1]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Absenteísmo por Cargo</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byPosition}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="total" name="Ocorrências" fill={CHART_PALETTE[2]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ranking de Colaboradores</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byEmployee} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="total" name="Ocorrências" fill={CHART_PALETTE[3]} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ranking de Setores</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byDepartment} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="total" name="Ocorrências" fill={CHART_PALETTE[4]} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Tipo de Ocorrência</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byType} dataKey="total" nameKey="name" outerRadius={100} label>
                    {byType.map((_, index) => (
                      <Cell key={index} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
