import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { CompanySettings } from '@/types/database.types'

const SETTINGS_KEY = ['company_settings'] as const

export function useCompanySettings() {
  return useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase.from('company_settings').select('*').eq('id', 1).single()
      if (error) throw error
      return data as CompanySettings
    },
  })
}

export function useUpdateCompanySettings() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()
  return useMutation({
    mutationFn: async (input: { average_daily_cost: number; target_absenteeism_rate: number }) => {
      const { error } = await supabase
        .from('company_settings')
        .update({ ...input, updated_by: profile?.id })
        .eq('id', 1)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SETTINGS_KEY }),
  })
}
