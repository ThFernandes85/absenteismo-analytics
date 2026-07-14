import dayjs from 'dayjs'
import type { CostCenter, Occurrence, OccurrenceType } from '@/types/database.types'
import { OCCURRENCE_LABELS, STANDARD_WORKDAY_HOURS } from '@/lib/constants'

type OccurrenceWithEmployee = Occurrence & {
  employees: { full_name: string; department: string; position: string; cost_center_id: string }
}

const ABSENCE_TYPES: OccurrenceType[] = ['falta', 'atestado']

export function calculateLostHours(occurrences: Occurrence[]) {
  return occurrences.reduce((total, o) => {
    if (o.type === 'falta') return total + STANDARD_WORKDAY_HOURS
    if (o.type === 'atestado') return total + (o.days_count ?? 0) * STANDARD_WORKDAY_HOURS
    return total
  }, 0)
}

export function calculateOvertimeHours(occurrences: Occurrence[]) {
  return occurrences.reduce((total, o) => (o.type === 'hora_extra' ? total + (o.hours ?? 0) : total), 0)
}

export function groupByDimension(
  occurrences: OccurrenceWithEmployee[],
  dimension: 'department' | 'position' | 'full_name',
) {
  const counts = new Map<string, number>()
  occurrences
    .filter((o) => ABSENCE_TYPES.includes(o.type))
    .forEach((o) => {
      const key = o.employees[dimension]
      counts.set(key, (counts.get(key) ?? 0) + 1)
    })
  return Array.from(counts.entries())
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
}

export function groupByCostCenter(occurrences: OccurrenceWithEmployee[], costCenters: CostCenter[]) {
  const counts = new Map<string, number>()
  occurrences
    .filter((o) => ABSENCE_TYPES.includes(o.type))
    .forEach((o) => {
      const key = o.employees.cost_center_id
      counts.set(key, (counts.get(key) ?? 0) + 1)
    })
  return Array.from(counts.entries())
    .map(([costCenterId, total]) => ({
      name: costCenters.find((cc) => cc.id === costCenterId)?.name ?? 'Sem centro de lucro',
      total,
    }))
    .sort((a, b) => b.total - a.total)
}

export function groupByType(occurrences: Occurrence[]) {
  const counts = new Map<OccurrenceType, number>()
  occurrences.forEach((o) => counts.set(o.type, (counts.get(o.type) ?? 0) + 1))
  return Array.from(counts.entries()).map(([type, total]) => ({
    name: OCCURRENCE_LABELS[type],
    total,
  }))
}

export function groupOverTime(occurrences: OccurrenceWithEmployee[], startDate: string, endDate: string) {
  const rangeDays = dayjs(endDate).diff(dayjs(startDate), 'day') + 1
  const unit: 'day' | 'week' | 'month' = rangeDays > 60 ? 'month' : rangeDays > 14 ? 'week' : 'day'
  const format = unit === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD'
  const bucketKey = (d: dayjs.Dayjs) => (unit === 'week' ? d.startOf('week') : d).format(format)

  const buckets = new Map<string, number>()
  let cursor = dayjs(startDate)
  const end = dayjs(endDate)
  while (cursor.isBefore(end) || cursor.isSame(end, 'day')) {
    buckets.set(bucketKey(cursor), 0)
    cursor = cursor.add(1, unit)
  }

  occurrences
    .filter((o) => ABSENCE_TYPES.includes(o.type))
    .forEach((o) => {
      const key = bucketKey(dayjs(o.occurrence_date))
      buckets.set(key, (buckets.get(key) ?? 0) + 1)
    })

  return Array.from(buckets.entries()).map(([label, total]) => ({ label, total }))
}
