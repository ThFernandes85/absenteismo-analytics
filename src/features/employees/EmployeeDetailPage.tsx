import { useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import dayjs from 'dayjs'
import { ArrowLeft, Gavel, Pencil, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { FullPageSpinner } from '@/components/ui/Spinner'
import { formatDate, formatDateTime } from '@/lib/utils'
import {
  OCCURRENCE_COLORS,
  OCCURRENCE_ICONS,
  OCCURRENCE_LABELS,
  MEASURE_LABELS,
  EMPLOYEE_STATUS_COLORS,
  EMPLOYEE_STATUS_LABELS,
} from '@/lib/constants'
import { useEmployee } from './api'
import { useEmployeeOccurrences } from '@/features/occurrences/api'
import { EditOccurrenceModal } from '@/features/occurrences/EditOccurrenceModal'
import { useEmployeeMeasures } from './measuresApi'
import { MeasureFormModal } from './MeasureFormModal'
import type { AdministrativeMeasure, Occurrence } from '@/types/database.types'

type TimelineItem =
  | { kind: 'occurrence'; date: string; data: Occurrence }
  | { kind: 'measure'; date: string; data: AdministrativeMeasure }

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: employee, isLoading: loadingEmployee } = useEmployee(id)
  const { data: occurrences, isLoading: loadingOccurrences } = useEmployeeOccurrences(id)
  const { data: measures, isLoading: loadingMeasures } = useEmployeeMeasures(id)
  const [measureModalOpen, setMeasureModalOpen] = useState(false)
  const [editingOccurrence, setEditingOccurrence] = useState<Occurrence | null>(null)

  const timeline = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = []
    occurrences?.forEach((o) => items.push({ kind: 'occurrence', date: o.occurrence_date, data: o }))
    measures?.forEach((m) => items.push({ kind: 'measure', date: m.measure_date, data: m }))
    return items.sort((a, b) => (a.date < b.date ? 1 : -1))
  }, [occurrences, measures])

  const activeLeave = useMemo(() => {
    const today = dayjs()
    return occurrences?.find(
      (o) =>
        (o.type === 'ferias' || o.type === 'atestado') &&
        o.end_date &&
        !today.isBefore(dayjs(o.occurrence_date)) &&
        today.isBefore(dayjs(o.end_date)),
    )
  }, [occurrences])

  if (loadingEmployee || loadingOccurrences || loadingMeasures) return <FullPageSpinner />
  if (!employee) return <p className="text-sm text-[var(--color-text-muted)]">Funcionário não encontrado.</p>

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/funcionarios"
          className="mb-2 inline-flex items-center gap-1 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">{employee.full_name}</h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              Matrícula {employee.registration_number} · {employee.position} · {employee.department}
            </p>
          </div>
          {employee.status === 'ativo' && activeLeave ? (
            <Badge className={OCCURRENCE_COLORS[activeLeave.type]}>
              {activeLeave.type === 'ferias' ? 'Gozando Férias' : `Em ${OCCURRENCE_LABELS[activeLeave.type]}`}
            </Badge>
          ) : (
            <Badge className={EMPLOYEE_STATUS_COLORS[employee.status]}>{EMPLOYEE_STATUS_LABELS[employee.status]}</Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Dados Cadastrais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <DataRow label="Matrícula" value={employee.registration_number} />
            <DataRow label="Cargo" value={employee.position} />
            <DataRow label="Setor" value={employee.department} />
            <DataRow label="Data de Admissão" value={formatDate(employee.admission_date)} />
            <DataRow label="Observações" value={employee.notes || '—'} />
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Linha do Tempo</CardTitle>
            <Button size="sm" variant="secondary" onClick={() => setMeasureModalOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Medida Administrativa
            </Button>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {timeline.map((item) =>
                item.kind === 'occurrence' ? (
                  <li key={`occ-${item.data.id}`} className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${OCCURRENCE_COLORS[item.data.type]}`}
                    >
                      {OCCURRENCE_ICONS[item.data.type]}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {OCCURRENCE_LABELS[item.data.type]} — {formatDate(item.data.occurrence_date)}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {occurrenceDetail(item.data)}
                        {item.data.notes ? ` · ${item.data.notes}` : ''}
                      </p>
                      <p className="text-[11px] text-[var(--color-text-muted)]">
                        Lançado em {formatDateTime(item.data.created_at)}
                      </p>
                    </div>
                    <button
                      onClick={() => setEditingOccurrence(item.data)}
                      className="rounded-md p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] cursor-pointer"
                      title="Editar"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ) : (
                  <li key={`measure-${item.data.id}`} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
                      <Gavel className="h-4 w-4" />
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {MEASURE_LABELS[item.data.type]} — {formatDate(item.data.measure_date)}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {item.data.type === 'suspensao' ? `${item.data.suspension_days} dia(s) · ` : ''}
                        {item.data.description}
                      </p>
                    </div>
                  </li>
                ),
              )}
              {timeline.length === 0 && (
                <p className="py-6 text-center text-sm text-[var(--color-text-muted)]">
                  Nenhum registro para este funcionário ainda.
                </p>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      <MeasureFormModal open={measureModalOpen} onClose={() => setMeasureModalOpen(false)} employeeId={employee.id} />
      <EditOccurrenceModal
        occurrence={editingOccurrence}
        employeeName={employee.full_name}
        open={!!editingOccurrence}
        onClose={() => setEditingOccurrence(null)}
      />
    </div>
  )
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  )
}

function occurrenceDetail(o: Occurrence) {
  switch (o.type) {
    case 'falta':
      return o.reason ?? '—'
    case 'atestado':
      return `${o.days_count} dia(s) · retorno em ${o.end_date ? formatDate(o.end_date) : '—'}${o.cid ? ` · CID ${o.cid}` : ''}`
    case 'ferias':
      return `${o.days_count} dia(s) · retorno em ${o.end_date ? formatDate(o.end_date) : '—'}`
    case 'declaracao':
      return o.time_of_day ?? '—'
    case 'hora_extra':
      return `${o.hours}h · ${o.overtime_percentage}%`
    default:
      return ''
  }
}
