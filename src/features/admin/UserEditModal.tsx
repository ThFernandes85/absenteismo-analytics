import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { ROLE_LABELS } from '@/lib/constants'
import { useCostCentersList } from './costCentersApi'
import { useUpdateUser } from './usersApi'
import type { Profile, UserRole } from '@/types/database.types'

const schema = z.object({
  role: z.custom<UserRole>((v) => typeof v === 'string' && v in ROLE_LABELS),
  cost_center_id: z.string(),
  active: z.enum(['true', 'false']),
})

type FormValues = z.infer<typeof schema>

export function UserEditModal({
  open,
  onClose,
  user,
}: {
  open: boolean
  onClose: () => void
  user: Profile | null
}) {
  const { data: costCenters } = useCostCentersList()
  const updateUser = useUpdateUser()
  const { register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: user
      ? {
          role: user.role,
          cost_center_id: user.cost_center_id ?? '',
          active: user.active ? 'true' : 'false',
        }
      : undefined,
  })

  if (!user) return null

  async function onSubmit(values: FormValues) {
    try {
      await updateUser.mutateAsync({
        id: user!.id,
        role: values.role,
        cost_center_id: values.cost_center_id || null,
        active: values.active === 'true',
      })
      toast.success('Usuário atualizado.')
      onClose()
    } catch {
      toast.error('Erro ao atualizar usuário.')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Editar Usuário — ${user.full_name}`}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="role">Perfil</Label>
          <Select id="role" {...register('role')}>
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="cost_center_id">Centro de Lucro</Label>
          <Select id="cost_center_id" {...register('cost_center_id')}>
            <option value="">Sem centro de lucro</option>
            {costCenters?.map((cc) => (
              <option key={cc.id} value={cc.id}>
                {cc.code} — {cc.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="active">Situação</Label>
          <Select id="active" {...register('active')}>
            <option value="true">Ativo</option>
            <option value="false">Inativo (acesso bloqueado)</option>
          </Select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={formState.isSubmitting}>
            {formState.isSubmitting ? 'Salvando…' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
