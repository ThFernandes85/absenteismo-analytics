export function ExecKpiCard({
  label,
  value,
  suffix,
  trendLabel,
  trendColor,
  helper,
}: {
  label: string
  value: string
  suffix?: string
  trendLabel?: string
  trendColor?: string
  helper?: string
}) {
  return (
    <div className="rounded-[14px] border border-[var(--exec-border)] bg-[var(--exec-card)] px-[22px] py-5">
      <div className="text-xs font-semibold tracking-wide text-[var(--exec-text-muted)] uppercase">{label}</div>
      <div className="mt-2.5 flex items-baseline gap-2">
        <div className="text-[32px] leading-none font-extrabold text-[var(--exec-text)]">{value}</div>
        {suffix && <div className="text-[12.5px] text-[var(--exec-text-faint)]">{suffix}</div>}
        {trendLabel && (
          <div className="text-[12.5px] font-bold" style={{ color: trendColor }}>
            {trendLabel}
          </div>
        )}
      </div>
      {helper && <div className="mt-1.5 text-xs text-[var(--exec-text-faint)]">{helper}</div>}
    </div>
  )
}
