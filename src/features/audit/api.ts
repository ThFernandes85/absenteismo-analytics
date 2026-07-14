import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { AuditLog } from '@/types/database.types'

export interface AuditFilters {
  tableName: string
  action: string
  startDate: string
  endDate: string
  page: number
  pageSize: number
}

export function useAuditLog(filters: AuditFilters) {
  return useQuery({
    queryKey: ['audit_log', filters],
    queryFn: async () => {
      const from = filters.page * filters.pageSize
      const to = from + filters.pageSize - 1

      let query = supabase
        .from('audit_log')
        .select('*, profiles(full_name)', { count: 'exact' })
        .gte('created_at', `${filters.startDate}T00:00:00`)
        .lte('created_at', `${filters.endDate}T23:59:59`)
        .order('created_at', { ascending: false })
        .range(from, to)

      if (filters.tableName) query = query.eq('table_name', filters.tableName)
      if (filters.action) query = query.eq('action', filters.action)

      const { data, error, count } = await query
      if (error) throw error
      return { rows: data as (AuditLog & { profiles: { full_name: string } | null })[], count: count ?? 0 }
    },
  })
}
