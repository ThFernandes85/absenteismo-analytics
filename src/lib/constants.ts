import type { EmployeeStatus, MeasureType, OccurrenceType, UserRole } from '@/types/database.types'

export const ROLE_LABELS: Record<UserRole, string> = {
  admin_master: 'Admin Master',
  gerente_unidade: 'Gerente da Unidade',
  assistente_administrativo: 'Assistente Administrativo',
  diretoria: 'Diretoria',
}

export const OCCURRENCE_LABELS: Record<OccurrenceType, string> = {
  presenca: 'Presença',
  falta: 'Falta',
  atestado: 'Atestado',
  declaracao: 'Declaração de Comparecimento',
  hora_extra: 'Hora Extra',
  ferias: 'Férias',
}

export const OCCURRENCE_ICONS: Record<OccurrenceType, string> = {
  presenca: '✅',
  falta: '❌',
  atestado: '🏥',
  declaracao: '📄',
  hora_extra: '⏰',
  ferias: '🏖️',
}

export const OCCURRENCE_COLORS: Record<OccurrenceType, string> = {
  presenca: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400',
  falta: 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400',
  atestado: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400',
  declaracao: 'text-sky-600 bg-sky-50 dark:bg-sky-500/10 dark:text-sky-400',
  hora_extra: 'text-violet-600 bg-violet-50 dark:bg-violet-500/10 dark:text-violet-400',
  ferias: 'text-teal-600 bg-teal-50 dark:bg-teal-500/10 dark:text-teal-400',
}

export const EMPLOYEE_STATUS_LABELS: Record<EmployeeStatus, string> = {
  ativo: 'Ativo',
  afastado: 'Afastado',
  inativo: 'Inativo',
}

export const EMPLOYEE_STATUS_COLORS: Record<EmployeeStatus, string> = {
  ativo: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  afastado: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  inativo: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
}

export const MEASURE_LABELS: Record<MeasureType, string> = {
  termo_orientacao: 'Termo de Orientação',
  advertencia: 'Advertência',
  suspensao: 'Suspensão',
}

export const STANDARD_WORKDAY_HOURS = 8

export const CHART_PALETTE = [
  '#2563eb',
  '#f43f5e',
  '#f59e0b',
  '#0ea5e9',
  '#8b5cf6',
  '#10b981',
  '#ec4899',
  '#64748b',
]
