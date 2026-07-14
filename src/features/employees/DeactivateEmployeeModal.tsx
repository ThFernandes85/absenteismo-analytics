import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Label, FieldError } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { useSetEmployeeStatus } from './api'
import type { Employee } from '@/types/database.types'

const schema = z.object({
  reason: z.string().min(5, 'Descreva o motivo da desativação (mínimo 5 caracteres)'),
})

type FormValues = z.infer<typeof schema>

export function DeactivateEmployeeModal({
  open,
  onClose,
  employee,
}: {
  open: boolean
  onClose: () => void
  employee: Employee | null
}) {
  const setStatus = useSetEmployeeStatus()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { reason: '' } })

  if (!employee) return null

  async function onSubmit(values: FormValues) {
    try {
      await setStatus.mutateAsync({ id: employee!.id, status: 'inativo', deactivationReason: values.reason })
      toast.success(`${employee!.full_name} desativado.`)
      reset()
      onClose()
    } catch {
      toast.error('Erro ao desativar funcionário.')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Desativar ${employee.full_name}`}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm text-[var(--color-text-muted)]">
          O funcionário será movido para "Funcionários Ocultos". Nenhum dado é apagado — o histórico completo,
          incluindo este motivo, fica preservado na Auditoria.
        </p>
        <div>
          <Label htmlFor="reason">Motivo da desativação</Label>
          <Textarea id="reason" autoFocus placeholder="Ex: Desligamento, término de contrato, transferência…" {...register('reason')} />
          <FieldError message={errors.reason?.message} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="danger" disabled={isSubmitting}>
            {isSubmitting ? 'Desativando…' : 'Desativar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
