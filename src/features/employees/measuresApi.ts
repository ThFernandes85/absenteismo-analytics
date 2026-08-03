import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
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
      // Suspensão gera falta automaticamente para cada dia suspenso, do
      // início ao fim. Lançamos as ocorrências antes da medida: se algum
      // dia já tiver um registro (presença, atestado, férias etc.), o
      // insert falha por inteiro e nada fica salvo pela metade.
      if (input.type === 'suspensao' && input.suspension_days) {
        const days = Array.from({ length: input.suspension_days }, (_, i) => ({
          employee_id: input.employee_id,
          occurrence_date: dayjs(input.measure_date).add(i, 'day').format('YYYY-MM-DD'),
          end_date: null,
          type: 'falta' as const,
          notes: `Suspensão administrativa — ${input.description}`,
          reason: 'Suspensão administrativa',
          days_count: null,
          cid: null,
          time_of_day: null,
          hours: null,
          overtime_percentage: null,
          responsible_user_id: profile!.id,
        }))
        const { error: occurrencesError } = await supabase.from('occurrences').insert(days)
        if (occurrencesError) throw occurrencesError
      }

      const { error } = await supabase
        .from('administrative_measures')
        .insert({ ...input, responsible_user_id: profile!.id })
      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['administrative_measures', vars.employee_id] })
      if (vars.type === 'suspensao') queryClient.invalidateQueries({ queryKey: ['occurrences'] })
    },
  })
}
