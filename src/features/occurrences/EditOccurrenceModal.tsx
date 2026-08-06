import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Label, FieldError } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { OCCURRENCE_LABELS } from '@/lib/constants'
import { useUpdateOccurrence } from './api'
import { schema, RANGE_TYPES, type FormValues } from './OccurrenceForm'
import type { Occurrence, OccurrenceType } from '@/types/database.types'

export function EditOccurrenceModal({
  occurrence,
  employeeName,
  open,
  onClose,
}: {
  occurrence: Occurrence | null
  employeeName: string
  open: boolean
  onClose: () => void
}) {
  const updateOccurrence = useUpdateOccurrence()
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!occurrence) return
    reset({
      employee_id: occurrence.employee_id,
      type: occurrence.type,
      occurrence_date: occurrence.occurrence_date,
      end_date: occurrence.end_date ?? undefined,
      notes: occurrence.notes ?? '',
      reason: occurrence.reason ?? '',
      cid: occurrence.cid ?? '',
      time_of_day: occurrence.time_of_day ?? '',
      hours: occurrence.hours != null ? String(occurrence.hours) : '',
      overtime_percentage: occurrence.overtime_percentage ?? undefined,
    })
  }, [occurrence, reset])

  const type = watch('type')
  const occurrenceDate = watch('occurrence_date')
  const endDate = watch('end_date')
  const isRangeType = RANGE_TYPES.includes(type)
  const rangeDays =
    isRangeType && occurrenceDate && endDate && dayjs(endDate).isAfter(dayjs(occurrenceDate))
      ? dayjs(endDate).diff(dayjs(occurrenceDate), 'day')
      : null

  if (!occurrence) return null

  async function onSubmit(values: FormValues) {
    if (!occurrence) return
    try {
      const isRange = RANGE_TYPES.includes(values.type)
      const daysCount = isRange ? dayjs(values.end_date).diff(dayjs(values.occurrence_date), 'day') : null

      await updateOccurrence.mutateAsync({
        id: occurrence.id,
        input: {
          employee_id: occurrence.employee_id,
          occurrence_date: values.occurrence_date,
          end_date: isRange ? values.end_date! : null,
          type: values.type,
          notes: values.notes || null,
          reason: values.type === 'falta' ? values.reason || null : null,
          days_count: daysCount,
          cid: values.type === 'atestado' ? values.cid || null : null,
          time_of_day: values.type === 'declaracao' ? values.time_of_day || null : null,
          hours: values.type === 'hora_extra' ? Number(values.hours) : null,
          overtime_percentage: values.type === 'hora_extra' ? values.overtime_percentage ?? null : null,
        },
      })
      toast.success('Ocorrência atualizada com sucesso.')
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      if (message.includes('occurrences_no_overlap') || message.includes('exclusion') || message.includes('duplicate')) {
        toast.error('Já existe outro lançamento para este colaborador nesse período. Verifique o histórico.')
      } else {
        toast.error('Erro ao atualizar ocorrência.')
      }
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Editar Lançamento — ${employeeName}`}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label>Tipo de Ocorrência</Label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(OCCURRENCE_LABELS) as OccurrenceType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setValue('type', t)}
                className={`rounded-md border px-2 py-2 text-xs font-medium transition-colors cursor-pointer ${
                  type === t
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]'
                }`}
              >
                {OCCURRENCE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {isRangeType ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="edit_occurrence_date">Data de Início</Label>
              <Input id="edit_occurrence_date" type="date" {...register('occurrence_date')} />
              <FieldError message={errors.occurrence_date?.message} />
            </div>
            <div>
              <Label htmlFor="edit_end_date">Data de Retorno</Label>
              <Input id="edit_end_date" type="date" min={occurrenceDate} {...register('end_date')} />
              <FieldError message={errors.end_date?.message} />
            </div>
          </div>
        ) : (
          <div>
            <Label htmlFor="edit_occurrence_date">Data</Label>
            <Input id="edit_occurrence_date" type="date" {...register('occurrence_date')} />
            <FieldError message={errors.occurrence_date?.message} />
          </div>
        )}

        {isRangeType && rangeDays !== null && (
          <p className="-mt-2 text-xs text-[var(--color-text-muted)]">
            {rangeDays} dia(s) {type === 'ferias' ? 'de férias' : 'de afastamento'} · retorno em{' '}
            {dayjs(endDate).format('DD/MM/YYYY')}
          </p>
        )}

        {type === 'falta' && (
          <div>
            <Label htmlFor="edit_reason">Motivo</Label>
            <Input id="edit_reason" {...register('reason')} />
            <FieldError message={errors.reason?.message} />
          </div>
        )}

        {type === 'atestado' && (
          <div>
            <Label htmlFor="edit_cid">CID (opcional)</Label>
            <Input id="edit_cid" {...register('cid')} />
          </div>
        )}

        {type === 'declaracao' && (
          <div>
            <Label htmlFor="edit_time_of_day">Horário</Label>
            <Input id="edit_time_of_day" type="time" {...register('time_of_day')} />
            <FieldError message={errors.time_of_day?.message} />
          </div>
        )}

        {type === 'hora_extra' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="edit_hours">Quantidade de Horas</Label>
              <Input id="edit_hours" type="number" step="0.5" min={0.5} {...register('hours')} />
              <FieldError message={errors.hours?.message} />
            </div>
            <div>
              <Label htmlFor="edit_overtime_percentage">Percentual</Label>
              <Select id="edit_overtime_percentage" {...register('overtime_percentage')}>
                <option value="">Selecione…</option>
                <option value="50">50%</option>
                <option value="100">100%</option>
              </Select>
              <FieldError message={errors.overtime_percentage?.message} />
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="edit_notes">Observação</Label>
          <Textarea id="edit_notes" {...register('notes')} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando…' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
