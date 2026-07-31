import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { PositionOvertimeRate } from '@/types/database.types'

const RATES_KEY = ['position_overtime_rates'] as const

export function usePositionOvertimeRates() {
  return useQuery({
    queryKey: RATES_KEY,
    queryFn: async () => {
      const { data, error } = await supabase.from('position_overtime_rates').select('*')
      if (error) throw error
      return data as PositionOvertimeRate[]
    },
  })
}

export function useSetPositionOvertimeRate() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()
  return useMutation({
    mutationFn: async ({
      position,
      rate_50,
      rate_100,
    }: {
      position: string
      rate_50: number
      rate_100: number
    }) => {
      const { error } = await supabase
        .from('position_overtime_rates')
        .upsert({ position, rate_50, rate_100, updated_by: profile?.id }, { onConflict: 'position' })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: RATES_KEY }),
  })
}
