import { Fragment, useState } from 'react'
import dayjs from 'dayjs'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { FullPageSpinner } from '@/components/ui/Spinner'
import { formatDateTime } from '@/lib/utils'
import { ROLE_LABELS } from '@/lib/constants'
import { useAuditLog } from './api'

const TABLE_LABELS: Record<string, string> = {
  employees: 'Funcionários',
  occurrences: 'Ocorrências',
  attachments: 'Anexos',
  administrative_measures: 'Medidas Administrativas',
  profiles: 'Usuários',
}

const ACTION_LABELS: Record<string, string> = {
  INSERT: 'Criação',
  UPDATE: 'Edição',
  DELETE: 'Exclusão',
}

const PAGE_SIZE = 25

export function AuditPage() {
  const [tableName, setTableName] = useState('')
  const [action, setAction] = useState('')
  const [startDate, setStartDate] = useState(dayjs().subtract(30, 'day').format('YYYY-MM-DD'))
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [page, setPage] = useState(0)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const { data, isLoading } = useAuditLog({ tableName, action, startDate, endDate, page, pageSize: PAGE_SIZE })
  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Auditoria</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Histórico completo e imutável de todas as ações do sistema.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Select className="w-48" value={tableName} onChange={(e) => { setTableName(e.target.value); setPage(0) }}>
            <option value="">Todos os registros</option>
            {Object.entries(TABLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
          <Select className="w-40" value={action} onChange={(e) => { setAction(e.target.value); setPage(0) }}>
            <option value="">Todas as ações</option>
            {Object.entries(ACTION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
          <div className="flex items-center gap-2">
            <Input type="date" className="w-40" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(0) }} />
            <span className="text-xs text-[var(--color-text-muted)]">até</span>
            <Input type="date" className="w-40" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(0) }} />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <FullPageSpinner />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-hover)] text-left text-xs text-[var(--color-text-muted)]">
                <th className="px-4 py-2.5 font-medium" />
                <th className="px-4 py-2.5 font-medium">Data/Hora</th>
                <th className="px-4 py-2.5 font-medium">Usuário</th>
                <th className="px-4 py-2.5 font-medium">Perfil</th>
                <th className="px-4 py-2.5 font-medium">Ação</th>
                <th className="px-4 py-2.5 font-medium">Registro</th>
                <th className="px-4 py-2.5 font-medium">IP</th>
              </tr>
            </thead>
            <tbody>
              {data?.rows.map((row) => (
                <Fragment key={row.id}>
                  <tr
                    className="cursor-pointer border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-hover)]"
                    onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                  >
                    <td className="px-4 py-2.5">
                      {expandedId === row.id ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    </td>
                    <td className="px-4 py-2.5">{formatDateTime(row.created_at)}</td>
                    <td className="px-4 py-2.5">{row.profiles?.full_name ?? '—'}</td>
                    <td className="px-4 py-2.5">{row.user_role ? ROLE_LABELS[row.user_role] : '—'}</td>
                    <td className="px-4 py-2.5">{ACTION_LABELS[row.action] ?? row.action}</td>
                    <td className="px-4 py-2.5">{TABLE_LABELS[row.table_name] ?? row.table_name}</td>
                    <td className="px-4 py-2.5">{row.ip_address}</td>
                  </tr>
                  {expandedId === row.id && (
                    <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-hover)]">
                      <td />
                      <td colSpan={6} className="px-4 py-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="mb-1 text-xs font-semibold text-[var(--color-text-muted)]">Valor Anterior</p>
                            <pre className="max-h-48 overflow-auto rounded-md bg-[var(--color-bg)] p-2 text-xs">
                              {row.old_data ? JSON.stringify(row.old_data, null, 2) : '—'}
                            </pre>
                          </div>
                          <div>
                            <p className="mb-1 text-xs font-semibold text-[var(--color-text-muted)]">Novo Valor</p>
                            <pre className="max-h-48 overflow-auto rounded-md bg-[var(--color-bg)] p-2 text-xs">
                              {row.new_data ? JSON.stringify(row.new_data, null, 2) : '—'}
                            </pre>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {data?.rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[var(--color-text-muted)]">
                    Nenhum registro encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[var(--color-border)] px-4 py-2.5">
              <p className="text-xs text-[var(--color-text-muted)]">
                Página {page + 1} de {totalPages} · {data?.count} registros
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                  Anterior
                </Button>
                <Button size="sm" variant="secondary" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
