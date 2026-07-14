import dayjs from 'dayjs'

export type PeriodPreset = 'hoje' | 'ontem' | 'semana' | '7dias' | '30dias' | 'mes' | 'ano' | 'personalizado'

export const PERIOD_LABELS: Record<PeriodPreset, string> = {
  hoje: 'Hoje',
  ontem: 'Ontem',
  semana: 'Esta Semana',
  '7dias': 'Últimos 7 dias',
  '30dias': 'Últimos 30 dias',
  mes: 'Este Mês',
  ano: 'Este Ano',
  personalizado: 'Período Personalizado',
}

export function resolvePeriod(preset: PeriodPreset, customStart?: string, customEnd?: string) {
  const today = dayjs()
  switch (preset) {
    case 'hoje':
      return { start: today.format('YYYY-MM-DD'), end: today.format('YYYY-MM-DD') }
    case 'ontem':
      return {
        start: today.subtract(1, 'day').format('YYYY-MM-DD'),
        end: today.subtract(1, 'day').format('YYYY-MM-DD'),
      }
    case 'semana':
      return { start: today.startOf('week').format('YYYY-MM-DD'), end: today.format('YYYY-MM-DD') }
    case '7dias':
      return { start: today.subtract(6, 'day').format('YYYY-MM-DD'), end: today.format('YYYY-MM-DD') }
    case '30dias':
      return { start: today.subtract(29, 'day').format('YYYY-MM-DD'), end: today.format('YYYY-MM-DD') }
    case 'mes':
      return { start: today.startOf('month').format('YYYY-MM-DD'), end: today.format('YYYY-MM-DD') }
    case 'ano':
      return { start: today.startOf('year').format('YYYY-MM-DD'), end: today.format('YYYY-MM-DD') }
    case 'personalizado':
      return { start: customStart || today.format('YYYY-MM-DD'), end: customEnd || today.format('YYYY-MM-DD') }
  }
}
