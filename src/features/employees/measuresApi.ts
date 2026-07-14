import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { AdministrativeMeasure, MeasureType } from '@/types/database.types'

export interface MeasureInput {
  employee_id: string
  type: MeasureType
  measure_date: string
  description: string
  suspension_days: number | null
}

export function useEmployeeMeasures(employeeId: string | undefined) {
  return useQuery({
    queryKey: ['administrative_measures', employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('administrative_measures')
        .select('*')
        .eq('employee_id', employeeId!)
        .order('measure_date', { ascending: false })
      if (error) throw error
      return data as AdministrativeMeasure[]
    },
    enabled: !!employeeId,
  })
}

export function useCreateMeasure() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()
  return useMutation({
    mutationFn: async (input: MeasureInput) => {
      const { error } = await supabase
        .from('administrative_measures')
        .insert({ ...input, responsible_user_id: profile!.id })
      if (error) throw error
    },
    onSuccess: (_data, vars) =>
      queryClient.invalidateQueries({ queryKey: ['administrative_measures', vars.employee_id] }),
  })
}
