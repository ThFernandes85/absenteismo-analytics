import { Link } from 'react-router-dom'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FullPageSpinner } from '@/components/ui/Spinner'
import { formatDate } from '@/lib/utils'
import { useEmployees, useSetEmployeeStatus } from './api'

export function HiddenEmployeesPage() {
  const { data: employees, isLoading } = useEmployees('inativo')
  const setStatus = useSetEmployeeStatus()

  async function handleReactivate(id: string, name: string) {
    try {
      await setStatus.mutateAsync({ id, status: 'ativo' })
      toast.success(`${name} reativado com sucesso.`)
    } catch {
      toast.error('Erro ao reativar funcionário.')
    }
  }

  if (isLoading) return <FullPageSpinner />

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/funcionarios"
          className="mb-2 inline-flex items-center gap-1 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <h1 className="text-lg font-semibold">Funcionários Ocultos</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Colaboradores inativos. Nenhum registro é excluído permanentemente — reative quando necessário.
        </p>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-hover)] text-left text-xs text-[var(--color-text-muted)]">
              <th className="px-4 py-2.5 font-medium">Matrícula</th>
              <th className="px-4 py-2.5 font-medium">Nome</th>
              <th className="px-4 py-2.5 font-medium">Cargo</th>
              <th className="px-4 py-2.5 font-medium">Setor</th>
              <th className="px-4 py-2.5 font-medium">Admissão</th>
              <th className="px-4 py-2.5 font-medium" />
            </tr>
          </thead>
          <tbody>
            {employees?.map((employee) => (
              <tr key={employee.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-hover)]">
                <td className="px-4 py-2.5">{employee.registration_number}</td>
                <td className="px-4 py-2.5 font-medium">{employee.full_name}</td>
                <td className="px-4 py-2.5">{employee.position}</td>
                <td className="px-4 py-2.5">{employee.department}</td>
                <td className="px-4 py-2.5">{formatDate(employee.admission_date)}</td>
                <td className="px-4 py-2.5 text-right">
                  <Button size="sm" variant="secondary" onClick={() => handleReactivate(employee.id, employee.full_name)}>
                    <RotateCcw className="h-3.5 w-3.5" /> Reativar
                  </Button>
                </td>
              </tr>
            ))}
            {employees?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[var(--color-text-muted)]">
                  Nenhum funcionário oculto.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
