import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Label, FieldError } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { useCostCenters, useCreateEmployee, useUpdateEmployee, type EmployeeInput } from './api'
import type { Employee } from '@/types/database.types'

const schema = z.object({
  registration_number: z.string().min(1, 'Informe a matrícula'),
  full_name: z.string().min(2, 'Informe o nome completo'),
  position: z.string().min(1, 'Informe o cargo'),
  department: z.string().min(1, 'Informe o setor'),
  cost_center_id: z.string().min(1, 'Selecione o centro de lucro'),
  admission_date: z.string().min(1, 'Informe a data de admissão'),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface EmployeeFormModalProps {
  open: boolean
  onClose: () => void
  employee?: Employee | null
}

export function EmployeeFormModal({ open, onClose, employee }: EmployeeFormModalProps) {
  const { data: costCenters } = useCostCenters()
  const createEmployee = useCreateEmployee()
  const updateEmployee = useUpdateEmployee()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (open) {
      reset(
        employee
          ? {
              registration_number: employee.registration_number,
              full_name: employee.full_name,
              position: employee.position,
              department: employee.department,
              cost_center_id: employee.cost_center_id,
              admission_date: employee.admission_date,
              notes: employee.notes ?? '',
            }
          : {
              registration_number: '',
              full_name: '',
              position: '',
              department: '',
              cost_center_id: '',
              admission_date: '',
              notes: '',
            },
      )
    }
  }, [open, employee, reset])

  async function onSubmit(values: FormValues) {
    const input: EmployeeInput = { ...values, notes: values.notes || null }
    try {
      if (employee) {
        await updateEmployee.mutateAsync({ id: employee.id, input })
        toast.success('Funcionário atualizado com sucesso.')
      } else {
        await createEmployee.mutateAsync(input)
        toast.success('Funcionário cadastrado com sucesso.')
      }
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar funcionário.'
      toast.error(message.includes('duplicate') ? 'Já existe um funcionário com essa matrícula.' : message)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={employee ? 'Editar Funcionário' : 'Novo Funcionário'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="registration_number">Matrícula</Label>
            <Input id="registration_number" {...register('registration_number')} />
            <FieldError message={errors.registration_number?.message} />
          </div>
          <div>
            <Label htmlFor="admission_date">Data de Admissão</Label>
            <Input id="admission_date" type="date" {...register('admission_date')} />
            <FieldError message={errors.admission_date?.message} />
          </div>
        </div>
        <div>
          <Label htmlFor="full_name">Nome Completo</Label>
          <Input id="full_name" {...register('full_name')} />
          <FieldError message={errors.full_name?.message} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="position">Cargo</Label>
            <Input id="position" {...register('position')} />
            <FieldError message={errors.position?.message} />
          </div>
          <div>
            <Label htmlFor="department">Setor</Label>
            <Input id="department" {...register('department')} />
            <FieldError message={errors.department?.message} />
          </div>
        </div>
        <div>
          <Label htmlFor="cost_center_id">Centro de Lucro</Label>
          <Select id="cost_center_id" {...register('cost_center_id')}>
            <option value="">Selecione…</option>
            {costCenters?.map((cc) => (
              <option key={cc.id} value={cc.id}>
                {cc.code} — {cc.name}
              </option>
            ))}
          </Select>
          <FieldError message={errors.cost_center_id?.message} />
        </div>
        <div>
          <Label htmlFor="notes">Observações</Label>
          <Textarea id="notes" {...register('notes')} />
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
