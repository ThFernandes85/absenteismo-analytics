import { useMemo, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { FullPageSpinner } from '@/components/ui/Spinner'
import { OCCURRENCE_COLORS, OCCURRENCE_ICONS, OCCURRENCE_LABELS } from '@/lib/constants'
import { useOccurrencesByDateRange } from '@/features/occurrences/api'
import type { OccurrenceType } from '@/types/database.types'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function CalendarPage() {
  const [month, setMonth] = useState(() => dayjs().startOf('month'))
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const gridStart = month.startOf('month').startOf('week')
  const gridEnd = month.endOf('month').endOf('week')

  const { data: occurrences, isLoading } = useOccurrencesByDateRange(
    gridStart.format('YYYY-MM-DD'),
    gridEnd.format('YYYY-MM-DD'),
  )

  const occurrencesByDay = useMemo(() => {
    const map = new Map<string, typeof occurrences>()
    occurrences?.forEach((o) => {
      const list = map.get(o.occurrence_date) ?? []
      list.push(o)
      map.set(o.occurrence_date, list)
    })
    return map
  }, [occurrences])

  const days: Dayjs[] = []
  let cursor = gridStart
  while (cursor.isBefore(gridEnd) || cursor.isSame(gridEnd, 'day')) {
    days.push(cursor)
    cursor = cursor.add(1, 'day')
  }

  const selectedOccurrences = selectedDate ? occurrencesByDay.get(selectedDate) ?? [] : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Calendário</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Visão consolidada por dia</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setMonth((m) => m.subtract(1, 'month'))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="w-36 text-center text-sm font-medium capitalize">{month.format('MMMM [de] YYYY')}</span>
          <Button variant="secondary" size="sm" onClick={() => setMonth((m) => m.add(1, 'month'))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <FullPageSpinner />
      ) : (
        <Card>
          <CardContent className="p-2">
            <div className="grid grid-cols-7 gap-1">
              {WEEKDAYS.map((d) => (
                <div key={d} className="px-2 py-1 text-center text-xs font-medium text-[var(--color-text-muted)]">
                  {d}
                </div>
              ))}
              {days.map((day) => {
                const dateStr = day.format('YYYY-MM-DD')
                const dayOccurrences = occurrencesByDay.get(dateStr) ?? []
                const isCurrentMonth = day.isSame(month, 'month')
                const isToday = day.isSame(dayjs(), 'day')
                const typeCounts = dayOccurrences.reduce(
                  (acc, o) => {
                    acc[o.type] = (acc[o.type] ?? 0) + 1
                    return acc
                  },
                  {} as Record<OccurrenceType, number>,
                )

                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`min-h-20 rounded-md border p-1.5 text-left transition-colors cursor-pointer ${
                      isCurrentMonth
                        ? 'border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]'
                        : 'border-transparent opacity-40'
                    } ${isToday ? 'ring-1 ring-[var(--color-accent)]' : ''}`}
                  >
                    <span className="text-xs font-medium">{day.format('D')}</span>
                    <div className="mt-1 flex flex-wrap gap-0.5">
                      {(Object.entries(typeCounts) as [OccurrenceType, number][]).map(([type, count]) => (
                        <span
                          key={type}
                          className={`rounded px-1 text-[10px] font-medium ${OCCURRENCE_COLORS[type]}`}
                        >
                          {OCCURRENCE_ICONS[type]} {count}
                        </span>
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Modal
        open={!!selectedDate}
        onClose={() => setSelectedDate(null)}
        title={selectedDate ? dayjs(selectedDate).format('DD/MM/YYYY') : ''}
      >
        <div className="space-y-3">
          {(Object.keys(OCCURRENCE_LABELS) as OccurrenceType[]).map((type) => {
            const items = selectedOccurrences.filter((o) => o.type === type)
            if (items.length === 0) return null
            return (
              <div key={type}>
                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-muted)]">
                  {OCCURRENCE_ICONS[type]} {OCCURRENCE_LABELS[type]} ({items.length})
                </p>
                <ul className="space-y-1">
                  {items.map((o) => (
                    <li key={o.id} className="text-sm">
                      {o.employees.full_name}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
          {selectedOccurrences.length === 0 && (
            <p className="text-center text-sm text-[var(--color-text-muted)]">Nenhum registro nesta data.</p>
          )}
        </div>
      </Modal>
    </div>
  )
}
