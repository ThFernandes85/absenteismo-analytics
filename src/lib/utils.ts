import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '—'
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

export function formatDateTime(dateStr: string | null | undefined) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
