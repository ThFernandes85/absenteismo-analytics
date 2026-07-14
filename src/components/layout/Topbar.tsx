import { Moon, Sun, LogOut } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { ROLE_LABELS } from '@/lib/constants'

export function Topbar() {
  const { theme, toggleTheme } = useTheme()
  const { profile, signOut } = useAuth()

  return (
    <header className="flex h-14 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4">
      <div />
      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="rounded-md p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] cursor-pointer"
          aria-label="Alternar tema"
        >
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>
        <div className="flex items-center gap-2 border-l border-[var(--color-border)] pl-3">
          <div className="text-right leading-tight">
            <p className="text-sm font-medium">{profile?.full_name}</p>
            <p className="text-xs text-[var(--color-text-muted)]">
              {profile ? ROLE_LABELS[profile.role] : ''}
            </p>
          </div>
          <button
            onClick={() => void signOut()}
            className="rounded-md p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] cursor-pointer"
            aria-label="Sair"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
