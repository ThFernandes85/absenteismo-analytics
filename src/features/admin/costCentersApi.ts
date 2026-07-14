import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { CostCenter } from '@/types/database.types'

const COST_CENTERS_KEY = ['cost_centers'] as const

export interface CostCenterInput {
  code: string
  name: string
}

export function useCostCentersList() {
  return useQuery({
    queryKey: COST_CENTERS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase.from('cost_centers').select('*').order('code')
      if (error) throw error
      return data as CostCenter[]
    },
  })
}

export function useCreateCostCenter() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CostCenterInput) => {
      const { error } = await supabase.from('cost_centers').insert(input)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: COST_CENTERS_KEY }),
  })
}

export function useUpdateCostCenter() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: CostCenterInput }) => {
      const { error } = await supabase.from('cost_centers').update(input).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: COST_CENTERS_KEY }),
  })
}
