import { useMemo, useState, type CSSProperties } from 'react'
import dayjs from 'dayjs'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import { Building2 } from 'lucide-react'
import { FullPageSpinner } from '@/components/ui/Spinner'
import { ExportMenu } from '@/components/ui/ExportMenu'
import { formatDateTime } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useEmployees } from '@/features/employees/api'
import { useOccurrencesByDateRange } from '@/features/occurrences/api'
import { useCostCentersList } from '@/features/admin/costCentersApi'
import { useCompanySettings } from '@/features/admin/settingsApi'
import { ExecKpiCard } from './ExecKpiCard'
import {
  buildMonthlyTrend,
  buildMotivosBreakdown,
  buildUnitRollup,
  calculateLostDays,
  classifyUnit,
  countBusinessDays,
} from './aggregations'

const EXEC_THEME = {
  '--exec-bg': '#f4f5f7',
  '--exec-card': '#ffffff',
  '--exec-border': '#e6e8eb',
  '--exec-text': '#1c2024',
  '--exec-text-muted': '#6b7280',
  '--exec-text-faint': '#9199a3',
  '--exec-red': '#d63b2e',
  '--exec-orange': '#e8734a',
} as CSSProperties

function buildMonthOptions() {
  return Array.from({ length: 6 }, (_, i) => dayjs().subtract(5 - i, 'month').format('YYYY-MM')).reverse()
}

