import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input, Label } from '@/components/ui/Input'
import { ExportMenu } from '@/components/ui/ExportMenu'
import { FullPageSpinner } from '@/components/ui/Spinner'
import { formatDate } from '@/lib/utils'
import { OCCURRENCE_COLORS, OCCURRENCE_LABELS } from '@/lib/constants'
import { useEmployees, useCostCenters } from '@/features/employees/api'
import { useOccurrencesByDateRange } from './api'
import type { Occurrence, OccurrenceType } from '@/types/database.types'

function statusDetail(o: Occurrence) {
  switch (o.type) {
    case 'falta':
      return o.reason ?? '—'
    case 'atestado':
      return `retorno em ${o.end_date ? formatDate(o.end_date) : '—'}${o.cid ? ` · CID ${o.cid}` : ''}`
    case 'ferias':
      return `retorno em ${o.end_date ? formatDate(o.end_date) : '—'}`
    case 'declaracao':
      return o.time_of_day ?? '—'
    default:
      return o.notes ?? '—'
  }
}

export function DailyAttendanceCard() {
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'))
  const { data: employees, isLoading: loadingEmployees } = useEmployees('ativo')
  const { data: costCenters } = useCostCenters()
  const { data: occurrences, isLoading: loadingOccurrences } = useOccurrencesByDateRange(date, date)

  const costCenterNames = useMemo(() => {
    const map = new Map<string, string>()
    costCenters?.forEach((c) => map.set(c.id, c.name))
    return map
  }, [costCenters])

  const occurrenceByEmployee = useMemo(() => {
    const map = new Map<string, Occurrence>()
    occurrences?.forEach((o) => {
      const startsOnOrBefore = o.occurrence_date <= date
      const stillOngoing = !o.end_date || o.end_date > date
      if (startsOnOrBefore && stillOngoing) map.set(o.employee_id, o)
    })
    return map
  }, [occurrences, date])

  const rows = useMemo(() => {
    return (employees ?? [])
      .map((e) => {
        const occurrence = occurrenceByEmployee.get(e.id)
        return {
          matricula: e.registration_number,
          nome: e.full_name,
          cargo: e.position,
          centro_de_lucro: costCenterNames.get(e.cost_center_id) ?? '—',
          status: occurrence ? OCCURRENCE_LABELS[occurrence.type] : 'Não lançado',
          detalhe: occurrence ? statusDetail(occurrence) : '—',
          _type: occurrence?.type as OccurrenceType | undefined,
        }
      })
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  }, [employees, occurrenceByEmployee, costCenterNames])

  const isLoading = loadingEmployees || loadingOccurrences

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Lista de Presença do Dia</CardTitle>
        <div className="flex items-center gap-3">
          <div>
            <Label htmlFor="attendance_date" className="sr-only">
              Data
            </Label>
            <Input
              id="attendance_date"
              type="date"
              className="w-40"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <ExportMenu
            filename={`lista-presenca-${date}`}
            title={`Lista de Presença — ${formatDate(date)}`}
            columns={[
              { key: 'matricula', header: 'Matrícula' },
              { key: 'nome', header: 'Nome' },
              { key: 'cargo', header: 'Cargo' },
              { key: 'centro_de_lucro', header: 'Centro de Lucro' },
              { key: 'status', header: 'Status' },
              { key: 'detalhe', header: 'Detalhe' },
            ]}
            rows={rows.map(({ matricula, nome, cargo, centro_de_lucro, status, detalhe }) => ({
              matricula,
              nome,
              cargo,
              centro_de_lucro,
              status,
              detalhe,
            }))}
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <FullPageSpinner />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-text-muted)]">
                  <th className="py-2 font-medium">Nome</th>
                  <th className="py-2 font-medium">Cargo</th>
                  <th className="py-2 font-medium">Centro de Lucro</th>
                  <th className="py-2 font-medium">Status</th>
                  <th className="py-2 font-medium">Detalhe</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.matricula} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="py-2 font-medium">{r.nome}</td>
                    <td className="py-2 text-[var(--color-text-muted)]">{r.cargo}</td>
                    <td className="py-2 text-[var(--color-text-muted)]">{r.centro_de_lucro}</td>
                    <td className="py-2">
                      <span
                        className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                          r._type ? OCCURRENCE_COLORS[r._type] : 'bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2 text-[var(--color-text-muted)]">{r.detalhe}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[var(--color-text-muted)]">
                      Nenhum colaborador ativo encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
