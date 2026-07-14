import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Profile, UserRole } from '@/types/database.types'

const USERS_KEY = ['profiles', 'all'] as const

export function useUsersList() {
  return useQuery({
    queryKey: USERS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('full_name')
      if (error) throw error
      return data as Profile[]
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      role,
      cost_center_id,
      active,
    }: {
      id: string
      role: UserRole
      cost_center_id: string | null
      active: boolean
    }) => {
      const { error } = await supabase.from('profiles').update({ role, cost_center_id, active }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USERS_KEY }),
  })
}
