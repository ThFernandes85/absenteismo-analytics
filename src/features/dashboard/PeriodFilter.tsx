import { Input } from '@/components/ui/Input'
import { PERIOD_LABELS, type PeriodPreset } from './periods'
import { cn } from '@/lib/utils'

interface PeriodFilterProps {
  preset: PeriodPreset
  onPresetChange: (preset: PeriodPreset) => void
  customStart: string
  customEnd: string
  onCustomStartChange: (value: string) => void
  onCustomEndChange: (value: string) => void
}

export function PeriodFilter({
  preset,
  onPresetChange,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
}: PeriodFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {(Object.keys(PERIOD_LABELS) as PeriodPreset[]).map((p) => (
        <button
          key={p}
          onClick={() => onPresetChange(p)}
          className={cn(
            'rounded-md border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
            preset === p
              ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
              : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]',
          )}
        >
          {PERIOD_LABELS[p]}
        </button>
      ))}
      {preset === 'personalizado' && (
        <div className="flex items-center gap-2">
          <Input type="date" className="w-40" value={customStart} onChange={(e) => onCustomStartChange(e.target.value)} />
          <span className="text-xs text-[var(--color-text-muted)]">até</span>
          <Input type="date" className="w-40" value={customEnd} onChange={(e) => onCustomEndChange(e.target.value)} />
        </div>
      )}
    </div>
  )
}
