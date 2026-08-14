import { HashRouter, Routes, Route } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { queryClient } from '@/lib/queryClient'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute, AdminMasterRoute, OperationalRoute, ExecutiveRoute } from '@/components/layout/ProtectedRoute'
import { LoginPage } from '@/features/auth/LoginPage'
import { UpdatePasswordPage } from '@/features/auth/UpdatePasswordPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { EmployeesPage } from '@/features/employees/EmployeesPage'
import { HiddenEmployeesPage } from '@/features/employees/HiddenEmployeesPage'
import { EmployeeDetailPage } from '@/features/employees/EmployeeDetailPage'
import { OccurrencesPage } from '@/features/occurrences/OccurrencesPage'
import { OvertimePage } from '@/features/overtime/OvertimePage'
import { CalendarPage } from '@/features/calendar/CalendarPage'
import { AuditPage } from '@/features/audit/AuditPage'
import { UsersPage } from '@/features/admin/UsersPage'
import { CostCentersPage } from '@/features/admin/CostCentersPage'
import { SettingsPage } from '@/features/admin/SettingsPage'
import { ExecutiveDashboardPage } from '@/features/executive/ExecutiveDashboardPage'

function AppRoutes() {
  const { passwordRecovery } = useAuth()

  // Link de "esqueci minha senha" já loga o usuário automaticamente; sem
  // essa checagem ele cairia direto no Dashboard sem poder trocar a senha.
  if (passwordRecovery) return <UpdatePasswordPage />

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route element={<OperationalRoute />}>
            <Route index element={<DashboardPage />} />
            <Route path="funcionarios" element={<EmployeesPage />} />
            <Route path="funcionarios/ocultos" element={<HiddenEmployeesPage />} />
            <Route path="funcionarios/:id" element={<EmployeeDetailPage />} />
            <Route path="ocorrencias" element={<OccurrencesPage />} />
            <Route path="horas-extras" element={<OvertimePage />} />
            <Route path="calendario" element={<CalendarPage />} />
          </Route>
          <Route element={<ExecutiveRoute />}>
            <Route path="executivo" element={<ExecutiveDashboardPage />} />
          </Route>
          <Route element={<AdminMasterRoute />}>
            <Route path="auditoria" element={<AuditPage />} />
            <Route path="usuarios" element={<UsersPage />} />
            <Route path="centros-de-lucro" element={<CostCentersPage />} />
            <Route path="configuracoes" element={<SettingsPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <HashRouter>
          <AuthProvider>
            <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
            <AppRoutes />
          </AuthProvider>
        </HashRouter>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
