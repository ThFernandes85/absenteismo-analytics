import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import type { Employee } from '@/types/database.types'

const CHIP_CLASS =
  'rounded-full border border-amber-300 bg-white px-2.5 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100 dark:border-amber-500/40 dark:bg-transparent dark:text-amber-300 dark:hover:bg-amber-500/10 cursor-pointer'

export function PendingAttendanceCard({
  pendingEmployees,
  onSelectEmployee,
}: {
  pendingEmployees: Employee[]
  onSelectEmployee?: (employee: Employee) => void
}) {
  if (pendingEmployees.length === 0) {
    return (
      <Card className="border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10">
        <CardContent className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <p className="text-sm text-emerald-700 dark:text-emerald-400">
            Tudo certo — todos os colaboradores ativos já têm lançamento de hoje.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10">
      <CardContent>
        <div className="mb-2 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            {pendingEmployees.length} colaborador(es) sem lançamento de presença hoje
          </p>
        </div>
        <div className="flex flex-wrap gap-2 pl-8">
          {pendingEmployees.map((e) =>
            onSelectEmployee ? (
              <button key={e.id} type="button" onClick={() => onSelectEmployee(e)} className={CHIP_CLASS}>
                {e.full_name}
              </button>
            ) : (
              <Link key={e.id} to="/ocorrencias" className={CHIP_CLASS}>
                {e.full_name}
              </Link>
            ),
          )}
        </div>
      </CardContent>
    </Card>
  )
}
