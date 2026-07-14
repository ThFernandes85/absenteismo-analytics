import { TrendingDown, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

export function HoursImpactCard({
  lostHours,
  overtimeHours,
}: {
  lostHours: number
  overtimeHours: number
}) {
  const balance = overtimeHours - lostHours
  const isPositive = balance >= 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Impacto em Horas Não Trabalhadas</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-[var(--color-text-muted)]">Horas Perdidas (faltas + atestados)</p>
          <p className="text-2xl font-semibold text-rose-600 dark:text-rose-400">{lostHours.toFixed(1)}h</p>
        </div>
        <div>
          <p className="text-xs text-[var(--color-text-muted)]">Horas Extras Realizadas</p>
          <p className="text-2xl font-semibold text-violet-600 dark:text-violet-400">{overtimeHours.toFixed(1)}h</p>
        </div>
        <div>
          <p className="text-xs text-[var(--color-text-muted)]">Saldo Líquido</p>
          <p
            className={cn(
              'flex items-center gap-1 text-2xl font-semibold',
              isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
            )}
          >
            {isPositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            {balance >= 0 ? '+' : ''}
            {balance.toFixed(1)}h
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
