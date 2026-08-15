export type UserRole = 'admin_master' | 'gerente_unidade' | 'assistente_administrativo' | 'diretoria'
export type EmployeeStatus = 'ativo' | 'inativo' | 'afastado'
export type EmployeeScheduleType = 'padrao' | 'escala_3x3'
export type OccurrenceType = 'presenca' | 'falta' | 'atestado' | 'declaracao' | 'hora_extra' | 'ferias'
export type OvertimePercentage = '50' | '100'
export type MeasureType = 'termo_orientacao' | 'advertencia' | 'suspensao'

export interface CostCenter {
  id: string
  code: string
  name: string
  created_at: string
}

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  cost_center_id: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface Employee {
  id: string
  registration_number: string
  full_name: string
  position: string
  department: string
  cost_center_id: string
  admission_date: string
  status: EmployeeStatus
  schedule_type: EmployeeScheduleType
  schedule_reference_date: string | null
  notes: string | null
  deactivation_reason: string | null
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

export interface Occurrence {
  id: string
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
  responsible_user_id: string
  created_at: string
  updated_at: string
}

export interface Attachment {
  id: string
  occurrence_id: string
  file_path: string
  file_name: string
  file_type: string
  file_size: number
  uploaded_by: string
  created_at: string
}

export interface AdministrativeMeasure {
  id: string
  employee_id: string
  type: MeasureType
  measure_date: string
  description: string
  suspension_days: number | null
  attachment_path: string | null
  responsible_user_id: string
  created_at: string
}

export interface AuditLog {
  id: number
  user_id: string | null
  user_role: UserRole | null
  action: string
  table_name: string
  record_id: string | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
}

export interface CompanySettings {
  id: number
  average_daily_cost: number
  target_absenteeism_rate: number
  updated_by: string | null
  updated_at: string
}

export interface PositionOvertimeRate {
  position: string
  rate_50: number
  rate_100: number
  updated_by: string | null
  updated_at: string
}