export function ExecutiveDashboardPage() {
  const { profile } = useAuth()
  const months = useMemo(buildMonthOptions, [])
  const [selectedMonth, setSelectedMonth] = useState(months[months.length - 1])
  const [selectedCostCenter, setSelectedCostCenter] = useState<string>('todos')

  const rangeStart = dayjs(months[0]).startOf('month').format('YYYY-MM-DD')
  const rangeEnd = dayjs().format('YYYY-MM-DD')

  const { data: employees, isLoading: loadingEmployees } = useEmployees('ativo')
  const { data: costCenters, isLoading: loadingCostCenters } = useCostCentersList()
  const { data: occurrences, isLoading: loadingOccurrences } = useOccurrencesByDateRange(rangeStart, rangeEnd)
  const { data: settings, isLoading: loadingSettings } = useCompanySettings()

  const loading = loadingEmployees || loadingCostCenters || loadingOccurrences || loadingSettings

  const meta = settings?.target_absenteeism_rate ?? 3
  const averageDailyCost = settings?.average_daily_cost ?? 0

  const monthStart = dayjs(selectedMonth).startOf('month').format('YYYY-MM-DD')
  const monthEndRaw = dayjs(selectedMonth).endOf('month')
  const monthEnd = (monthEndRaw.isAfter(dayjs()) ? dayjs() : monthEndRaw).format('YYYY-MM-DD')
  const businessDays = countBusinessDays(monthStart, monthEnd)

  const allEmployees = employees ?? []
  const allOccurrences = occurrences ?? []
  const allCostCenters = costCenters ?? []

  const monthOccurrences = useMemo(
    () => allOccurrences.filter((o) => dayjs(o.occurrence_date).isSame(selectedMonth, 'month')),
    [allOccurrences, selectedMonth],
  )

  const unitRollup = useMemo(
    () => buildUnitRollup(allCostCenters, allEmployees, monthOccurrences, businessDays),
    [allCostCenters, allEmployees, monthOccurrences, businessDays],
  )
  const unitRollupRanked = [...unitRollup].sort((a, b) => b.taxa - a.taxa)
  const maxTaxa = Math.max(...unitRollup.map((u) => u.taxa), meta) * 1.05 || 1

  const selectedUnit = unitRollup.find((u) => u.id === selectedCostCenter)
  const scopedEmployeesCount = selectedCostCenter === 'todos' ? allEmployees.length : (selectedUnit?.efetivo ?? 0)
  const scopedOccurrences = useMemo(
    () =>
      selectedCostCenter === 'todos'
        ? monthOccurrences
        : monthOccurrences.filter((o) => o.employees.cost_center_id === selectedCostCenter),
    [monthOccurrences, selectedCostCenter],
  )
  const diasPerdidos = calculateLostDays(scopedOccurrences)
  const taxaGeral = scopedEmployeesCount > 0 ? (diasPerdidos / (scopedEmployeesCount * businessDays)) * 100 : 0

  const previousMonth = dayjs(selectedMonth).subtract(1, 'month').format('YYYY-MM')
  const previousMonthOccurrences = useMemo(
    () =>
      allOccurrences.filter(
        (o) =>
          dayjs(o.occurrence_date).isSame(previousMonth, 'month') &&
          (selectedCostCenter === 'todos' || o.employees.cost_center_id === selectedCostCenter),
      ),
    [allOccurrences, previousMonth, selectedCostCenter],
  )
  const diasPerdidosAnterior = calculateLostDays(previousMonthOccurrences)
  const diasTrendPct =
    diasPerdidosAnterior > 0 ? ((diasPerdidos - diasPerdidosAnterior) / diasPerdidosAnterior) * 100 : 0

  const today = dayjs().format('YYYY-MM-DD')
  const ausentesHoje = allOccurrences.filter(
    (o) =>
      (selectedCostCenter === 'todos' || o.employees.cost_center_id === selectedCostCenter) &&
      // falta é sempre um único dia; atestado/férias são períodos, então
      // "hoje" pode cair em qualquer ponto entre occurrence_date e end_date.
      ((o.type === 'falta' && o.occurrence_date === today) ||
        (o.type === 'atestado' && o.occurrence_date <= today && (!o.end_date || o.end_date > today))),
  ).length

  const custoEstimado = diasPerdidos * averageDailyCost

  const trend = useMemo(
    () => buildMonthlyTrend(allOccurrences, allEmployees, months, selectedCostCenter),
    [allOccurrences, allEmployees, months, selectedCostCenter],
  )

  const motivos = useMemo(() => buildMotivosBreakdown(scopedOccurrences), [scopedOccurrences])

  const selectedLabel =
    selectedCostCenter === 'todos'
      ? 'Todos os centros de lucro'
      : (allCostCenters.find((cc) => cc.id === selectedCostCenter)?.name ?? '')

  if (loading) return <FullPageSpinner />

  return (
    <div style={EXEC_THEME} className="-m-6 min-h-[calc(100vh-3.5rem)] bg-[var(--exec-bg)] pb-12 font-[Inter,system-ui,sans-serif]">
      <div className="flex items-center justify-between border-b border-[var(--exec-border)] bg-[var(--exec-card)] px-10 py-5">
        <div className="flex items-center gap-3.5">
          <img src={`${import.meta.env.BASE_URL}sodexo-logo.png`} alt="Sodexo" className="h-7 w-auto" />
          <div className="h-8 w-px bg-[var(--exec-border)]" />
          <div>
            <div className="text-[15px] font-bold text-[var(--exec-text)]">People Analytics</div>
            <div className="text-xs text-[var(--exec-text-muted)]">Painel de Absenteísmo do Efetivo</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs font-semibold text-[var(--exec-text)]">Diretoria</div>
            <div className="text-[11px] text-[var(--exec-text-faint)]">Atualizado em {formatDateTime(new Date().toISOString())}</div>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--exec-bg)] text-[13px] font-bold text-[var(--exec-text-muted)]">
            {profile?.full_name?.slice(0, 2).toUpperCase()}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 px-10 pt-5">
        <div className="text-xs font-semibold tracking-wide text-[var(--exec-text-muted)] uppercase">Filtros</div>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="rounded-lg border border-[var(--exec-border)] bg-white px-3 py-2 text-[13px] font-medium text-[var(--exec-text)] cursor-pointer"
        >
          {[...months].reverse().map((m) => (
            <option key={m} value={m}>
              {dayjs(m).format('MMMM [de] YYYY')}
            </option>
          ))}
        </select>
        <select
          value={selectedCostCenter}
          onChange={(e) => setSelectedCostCenter(e.target.value)}
          className="min-w-[220px] rounded-lg border border-[var(--exec-border)] bg-white px-3 py-2 text-[13px] font-medium text-[var(--exec-text)] cursor-pointer"
        >
          <option value="todos">Todos os centros de lucro</option>
          {allCostCenters.map((cc) => (
            <option key={cc.id} value={cc.id}>
              {cc.code} — {cc.name}
            </option>
          ))}
        </select>
        <div className="ml-auto">
          <ExportMenu
            filename={`painel-executivo-${selectedMonth}`}
            title="Painel Executivo — Absenteísmo"
            columns={[
              { key: 'nome', header: 'Centro de Lucro' },
              { key: 'efetivo', header: 'Efetivo' },
              { key: 'ausentes', header: 'Ausentes' },
              { key: 'taxa', header: 'Taxa (%)' },
              { key: 'diasPerdidos', header: 'Dias Perdidos' },
              { key: 'statusLabel', header: 'Status' },
            ]}
            rows={unitRollupRanked.map((u) => ({
              nome: u.name,
              efetivo: u.efetivo,
              ausentes: u.ausentes,
              taxa: u.taxa.toFixed(1),
              diasPerdidos: u.diasPerdidos,
              statusLabel: classifyUnit(u.taxa, meta).statusLabel,
            }))}
          />
        </div>
      </div>

      <div className="px-10 pt-1.5 text-[12.5px] text-[var(--exec-text-muted)]">
        Exibindo: <strong className="text-[var(--exec-text)]">{selectedLabel}</strong> · Período:{' '}
        <strong className="text-[var(--exec-text)]">{dayjs(selectedMonth).format('MMMM [de] YYYY')}</strong>
      </div>

      <div className="grid grid-cols-4 gap-4 px-10 pt-5">
        <ExecKpiCard
          label="Taxa de Absenteísmo"
          value={`${taxaGeral.toFixed(1)}%`}
          trendLabel={taxaGeral > meta ? `▲ ${(taxaGeral - meta).toFixed(1)}pp` : `▼ ${(meta - taxaGeral).toFixed(1)}pp`}
          trendColor={taxaGeral > meta ? '#c0392b' : '#2e7d4f'}
          helper={`Meta: ${meta.toFixed(1)}% · ${taxaGeral > meta ? 'acima da meta' : 'dentro da meta'}`}
        />
        <ExecKpiCard
          label="Efetivo Ativo"
          value={scopedEmployeesCount.toLocaleString('pt-BR')}
          suffix="colaboradores"
          helper={`${ausentesHoje} ausentes hoje`}
        />
        <ExecKpiCard
          label="Dias Perdidos (mês)"
          value={diasPerdidos.toLocaleString('pt-BR')}
          trendLabel={diasPerdidosAnterior > 0 ? `${diasTrendPct >= 0 ? '▲' : '▼'} ${Math.abs(diasTrendPct).toFixed(1)}%` : undefined}
          trendColor={diasTrendPct > 0 ? '#c0392b' : '#2e7d4f'}
          helper="vs. mês anterior"
        />
        <ExecKpiCard
          label="Custo Estimado"
          value={custoEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          suffix="R$"
          helper="impacto de horas não trabalhadas"
        />
      </div>

      <div className="grid grid-cols-[1.5fr_1fr] items-stretch gap-4 px-10 pt-4">
        <div className="rounded-[14px] border border-[var(--exec-border)] bg-[var(--exec-card)] p-[22px]">
          <div className="mb-1.5 flex items-center justify-between">
            <div className="text-sm font-bold text-[var(--exec-text)]">Tendência mensal de absenteísmo</div>
            <div className="flex gap-3.5 text-[11.5px] text-[var(--exec-text-muted)]">
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--exec-red)]" />
                Taxa real
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-0.5 w-2.5 bg-[var(--exec-text-faint)]" />
                Meta
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 16, right: 16, left: -16, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9199a3' }} axisLine={{ stroke: '#e6e8eb' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9199a3' }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip formatter={(v) => `${v}%`} />
                <ReferenceLine y={meta} stroke="#9199a3" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="taxa" name="Taxa real" stroke="#d63b2e" strokeWidth={2.5} dot={{ r: 4, fill: '#fff', stroke: '#d63b2e', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col rounded-[14px] border border-[var(--exec-border)] bg-[var(--exec-card)] p-[22px]">
          <div className="mb-3.5 text-sm font-bold text-[var(--exec-text)]">Motivos de ausência</div>
          {motivos.length === 0 ? (
            <div className="flex flex-1 items-center justify-center text-xs text-[var(--exec-text-faint)]">
              Sem ausências no período selecionado.
            </div>
          ) : (
            <div className="flex flex-1 items-center gap-4">
              <div className="relative h-[130px] w-[130px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={motivos} dataKey="dias" nameKey="nome" innerRadius={40} outerRadius={65} stroke="#fff" strokeWidth={2}>
                      {motivos.map((m, i) => (
                        <Cell key={i} fill={m.cor} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n) => [`${v} dia(s)`, n]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-lg font-extrabold text-[var(--exec-text)]">{taxaGeral.toFixed(1)}%</div>
                  <div className="text-[10.5px] text-[var(--exec-text-faint)]">taxa média</div>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-2.5">
                {motivos.map((m) => (
                  <div key={m.nome} className="flex items-center justify-between text-[12.5px]">
                    <div className="flex items-center gap-2 text-[var(--exec-text-muted)]">
                      <span className="inline-block h-[9px] w-[9px] rounded-[2px]" style={{ background: m.cor }} />
                      {m.nome}
                    </div>
                    <div className="font-bold text-[var(--exec-text)]">{m.pct}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-10 pt-4">
        <div className="rounded-[14px] border border-[var(--exec-border)] bg-[var(--exec-card)] p-[22px]">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm font-bold text-[var(--exec-text)]">Comparativo por centro de lucro / unidade</div>
            <div className="text-xs text-[var(--exec-text-faint)]">Clique numa barra para filtrar</div>
          </div>
          <div className="flex flex-col gap-2.5">
            {unitRollupRanked.map((u) => {
              const { barColor } = classifyUnit(u.taxa, meta)
              return (
                <div
                  key={u.id}
                  onClick={() => setSelectedCostCenter((prev) => (prev === u.id ? 'todos' : u.id))}
                  className="grid cursor-pointer grid-cols-[220px_1fr_70px_90px] items-center gap-3.5 rounded-lg px-2.5 py-2 hover:bg-[var(--exec-bg)]"
                  style={{ background: u.id === selectedCostCenter ? '#fdf1ef' : 'transparent' }}
                >
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-semibold text-[var(--exec-text)]">
                    {u.name}
                  </div>
                  <div className="relative h-5 overflow-hidden rounded-md bg-[var(--exec-bg)]">
                    <div
                      className="h-full rounded-md"
                      style={{ width: `${Math.min(100, (u.taxa / maxTaxa) * 100)}%`, background: barColor }}
                    />
                  </div>
                  <div className="text-right text-[13.5px] font-extrabold text-[var(--exec-text)]">{u.taxa.toFixed(1)}%</div>
                  <div className="text-right text-xs font-bold" style={{ color: barColor }}>
                    {u.efetivo === 0 ? 'sem efetivo' : `${u.diasPerdidos} dia(s)`}
                  </div>
                </div>
              )
            })}
            {unitRollupRanked.length === 0 && (
              <p className="py-6 text-center text-sm text-[var(--exec-text-faint)]">Nenhum centro de lucro cadastrado.</p>
            )}
          </div>
        </div>
      </div>

      <div className="px-10 pt-4">
        <div className="overflow-x-auto rounded-[14px] border border-[var(--exec-border)] bg-[var(--exec-card)] p-[22px]">
          <div className="mb-3.5 text-sm font-bold text-[var(--exec-text)]">Detalhamento por centro de lucro</div>
          <table className="w-full min-w-[640px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[var(--exec-border)]">
                <th className="px-2.5 py-2 text-left text-[11.5px] font-semibold tracking-wide text-[var(--exec-text-muted)] uppercase">Centro de lucro</th>
                <th className="px-2.5 py-2 text-right text-[11.5px] font-semibold tracking-wide text-[var(--exec-text-muted)] uppercase">Efetivo</th>
                <th className="px-2.5 py-2 text-right text-[11.5px] font-semibold tracking-wide text-[var(--exec-text-muted)] uppercase">Ausentes</th>
                <th className="px-2.5 py-2 text-right text-[11.5px] font-semibold tracking-wide text-[var(--exec-text-muted)] uppercase">Taxa</th>
                <th className="px-2.5 py-2 text-right text-[11.5px] font-semibold tracking-wide text-[var(--exec-text-muted)] uppercase">Dias perdidos</th>
                <th className="px-2.5 py-2 text-right text-[11.5px] font-semibold tracking-wide text-[var(--exec-text-muted)] uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {unitRollup.map((u) => {
                const { statusLabel, statusBg, statusColor } = classifyUnit(u.taxa, meta)
                return (
                  <tr key={u.id} className="border-b border-[#f0f1f3] last:border-0">
                    <td className="px-2.5 py-2.5 font-semibold text-[var(--exec-text)]">{u.name}</td>
                    <td className="px-2.5 py-2.5 text-right text-[var(--exec-text-muted)]">{u.efetivo}</td>
                    <td className="px-2.5 py-2.5 text-right text-[var(--exec-text-muted)]">{u.ausentes}</td>
                    <td className="px-2.5 py-2.5 text-right font-bold text-[var(--exec-text)]">{u.taxa.toFixed(1)}%</td>
                    <td className="px-2.5 py-2.5 text-right text-[var(--exec-text-muted)]">{u.diasPerdidos}</td>
                    <td className="px-2.5 py-2.5 text-right">
                      <span
                        className="rounded-full px-2.5 py-[3px] text-[11.5px] font-bold"
                        style={{ background: statusBg, color: statusColor }}
                      >
                        {statusLabel}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {unitRollup.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-2.5 py-8 text-center text-[var(--exec-text-faint)]">
                    <div className="flex flex-col items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Nenhum dado disponível para o período selecionado.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
