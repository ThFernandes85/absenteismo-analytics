import dayjs from 'dayjs'
import { sumExpectedWorkDays } from '@/lib/schedule'
import type { CostCenter, Employee, Occurrence } from '@/types/database.types'

type OccurrenceWithEmployee = Occurrence & {
  employees: { full_name: string; department: string; position: string; cost_center_id: string }
}

const ABSENCE_TYPES = ['falta', 'atestado'] as const

export function calculateLostDays(occurrences: Occurrence[]) {
  return occurrences.reduce((total, o) => {
    if (o.type === 'falta') return total + 1
    if (o.type === 'atestado') return total + (o.days_count ?? 0)
    return total
  }, 0)
}

export interface UnitRollup {
  id: string
  code: string
  name: string
  efetivo: number
  ausentes: number
  diasPerdidos: number
  taxa: number
}

export function buildUnitRollup(
  costCenters: CostCenter[],
  employees: Employee[],
  occurrences: OccurrenceWithEmployee[],
  periodStart: string,
  periodEnd: string,
): UnitRollup[] {
  return costCenters.map((cc) => {
    const unitEmployees = employees.filter((e) => e.cost_center_id === cc.id)
    const unitOccurrences = occurrences.filter(
      (o) => o.employees.cost_center_id === cc.id && ABSENCE_TYPES.includes(o.type as (typeof ABSENCE_TYPES)[number]),
    )
    const diasPerdidos = calculateLostDays(unitOccurrences)
    const efetivo = unitEmployees.length
    const expectedWorkDays = sumExpectedWorkDays(unitEmployees, periodStart, periodEnd)
    const taxa = expectedWorkDays > 0 ? (diasPerdidos / expectedWorkDays) * 100 : 0
    return {
      id: cc.id,
      code: cc.code,
      name: cc.name,
      efetivo,
      ausentes: unitOccurrences.length,
      diasPerdidos,
      taxa,
    }
  })
}

export interface MonthlyTrendPoint {
  label: string
  taxa: number
}

export function buildMonthlyTrend(
  occurrences: OccurrenceWithEmployee[],
  employees: Employee[],
  months: string[],
  costCenterId: string | 'todos',
): MonthlyTrendPoint[] {
  const scopedEmployees =
    costCenterId === 'todos' ? employees : employees.filter((e) => e.cost_center_id === costCenterId)

  return months.map((month) => {
    const start = dayjs(month).startOf('month').format('YYYY-MM-DD')
    const end = dayjs(month).endOf('month').format('YYYY-MM-DD')
    const expectedWorkDays = sumExpectedWorkDays(scopedEmployees, start, end)

    const monthOccurrences = occurrences.filter((o) => {
      if (!dayjs(o.occurrence_date).isSame(month, 'month')) return false
      if (!ABSENCE_TYPES.includes(o.type as (typeof ABSENCE_TYPES)[number])) return false
      return costCenterId === 'todos' || o.employees.cost_center_id === costCenterId
    })

    const diasPerdidos = calculateLostDays(monthOccurrences)
    const taxa = expectedWorkDays > 0 ? (diasPerdidos / expectedWorkDays) * 100 : 0
    return { label: dayjs(month).format('MMM/YY'), taxa: Number(taxa.toFixed(1)) }
  })
}

export function classifyUnit(taxa: number, meta: number) {
  if (taxa > meta + 1) {
    return { statusLabel: 'Crítico', statusBg: '#fdeceb', statusColor: '#c0392b', barColor: '#d63b2e' }
  }
  if (taxa > meta) {
    return { statusLabel: 'Atenção', statusBg: '#fff4e5', statusColor: '#a15c00', barColor: '#e8734a' }
  }
  return { statusLabel: 'Sob controle', statusBg: '#eaf6ee', statusColor: '#2e7d4f', barColor: '#3f8a5c' }
}

export interface MotivoBreakdown {
  nome: string
  dias: number
  pct: number
  cor: string
}

export function buildMotivosBreakdown(occurrences: Occurrence[]): MotivoBreakdown[] {
  const faltaDias = calculateLostDays(occurrences.filter((o) => o.type === 'falta'))
  const atestadoDias = calculateLostDays(occurrences.filter((o) => o.type === 'atestado'))
  const total = faltaDias + atestadoDias
  if (total === 0) return []

  return [
    { nome: 'Atestado médico', dias: atestadoDias, pct: Math.round((atestadoDias / total) * 100), cor: '#d63b2e' },
    { nome: 'Falta não justificada', dias: faltaDias, pct: Math.round((faltaDias / total) * 100), cor: '#e8734a' },
  ].filter((m) => m.dias > 0)
}
