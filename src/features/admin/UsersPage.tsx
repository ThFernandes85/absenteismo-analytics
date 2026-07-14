import { useState } from 'react'
import { Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { FullPageSpinner } from '@/components/ui/Spinner'
import { ROLE_LABELS } from '@/lib/constants'
import { useCostCentersList } from './costCentersApi'
import { useUsersList } from './usersApi'
import { UserEditModal } from './UserEditModal'
import type { Profile } from '@/types/database.types'

export function UsersPage() {
  const { data: users, isLoading } = useUsersList()
  const { data: costCenters } = useCostCentersList()
  const [editing, setEditing] = useState<Profile | null>(null)

  const costCenterName = (id: string | null) => costCenters?.find((cc) => cc.id === id)?.name ?? '—'

  if (isLoading) return <FullPageSpinner />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Usuários e Permissões</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Gerencie o perfil, centro de lucro e acesso de cada usuário.
        </p>
      </div>

      <Card>
        <CardContent className="flex items-start gap-2 text-sm text-[var(--color-text-muted)]">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Para criar um novo usuário, use <strong>Authentication → Add user</strong> no Dashboard do Supabase,
            definindo <code>full_name</code> e <code>role</code> nos metadados. O perfil é criado automaticamente
            e passa a aparecer aqui.
          </p>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-hover)] text-left text-xs text-[var(--color-text-muted)]">
              <th className="px-4 py-2.5 font-medium">Nome</th>
              <th className="px-4 py-2.5 font-medium">Perfil</th>
              <th className="px-4 py-2.5 font-medium">Centro de Lucro</th>
              <th className="px-4 py-2.5 font-medium">Situação</th>
              <th className="px-4 py-2.5 font-medium" />
            </tr>
          </thead>
          <tbody>
            {users?.map((user) => (
              <tr key={user.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-hover)]">
                <td className="px-4 py-2.5 font-medium">{user.full_name}</td>
                <td className="px-4 py-2.5">{ROLE_LABELS[user.role]}</td>
                <td className="px-4 py-2.5">{costCenterName(user.cost_center_id)}</td>
                <td className="px-4 py-2.5">
                  <Badge
                    className={
                      user.active
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                        : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                    }
                  >
                    {user.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Button size="sm" variant="secondary" onClick={() => setEditing(user)}>
                    Editar
                  </Button>
                </td>
              </tr>
            ))}
            {users?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[var(--color-text-muted)]">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <UserEditModal open={!!editing} onClose={() => setEditing(null)} user={editing} />
    </div>
  )
}
