import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { Paperclip } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Label, FieldError } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Combobox } from '@/components/ui/Combobox'
import { OCCURRENCE_LABELS } from '@/lib/constants'
import { supabase } from '@/lib/supabase'
import { useCreateOccurrence, useUploadAttachment } from './api'
import type { Employee, OccurrenceType } from '@/types/database.types'

export const RANGE_TYPES: OccurrenceType[] = ['atestado', 'ferias']

export const schema = z
  .object({
    employee_id: z.string().min(1, 'Selecione o funcionário'),
    type: z.custom<OccurrenceType>((v) => typeof v === 'string' && v in OCCURRENCE_LABELS),
    occurrence_date: z.string().min(1, 'Informe a data'),
    end_date: z.string().optional(),
    notes: z.string().optional(),
    reason: z.string().optional(),
    cid: z.string().optional(),
    time_of_day: z.string().optional(),
    hours: z.string().optional(),
    overtime_percentage: z.enum(['50', '100']).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'falta' && !data.reason) {
      ctx.addIssue({ code: 'custom', message: 'Informe o motivo da falta', path: ['reason'] })
    }
    if (RANGE_TYPES.includes(data.type)) {
      if (!data.end_date) {
        ctx.addIssue({ code: 'custom', message: 'Informe a data de retorno', path: ['end_date'] })
      } else if (!dayjs(data.end_date).isAfter(dayjs(data.occurrence_date))) {
        ctx.addIssue({
          code: 'custom',
          message: 'A data de retorno deve ser posterior à data de início',
          path: ['end_date'],
        })
      }
    }
    if (data.type === 'declaracao' && !data.time_of_day) {
      ctx.addIssue({ code: 'custom', message: 'Informe o horário', path: ['time_of_day'] })
    }
    if (data.type === 'hora_extra') {
      if (!data.hours || Number(data.hours) <= 0) {
        ctx.addIssue({ code: 'custom', message: 'Informe a quantidade de horas', path: ['hours'] })
      }
      if (!data.overtime_percentage) {
        ctx.addIssue({ code: 'custom', message: 'Selecione o percentual', path: ['overtime_percentage'] })
      }
    }
  })

export type FormValues = z.infer<typeof schema>

