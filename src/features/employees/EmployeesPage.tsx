import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, EyeOff, Users, UserCheck, UserX, UserMinus } from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { FullPageSpinner } from '@/components/ui/Spinner'
import { ExportMenu } from '@/components/ui/ExportMenu'
import { formatDate } from '@/lib/utils'
import { EMPLOYEE_STATUS_COLORS, EMPLOYEE_STATUS_LABELS, OCCURRENCE_COLORS, OCCURRENCE_LABELS } from '@/lib/constants'
import { useActiveLeaveToday } from '@/features/occurrences/api'
import { useEmployees, useSetEmployeeStatus } from './api'
import { EmployeeFormModal } from './EmployeeFormModal'
import type { Employee } from '@/types/database.types'

type StatusFilter = 'ativo_afastado' | 'ativo' | 'afastado' | 'inativo' | 'all'

export function EmployeesPage() {
  const { data: employees, isLoading } = useEmployees('all')
  const { data: activeLeave } = useActiveLeaveToday()
  const setStatus = useSetEmployeeStatus()

  const activeLeaveByEmployee = useMemo(() => {
    const map = new Map<string, 'ferias' | 'atestado'>()
    activeLeave?.forEach((o) => map.set(o.employee_id, o.type as 'ferias' | 'atestado'))
    return map
  }, [activeLeave])
  const [search, setSearch] = useState('')
  const [positionFilter, setPositionFilter] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ativo_afastado')
  const [formOpen, setFormOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)

  const positions = useMemo(
    () => Array.from(new Set(employees?.map((e) => e.position) ?? [])).sort(),
    [employees],
  )
  const departments = useMemo(
    () => Array.from(new Set(employees?.map((e) => e.department) ?? [])).sort(),
    [employees],
  )

  const filtered = useMemo(() => {
    return (employees ?? [])
      .filter((e) => {
        if (statusFilter === 'all') return true
        if (statusFilter === 'ativo_afastado') return e.status !== 'inativo'
        return e.status === statusFilter
      })
      .filter((e) => !positionFilter || e.position === positionFilter)
      .filter((e) => !departmentFilter || e.department === departmentFilter)
      .filter((e) => {
        const q = search.trim().toLowerCase()
        if (!q) return true
        return e.full_name.toLowerCase().includes(q) || e.registration_number.toLowerCase().includes(q)
      })
  }, [employees, statusFilter, positionFilter, departmentFilter, search])

  const activeCount = employees?.filter((e) => e.status === 'ativo').length ?? 0
  const awayCount = employees?.filter((e) => e.status === 'afastado').length ?? 0
  const inactiveCount = employees?.filter((e) => e.status === 'inativo').length ?? 0

  async function handleSetStatus(employee: Employee, status: Employee['status'], confirmMessage: string) {
    if (!confirm(confirmMessage)) return
    try {
      await setStatus.mutateAsync({ id: employee.id, status })
      toast.success('Situação do funcionário atualizada.')
    } catch {
      toast.error('Erro ao atualizar situação do funcionário.')
    }
  }

  if (isLoading) return <FullPageSpinner />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Funcionários</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Gerencie o cadastro de colaboradores</p>
        </div>
        <div className="flex gap-2">
          <ExportMenu
            filename="funcionarios"
            title="Lista de Funcionários"
            columns={[
              { key: 'registration_number', header: 'Matrícula' },
              { key: 'full_name', header: 'Nome' },
              { key: 'position', header: 'Cargo' },
              { key: 'department', header: 'Setor' },
              { key: 'status', header: 'Situação' },
              { key: 'admission_date', header: 'Admissão' },
            ]}
            rows={filtered.map((e) => ({
              registration_number: e.registration_number,
              full_name: e.full_name,
              position: e.position,
              department: e.department,
              status: EMPLOYEE_STATUS_LABELS[e.status],
              admission_date: formatDate(e.admission_date),
            }))}
          />
          <Link to="/funcionarios/ocultos">
            <Button variant="secondary">
              <EyeOff className="h-4 w-4" /> Funcionários Ocultos
            </Button>
          </Link>
          <Button
            onClick={() => {
              setEditingEmployee(null)
              setFormOpen(true)
            }}
          >
            <Plus className="h-4 w-4" /> Novo Funcionário
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="rounded-md bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-muted)]">Ativos</p>
              <p className="text-xl font-semibold">{activeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="rounded-md bg-amber-50 p-2 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
              <UserMinus className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-muted)]">Afastados</p>
              <p className="text-xl font-semibold">{awayCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="rounded-md bg-rose-50 p-2 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
              <UserX className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-muted)]">Inativos</p>
              <p className="text-xl font-semibold">{inactiveCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="rounded-md bg-sky-50 p-2 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-muted)]">Total Geral</p>
              <p className="text-xl font-semibold">{employees?.length ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-[var(--color-text-muted)]" />
            <Input
              placeholder="Buscar por nome ou matrícula…"
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select className="w-44" value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
            <option value="">Todos os setores</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
          <Select className="w-44" value={positionFilter} onChange={(e) => setPositionFilter(e.target.value)}>
            <option value="">Todos os cargos</option>
            {positions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
          <Select
            className="w-40"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          >
            <option value="ativo_afastado">Ativos e Afastados</option>
            <option value="ativo">Somente Ativos</option>
            <option value="afastado">Somente Afastados</option>
            <option value="inativo">Inativos</option>
            <option value="all">Todos</option>
          </Select>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-hover)] text-left text-xs text-[var(--color-text-muted)]">
              <th className="px-4 py-2.5 font-medium">Matrícula</th>
              <th className="px-4 py-2.5 font-medium">Nome</th>
              <th className="px-4 py-2.5 font-medium">Cargo</th>
              <th className="px-4 py-2.5 font-medium">Setor</th>
              <th className="px-4 py-2.5 font-medium">Situação</th>
              <th className="px-4 py-2.5 font-medium">Admissão</th>
              <th className="px-4 py-2.5 font-medium" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((employee) => (
              <tr key={employee.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-hover)]">
                <td className="px-4 py-2.5">{employee.registration_number}</td>
                <td className="px-4 py-2.5">
                  <Link to={`/funcionarios/${employee.id}`} className="font-medium text-[var(--color-accent)] hover:underline">
                    {employee.full_name}
                  </Link>
                </td>
                <td className="px-4 py-2.5">{employee.position}</td>
                <td className="px-4 py-2.5">{employee.department}</td>
                <td className="px-4 py-2.5">
                  {(() => {
                    const leave = employee.status === 'ativo' ? activeLeaveByEmployee.get(employee.id) : undefined
                    if (leave) {
                      return (
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${OCCURRENCE_COLORS[leave]}`}>
                          {leave === 'ferias' ? 'Gozando Férias' : `Em ${OCCURRENCE_LABELS[leave]}`}
                        </span>
                      )
                    }
                    return (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${EMPLOYEE_STATUS_COLORS[employee.status]}`}>
                        {EMPLOYEE_STATUS_LABELS[employee.status]}
                      </span>
                    )
                  })()}
                </td>
                <td className="px-4 py-2.5">{formatDate(employee.admission_date)}</td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setEditingEmployee(employee)
                        setFormOpen(true)
                      }}
                    >
                      Editar
                    </Button>
                    {employee.status === 'ativo' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          handleSetStatus(employee, 'afastado', `Marcar ${employee.full_name} como afastado?`)
                        }
                      >
                        Afastar
                      </Button>
                    )}
                    {employee.status === 'afastado' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          handleSetStatus(employee, 'ativo', `Marcar ${employee.full_name} como ativo novamente?`)
                        }
                      >
                        Reativar
                      </Button>
                    )}
                    {(employee.status === 'ativo' || employee.status === 'afastado') && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() =>
                          handleSetStatus(
                            employee,
                            'inativo',
                            `Desativar ${employee.full_name}? O funcionário será movido para "Funcionários Ocultos".`,
                          )
                        }
                      >
                        Desativar
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[var(--color-text-muted)]">
                  Nenhum funcionário encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <EmployeeFormModal open={formOpen} onClose={() => setFormOpen(false)} employee={editingEmployee} />
    </div>
  )
}
