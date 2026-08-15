import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { CostCenter, Employee, EmployeeScheduleType, EmployeeStatus } from '@/types/database.types'
import { useAuth } from '@/contexts/AuthContext'

export interface EmployeeInput {
  registration_number: string
  full_name: string
  position: string
  department: string
  cost_center_id: string
  admission_date: string
  schedule_type: EmployeeScheduleType
  schedule_reference_date: string | null
  notes: string | null
}

const EMPLOYEES_KEY = ['employees'] as const

export function useEmployees(status: EmployeeStatus | 'all') {
  return useQuery({
    queryKey: [...EMPLOYEES_KEY, status],
    queryFn: async () => {
      let query = supabase.from('employees').select('*').order('full_name', { ascending: true })

      if (status !== 'all') {
        query = query.eq('status', status)
      }

      const { data, error } = await query
      if (error) throw error
      return data as Employee[]
    },
  })
}

export function useEmployee(id: string | undefined) {
  return useQuery({
    queryKey: [...EMPLOYEES_KEY, 'detail', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('employees').select('*').eq('id', id!).single()
      if (error) throw error
      return data as Employee
    },
    enabled: !!id,
  })
}

export function useCostCenters() {
  return useQuery({
    queryKey: ['cost_centers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('cost_centers').select('*').order('name')
      if (error) throw error
      return data as CostCenter[]
    },
  })
}

export function useCreateEmployee() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()
  return useMutation({
    mutationFn: async (input: EmployeeInput) => {
      const { error } = await supabase.from('employees').insert({
        ...input,
        status: 'ativo',
        created_by: profile?.id,
        updated_by: profile?.id,
      })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: EMPLOYEES_KEY }),
  })
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: EmployeeInput }) => {
      const { error } = await supabase
        .from('employees')
        .update({ ...input, updated_by: profile?.id })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: EMPLOYEES_KEY }),
  })
}

export function useSetEmployeeStatus() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()
  return useMutation({
    mutationFn: async ({
      id,
      status,
      deactivationReason,
    }: {
      id: string
      status: EmployeeStatus
      deactivationReason?: string
    }) => {
      const { error } = await supabase
        .from('employees')
        .update({
          status,
          updated_by: profile?.id,
          deactivation_reason: status === 'inativo' ? (deactivationReason ?? null) : null,
        })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: EMPLOYEES_KEY }),
  })
}
