import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Label, FieldError } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { MEASURE_LABELS } from '@/lib/constants'
import { useCreateMeasure } from './measuresApi'
import type { MeasureType } from '@/types/database.types'

const schema = z
  .object({
    type: z.custom<MeasureType>((v) => typeof v === 'string' && v in MEASURE_LABELS),
    measure_date: z.string().min(1, 'Informe a data'),
    description: z.string().min(3, 'Descreva a medida'),
    suspension_days: z.string().optional(),
  })
  .refine((data) => data.type !== 'suspensao' || Number(data.suspension_days) > 0, {
    message: 'Informe a quantidade de dias de suspensão',
    path: ['suspension_days'],
  })

type FormValues = z.infer<typeof schema>

export function MeasureFormModal({
  open,
  onClose,
  employeeId,
}: {
  open: boolean
  onClose: () => void
  employeeId: string
}) {
  const createMeasure = useCreateMeasure()
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'termo_orientacao',
      measure_date: dayjs().format('YYYY-MM-DD'),
      description: '',
      suspension_days: '',
    },
  })
  const type = watch('type')

  async function onSubmit(values: FormValues) {
    try {
      await createMeasure.mutateAsync({
        employee_id: employeeId,
        type: values.type,
        measure_date: values.measure_date,
        description: values.description,
        suspension_days: values.type === 'suspensao' ? Number(values.suspension_days) : null,
      })
      toast.success(
        values.type === 'suspensao'
          ? `Suspensão registrada. ${values.suspension_days} dia(s) de falta lançados automaticamente.`
          : 'Medida administrativa registrada.',
      )
      reset()
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      if (message.includes('occurrences_no_overlap') || message.includes('exclusion') || message.includes('duplicate')) {
        toast.error(
          'Já existe um lançamento (presença, falta, atestado, férias etc.) para o colaborador em um dos dias da suspensão. Verifique o histórico antes de tentar novamente.',
        )
      } else {
        toast.error('Erro ao registrar medida administrativa.')
      }
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nova Medida Administrativa">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="type">Tipo</Label>
            <Select id="type" {...register('type')}>
              {Object.entries(MEASURE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="measure_date">Data</Label>
            <Input id="measure_date" type="date" {...register('measure_date')} />
            <FieldError message={errors.measure_date?.message} />
          </div>
        </div>
        {type === 'suspensao' && (
          <div>
            <Label htmlFor="suspension_days">Dias de Suspensão</Label>
            <Input id="suspension_days" type="number" min={1} {...register('suspension_days')} />
            <FieldError message={errors.suspension_days?.message} />
          </div>
        )}
        <div>
          <Label htmlFor="description">Descrição</Label>
          <Textarea id="description" {...register('description')} />
          <FieldError message={errors.description?.message} />
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
