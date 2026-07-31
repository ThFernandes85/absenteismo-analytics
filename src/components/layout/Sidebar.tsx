import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  CalendarDays,
  ShieldCheck,
  Building2,
  UserCog,
  Landmark,
  Settings,
  LineChart,
  Clock,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { PERMISSIONS } from '@/lib/permissions'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/funcionarios', label: 'Funcionários', icon: Users },
  { to: '/ocorrencias', label: 'Ocorrências', icon: ClipboardList },
  { to: '/horas-extras', label: 'Horas Extras', icon: Clock },
  { to: '/calendario', label: 'Calendário', icon: CalendarDays },
]

const adminNavItems = [
  { to: '/auditoria', label: 'Auditoria', icon: ShieldCheck },
  { to: '/usuarios', label: 'Usuários e Permissões', icon: UserCog },
  { to: '/centros-de-lucro', label: 'Centros de Lucro', icon: Landmark },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
]

function SidebarLink({ to, label, icon: Icon, end }: { to: string; label: string; icon: LucideIcon; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
            : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]',
        )
      }
    >
      <Icon className="h-4 w-4" />
      {label}
    </NavLink>
  )
}

export function Sidebar() {
  const { role } = useAuth()

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] md:flex">
      <div className="flex h-14 items-center gap-2 border-b border-[var(--color-border)] px-4">
        <Building2 className="h-5 w-5 text-[var(--color-accent)]" />
        <span className="text-sm font-semibold">Controle de Absenteísmo</span>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {PERMISSIONS.viewDashboard(role) && navItems.map((item) => <SidebarLink key={item.to} {...item} />)}
        {PERMISSIONS.viewExecutiveDashboard(role) && (
          <SidebarLink to="/executivo" label="Painel Executivo" icon={LineChart} />
        )}
        {PERMISSIONS.viewAudit(role) && (
          <>
            <p className="px-3 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              Administração
            </p>
            {adminNavItems.map((item) => (
              <SidebarLink key={item.to} {...item} />
            ))}
          </>
        )}
      </nav>
    </aside>
  )
}
