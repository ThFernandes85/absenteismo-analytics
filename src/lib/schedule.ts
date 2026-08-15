import dayjs from 'dayjs'
import type { Employee } from '@/types/database.types'

type ScheduleFields = Pick<Employee, 'schedule_type' | 'schedule_reference_date'>

const CYCLE_DAYS = 6
const WORK_DAYS_IN_CYCLE = 3

// Escala 3x3: 3 dias de trabalho, 3 dias de folga, intercalando — um ciclo
// fixo de 6 dias a partir de uma data de referência conhecida como dia de
// trabalho. Funcionários "padrão" seguem o expediente comum (seg-sex).
export function isScheduledWorkDay(employee: ScheduleFields, date: string): boolean {
  if (employee.schedule_type === 'escala_3x3' && employee.schedule_reference_date) {
    const diff = dayjs(date).diff(dayjs(employee.schedule_reference_date), 'day')
    const mod = ((diff % CYCLE_DAYS) + CYCLE_DAYS) % CYCLE_DAYS
    return mod < WORK_DAYS_IN_CYCLE
  }
  const weekday = dayjs(date).day()
  return weekday !== 0 && weekday !== 6
}

export function countExpectedWorkDays(employee: ScheduleFields, start: string, end: string): number {
  let cursor = dayjs(start)
  const last = dayjs(end)
  let count = 0
  while (cursor.isBefore(last) || cursor.isSame(last, 'day')) {
    if (isScheduledWorkDay(employee, cursor.format('YYYY-MM-DD'))) count += 1
    cursor = cursor.add(1, 'day')
  }
  return count
}

export function sumExpectedWorkDays(employees: ScheduleFields[], start: string, end: string): number {
  return employees.reduce((sum, e) => sum + countExpectedWorkDays(e, start, end), 0)
}