export function OccurrenceForm({
  employees,
  prefillEmployeeId,
}: {
  employees: Employee[]
  prefillEmployeeId?: string
}) {
  const createOccurrence = useCreateOccurrence()
  const uploadAttachment = useUploadAttachment()
  const [file, setFile] = useState<File | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      employee_id: '',
      type: 'presenca',
      occurrence_date: dayjs().format('YYYY-MM-DD'),
      notes: '',
    },
  })

  const type = watch('type')
  const employeeId = watch('employee_id')
  const occurrenceDate = watch('occurrence_date')
  const endDate = watch('end_date')

  useEffect(() => {
    if (prefillEmployeeId) setValue('employee_id', prefillEmployeeId, { shouldValidate: true })
  }, [prefillEmployeeId, setValue])

  const selectedEmployee = employees.find((e) => e.id === employeeId)

  async function describeConflict(employeeIdArg: string, date: string): Promise<string> {
    const employee = employees.find((e) => e.id === employeeIdArg)
    if (employee?.status === 'afastado') return 'Colaborador encontra-se afastado.'

    const { data } = await supabase
      .from('occurrences')
      .select('type, end_date')
      .eq('employee_id', employeeIdArg)
      .in('type', ['ferias', 'atestado'])
      .lte('occurrence_date', date)
      .or(`end_date.is.null,end_date.gt.${date}`)
      .limit(1)
      .maybeSingle()

    if (data) {
      const label = data.type === 'ferias' ? 'de férias' : 'de atestado'
      const retorno = data.end_date ? ` (retorno em ${dayjs(data.end_date).format('DD/MM/YYYY')})` : ''
      return `Colaborador encontra-se ${label}${retorno}.`
    }
    return 'Este funcionário já possui um lançamento nesse período.'
  }

  const isRangeType = RANGE_TYPES.includes(type)
  const rangeDays =
    isRangeType && occurrenceDate && endDate && dayjs(endDate).isAfter(dayjs(occurrenceDate))
      ? dayjs(endDate).diff(dayjs(occurrenceDate), 'day')
      : null

  useEffect(() => {
    if (type === 'presenca') setValue('occurrence_date', dayjs().format('YYYY-MM-DD'))
  }, [type, setValue])

  async function onSubmit(values: FormValues) {
    try {
      const isRange = RANGE_TYPES.includes(values.type)
      const daysCount = isRange ? dayjs(values.end_date).diff(dayjs(values.occurrence_date), 'day') : null

      const occurrence = await createOccurrence.mutateAsync({
        employee_id: values.employee_id,
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
      })

      if (file && (values.type === 'atestado' || values.type === 'declaracao')) {
        await uploadAttachment.mutateAsync({ occurrenceId: occurrence.id, file })
      }

      toast.success('Ocorrência lançada com sucesso.')
      setFile(null)
      reset({
        employee_id: values.employee_id,
        type: values.type,
        occurrence_date: dayjs().format('YYYY-MM-DD'),
        notes: '',
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      if (message.includes('occurrences_no_overlap') || message.includes('exclusion') || message.includes('duplicate')) {
        toast.error(await describeConflict(values.employee_id, values.occurrence_date))
      } else {
        toast.error('Erro ao lançar ocorrência.')
      }
    }
  }

  const employeeOptions = employees.map((e) => ({
    value: e.id,
    label: e.full_name,
    description: `Matrícula ${e.registration_number}`,
  }))

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label>Funcionário</Label>
        <Combobox
          options={employeeOptions}
          value={employeeId}
          onChange={(v) => setValue('employee_id', v, { shouldValidate: true })}
          placeholder="Selecione o funcionário…"
        />
        <FieldError message={errors.employee_id?.message} />
        {selectedEmployee?.status === 'afastado' && (
          <p className="mt-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
            ⚠️ Este colaborador está afastado.
          </p>
        )}
      </div>

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
            <Label htmlFor="occurrence_date">Data de Início</Label>
            <Input id="occurrence_date" type="date" {...register('occurrence_date')} />
            <FieldError message={errors.occurrence_date?.message} />
          </div>
          <div>
            <Label htmlFor="end_date">Data de Retorno</Label>
            <Input id="end_date" type="date" min={occurrenceDate} {...register('end_date')} />
            <FieldError message={errors.end_date?.message} />
          </div>
        </div>
      ) : (
        <div>
          <Label htmlFor="occurrence_date">Data</Label>
          <Input id="occurrence_date" type="date" {...register('occurrence_date')} />
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
          <Label htmlFor="reason">Motivo</Label>
          <Input id="reason" {...register('reason')} />
          <FieldError message={errors.reason?.message} />
        </div>
      )}

      {type === 'atestado' && (
        <div>
          <Label htmlFor="cid">CID (opcional)</Label>
          <Input id="cid" {...register('cid')} />
        </div>
      )}

      {type === 'declaracao' && (
        <div>
          <Label htmlFor="time_of_day">Horário</Label>
          <Input id="time_of_day" type="time" {...register('time_of_day')} />
          <FieldError message={errors.time_of_day?.message} />
        </div>
      )}

      {type === 'hora_extra' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="hours">Quantidade de Horas</Label>
            <Input id="hours" type="number" step="0.5" min={0.5} {...register('hours')} />
            <FieldError message={errors.hours?.message} />
          </div>
          <div>
            <Label htmlFor="overtime_percentage">Percentual</Label>
            <Select id="overtime_percentage" {...register('overtime_percentage')}>
              <option value="">Selecione…</option>
              <option value="50">50%</option>
              <option value="100">100%</option>
            </Select>
            <FieldError message={errors.overtime_percentage?.message} />
          </div>
        </div>
      )}

      {(type === 'atestado' || type === 'declaracao') && (
        <div>
          <Label>Anexo (PDF, PNG, JPG, JPEG)</Label>
          <label className="flex h-9 cursor-pointer items-center gap-2 rounded-md border border-dashed border-[var(--color-border)] px-3 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]">
            <Paperclip className="h-4 w-4" />
            {file ? file.name : 'Selecionar arquivo…'}
            <input
              type="file"
              accept="application/pdf,image/png,image/jpeg"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
      )}

      <div>
        <Label htmlFor="notes">Observação</Label>
        <Textarea id="notes" {...register('notes')} />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Lançando…' : 'Lançar Ocorrência'}
      </Button>
    </form>
  )
}
