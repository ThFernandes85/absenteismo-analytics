import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Attachment, Occurrence, OccurrenceType, OvertimePercentage } from '@/types/database.types'

const OCCURRENCES_KEY = ['occurrences'] as const

export interface OccurrenceInput {
  employee_id: string
  occurrence_date: string
  end_date: string | null
  type: OccurrenceType
  notes: string | null
  reason: string | null
  days_count: number | null
  cid: string | null
  time_of_day: string | null
  hours: number | null
  overtime_percentage: OvertimePercentage | null
}

export function useEmployeeOccurrences(employeeId: string | undefined) {
  return useQuery({
    queryKey: [...OCCURRENCES_KEY, 'by-employee', employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('occurrences')
        .select('*')
        .eq('employee_id', employeeId!)
        .order('occurrence_date', { ascending: false })
      if (error) throw error
      return data as Occurrence[]
    },
    enabled: !!employeeId,
  })
}

export function useOccurrencesByDateRange(startDate: string, endDate: string) {
  return useQuery({
    queryKey: [...OCCURRENCES_KEY, 'range', startDate, endDate],
    queryFn: async () => {
      // Tipos sem período (end_date nulo) precisam de occurrence_date dentro
      // do intervalo; férias/atestado (com período) só precisam que o
      // período se sobreponha ao intervalo — senão um atestado que começou
      // antes do início do filtro, mas ainda está em curso, desaparecia.
      const { data, error } = await supabase
        .from('occurrences')
        .select('*, employees(full_name, department, position, cost_center_id)')
        .lte('occurrence_date', endDate)
        .or(`end_date.gt.${startDate},and(end_date.is.null,occurrence_date.gte.${startDate})`)
        .order('occurrence_date', { ascending: false })
      if (error) throw error
      return data as (Occurrence & {
        employees: { full_name: string; department: string; position: string; cost_center_id: string }
      })[]
    },
  })
}

export function useOccurrencesByDate(date: string) {
  return useQuery({
    queryKey: [...OCCURRENCES_KEY, 'day', date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('occurrences')
        .select('*, employees(full_name, cost_center_id)')
        .eq('occurrence_date', date)
      if (error) throw error
      return data as (Occurrence & { employees: { full_name: string; cost_center_id: string } })[]
    },
    enabled: !!date,
  })
}

export function useActiveLeaveToday() {
  const today = dayjs().format('YYYY-MM-DD')
  return useQuery({
    queryKey: [...OCCURRENCES_KEY, 'active-leave', today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('occurrences')
        .select('employee_id, type, occurrence_date, end_date, employees(cost_center_id)')
        .in('type', ['ferias', 'atestado'])
        .lte('occurrence_date', today)
        .gt('end_date', today)
      if (error) throw error
      return data as unknown as (Pick<Occurrence, 'employee_id' | 'type' | 'occurrence_date' | 'end_date'> & {
        employees: { cost_center_id: string }
      })[]
    },
  })
}

export function useCreateOccurrence() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()
  return useMutation({
    mutationFn: async (input: OccurrenceInput) => {
      const { data, error } = await supabase
        .from('occurrences')
        .insert({ ...input, responsible_user_id: profile!.id })
        .select()
        .single()
      if (error) throw error
      return data as Occurrence
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: OCCURRENCES_KEY }),
  })
}

export function useDeleteOccurrence() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('occurrences').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: OCCURRENCES_KEY }),
  })
}

export function useOccurrenceAttachments(occurrenceId: string | undefined) {
  return useQuery({
    queryKey: ['attachments', occurrenceId],
    queryFn: async () => {
      const { data, error } = await supabase.from('attachments').select('*').eq('occurrence_id', occurrenceId!)
      if (error) throw error
      return data as Attachment[]
    },
    enabled: !!occurrenceId,
  })
}

export function useUploadAttachment() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()
  return useMutation({
    mutationFn: async ({ occurrenceId, file }: { occurrenceId: string; file: File }) => {
      const path = `${occurrenceId}/${dayjs().valueOf()}-${file.name}`
      const { error: uploadError } = await supabase.storage.from('attachments').upload(path, file)
      if (uploadError) throw uploadError

      const { error } = await supabase.from('attachments').insert({
        occurrence_id: occurrenceId,
        file_path: path,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        uploaded_by: profile!.id,
      })
      if (error) throw error
    },
    onSuccess: (_data, vars) => queryClient.invalidateQueries({ queryKey: ['attachments', vars.occurrenceId] }),
  })
}

export async function getAttachmentUrl(path: string) {
  const { data, error } = await supabase.storage.from('attachments').createSignedUrl(path, 60 * 10)
  if (error) throw error
  return data.signedUrl
}
