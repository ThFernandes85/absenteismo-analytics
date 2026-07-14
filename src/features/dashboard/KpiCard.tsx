import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

export function KpiCard({
  icon: Icon,
  label,
  value,
  colorClass,
}: {
  icon: LucideIcon
  label: string
  value: string | number
  colorClass: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3">
        <div className={cn('rounded-md p-2', colorClass)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
          <p className="text-xl font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
