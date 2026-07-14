import type { UserRole } from '@/types/database.types'

const OPERATIONAL_ROLES: UserRole[] = ['admin_master', 'gerente_unidade', 'assistente_administrativo']

export const PERMISSIONS = {
  manageUsers: (role: UserRole | null) => role === 'admin_master',
  viewAudit: (role: UserRole | null) => role === 'admin_master',
  manageEmployees: (role: UserRole | null) => !!role && OPERATIONAL_ROLES.includes(role),
  launchOccurrences: (role: UserRole | null) => !!role && OPERATIONAL_ROLES.includes(role),
  exportReports: (role: UserRole | null) => role !== null,
  viewDashboard: (role: UserRole | null) => !!role && OPERATIONAL_ROLES.includes(role),
  viewExecutiveDashboard: (role: UserRole | null) => role === 'admin_master' || role === 'diretoria',
}
