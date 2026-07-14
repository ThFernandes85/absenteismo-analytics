import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { FullPageSpinner } from '@/components/ui/Spinner'
import { PERMISSIONS } from '@/lib/permissions'

export function ProtectedRoute() {
  const { session, profile, loading } = useAuth()

  if (loading) return <FullPageSpinner />
  if (!session) return <Navigate to="/login" replace />
  if (!profile || !profile.active) {
    return (
      <div className="flex h-screen w-screen items-center justify-center px-4 text-center">
        <p className="text-sm text-[var(--color-text-muted)]">
          Sua conta ainda não possui um perfil ativo. Contate o Admin Master.
        </p>
      </div>
    )
  }
  return <Outlet />
}

export function AdminMasterRoute() {
  const { profile } = useAuth()
  if (profile?.role !== 'admin_master') return <Navigate to="/" replace />
  return <Outlet />
}

export function OperationalRoute() {
  const { role } = useAuth()
  if (!PERMISSIONS.viewDashboard(role)) return <Navigate to="/executivo" replace />
  return <Outlet />
}

export function ExecutiveRoute() {
  const { role } = useAuth()
  if (!PERMISSIONS.viewExecutiveDashboard(role)) return <Navigate to="/" replace />
  return <Outlet />
}
