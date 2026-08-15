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
import { SCHEDULE_TYPE_LABELS } from '@/lib/constants'
import { useCostCenters, useCreateEmployee, useUpdateEmployee, type EmployeeInput } from './api'
import type { Employee, EmployeeScheduleType } from '@/types/database.types'

const schema = z
  .object({
    registration_number: z.string().min(1, 'Informe a matrícula'),
    full_name: z.string().min(2, 'Informe o nome completo'),
    position: z.string().min(1, 'Informe o cargo'),
    department: z.string().min(1, 'Informe o setor'),
    cost_center_id: z.string().min(1, 'Selecione o centro de lucro'),
    admission_date: z.string().min(1, 'Informe a data de admissão'),
    schedule_type: z.custom<EmployeeScheduleType>((v) => typeof v === 'string' && v in SCHEDULE_TYPE_LABELS),
    schedule_reference_date: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine((data) => data.schedule_type !== 'escala_3x3' || !!data.schedule_reference_date, {
    message: 'Informe um dia de trabalho conhecido para calcular a escala',
    path: ['schedule_reference_date'],
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
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const scheduleType = watch('schedule_type')

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
              schedule_type: employee.schedule_type,
              schedule_reference_date: employee.schedule_reference_date ?? '',
              notes: employee.notes ?? '',
            }
          : {
              registration_number: '',
              full_name: '',
              position: '',
              department: '',
              cost_center_id: '',
              admission_date: '',
              schedule_type: 'padrao',
              schedule_reference_date: '',
              notes: '',
            },
      )
    }
  }, [open, employee, reset])

  async function onSubmit(values: FormValues) {
    const input: EmployeeInput = {
      ...values,
      schedule_reference_date: values.schedule_type === 'escala_3x3' ? values.schedule_reference_date! : null,
      notes: values.notes || null,
    }
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
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="schedule_type">Escala de Trabalho</Label>
            <Select id="schedule_type" {...register('schedule_type')}>
              {(Object.keys(SCHEDULE_TYPE_LABELS) as EmployeeScheduleType[]).map((t) => (
                <option key={t} value={t}>
                  {SCHEDULE_TYPE_LABELS[t]}
                </option>
              ))}
            </Select>
          </div>
          {scheduleType === 'escala_3x3' && (
            <div>
              <Label htmlFor="schedule_reference_date">Um Dia de Trabalho Conhecido</Label>
              <Input id="schedule_reference_date" type="date" {...register('schedule_reference_date')} />
              <FieldError message={errors.schedule_reference_date?.message} />
            </div>
          )}
        </div>
        {scheduleType === 'escala_3x3' && (
          <p className="-mt-2 text-xs text-[var(--color-text-muted)]">
            Informe qualquer data em que o colaborador estava trabalhando. O sistema calcula sozinho, a partir dela,
            quais dias são de trabalho ou folga no ciclo de 3x3.
          </p>
        )}
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
