import dayjs from 'dayjs'
import type { CostCenter, Occurrence, OccurrenceType } from '@/types/database.types'
import { OCCURRENCE_LABELS, STANDARD_WORKDAY_HOURS } from '@/lib/constants'

type OccurrenceWithEmployee = Occurrence & {
  employees: { full_name: string; department: string; position: string; cost_center_id: string }
}

const ABSENCE_TYPES: OccurrenceType[] = ['falta', 'atestado']

// Dias de uma ocorrência (occurrence_date até end_date, exclusivo — ou só
// occurrence_date para tipos sem período) que caem dentro de [rangeStart,
// rangeEnd]. Datas são strings 'YYYY-MM-DD', então comparação lexicográfica
// já funciona corretamente sem precisar de plugins do dayjs.
function overlappingDays(occurrenceDate: string, endDate: string | null, rangeStart: string, rangeEnd: string) {
  const lastCoveredDay = endDate ? dayjs(endDate).subtract(1, 'day').format('YYYY-MM-DD') : occurrenceDate
  const start = occurrenceDate > rangeStart ? occurrenceDate : rangeStart
  const end = lastCoveredDay < rangeEnd ? lastCoveredDay : rangeEnd
  if (start > end) return []

  const days: string[] = []
  let cursor = dayjs(start)
  const last = dayjs(end)
  while (!cursor.isAfter(last, 'day')) {
    days.push(cursor.format('YYYY-MM-DD'))
    cursor = cursor.add(1, 'day')
  }
  return days
}

export function calculateLostHours(occurrences: Occurrence[], rangeStart: string, rangeEnd: string) {
  return occurrences.reduce((total, o) => {
    if (o.type === 'falta') return total + STANDARD_WORKDAY_HOURS
    if (o.type === 'atestado') {
      return total + overlappingDays(o.occurrence_date, o.end_date, rangeStart, rangeEnd).length * STANDARD_WORKDAY_HOURS
    }
    return total
  }, 0)
}

export function calculateOvertimeHours(occurrences: Occurrence[]) {
  return occurrences.reduce((total, o) => (o.type === 'hora_extra' ? total + (o.hours ?? 0) : total), 0)
}

export function groupByDimension(
  occurrences: OccurrenceWithEmployee[],
  dimension: 'department' | 'position' | 'full_name',
  rangeStart: string,
  rangeEnd: string,
) {
  const counts = new Map<string, number>()
  occurrences
    .filter((o) => ABSENCE_TYPES.includes(o.type))
    .forEach((o) => {
      const days = overlappingDays(o.occurrence_date, o.end_date, rangeStart, rangeEnd).length
      if (days === 0) return
      const key = o.employees[dimension]
      counts.set(key, (counts.get(key) ?? 0) + days)
    })
  return Array.from(counts.entries())
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
}

export function groupByCostCenter(
  occurrences: OccurrenceWithEmployee[],
  costCenters: CostCenter[],
  rangeStart: string,
  rangeEnd: string,
) {
  const counts = new Map<string, number>()
  occurrences
    .filter((o) => ABSENCE_TYPES.includes(o.type))
    .forEach((o) => {
      const days = overlappingDays(o.occurrence_date, o.end_date, rangeStart, rangeEnd).length
      if (days === 0) return
      const key = o.employees.cost_center_id
      counts.set(key, (counts.get(key) ?? 0) + days)
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
      overlappingDays(o.occurrence_date, o.end_date, startDate, endDate).forEach((day) => {
        const key = bucketKey(dayjs(day))
        buckets.set(key, (buckets.get(key) ?? 0) + 1)
      })
    })

  return Array.from(buckets.entries()).map(([label, total]) => ({ label, total }))
}
