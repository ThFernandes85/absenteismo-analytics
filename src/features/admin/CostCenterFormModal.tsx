import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Label, FieldError } from '@/components/ui/Input'
import { useCreateCostCenter, useUpdateCostCenter } from './costCentersApi'
import type { CostCenter } from '@/types/database.types'

const schema = z.object({
  code: z.string().min(1, 'Informe o código'),
  name: z.string().min(1, 'Informe o nome'),
})

type FormValues = z.infer<typeof schema>

export function CostCenterFormModal({
  open,
  onClose,
  costCenter,
}: {
  open: boolean
  onClose: () => void
  costCenter?: CostCenter | null
}) {
  const createCostCenter = useCreateCostCenter()
  const updateCostCenter = useUpdateCostCenter()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (open) {
      reset(costCenter ? { code: costCenter.code, name: costCenter.name } : { code: '', name: '' })
    }
  }, [open, costCenter, reset])

  async function onSubmit(values: FormValues) {
    try {
      if (costCenter) {
        await updateCostCenter.mutateAsync({ id: costCenter.id, input: values })
        toast.success('Centro de lucro atualizado.')
      } else {
        await createCostCenter.mutateAsync(values)
        toast.success('Centro de lucro criado.')
      }
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      toast.error(message.includes('duplicate') ? 'Já existe um centro de lucro com esse código.' : 'Erro ao salvar.')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={costCenter ? 'Editar Centro de Lucro' : 'Novo Centro de Lucro'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="code">Código</Label>
          <Input id="code" {...register('code')} />
          <FieldError message={errors.code?.message} />
        </div>
        <div>
          <Label htmlFor="name">Nome / Site</Label>
          <Input id="name" {...register('name')} />
          <FieldError message={errors.name?.message} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando…' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
