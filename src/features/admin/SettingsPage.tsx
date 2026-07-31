import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Label, FieldError } from '@/components/ui/Input'
import { FullPageSpinner } from '@/components/ui/Spinner'
import { useCompanySettings, useUpdateCompanySettings } from './settingsApi'

const schema = z.object({
  average_daily_cost: z
    .string()
    .refine((v) => Number(v) >= 0, 'Informe um valor válido'),
  target_absenteeism_rate: z
    .string()
    .refine((v) => Number(v) >= 0 && Number(v) <= 100, 'Informe um valor entre 0 e 100'),
  overtime_hour_rate: z
    .string()
    .refine((v) => Number(v) >= 0, 'Informe um valor válido'),
})

type FormValues = z.infer<typeof schema>

export function SettingsPage() {
  const { data: settings, isLoading } = useCompanySettings()
  const updateSettings = useUpdateCompanySettings()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (settings) {
      reset({
        average_daily_cost: String(settings.average_daily_cost),
        target_absenteeism_rate: String(settings.target_absenteeism_rate),
        overtime_hour_rate: String(settings.overtime_hour_rate),
      })
    }
  }, [settings, reset])

  if (isLoading) return <FullPageSpinner />

  async function onSubmit(values: FormValues) {
    try {
      await updateSettings.mutateAsync({
        average_daily_cost: Number(values.average_daily_cost),
        target_absenteeism_rate: Number(values.target_absenteeism_rate),
        overtime_hour_rate: Number(values.overtime_hour_rate),
      })
      toast.success('Configurações salvas.')
    } catch {
      toast.error('Erro ao salvar configurações.')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Configurações</h1>
        <p className="text-sm text-[var(--color-text-muted)]">Parâmetros usados nos relatórios e no Painel Executivo.</p>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Parâmetros do Painel Executivo</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="average_daily_cost">Custo médio por dia perdido (R$)</Label>
              <Input id="average_daily_cost" type="number" step="0.01" min="0" {...register('average_daily_cost')} />
              <FieldError message={errors.average_daily_cost?.message} />
              <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">
                Usado para estimar o impacto financeiro do absenteísmo: dias perdidos × este valor. Baseado em uma
                média corporativa, não substitui o custo real de folha por colaborador.
              </p>
            </div>
            <div>
              <Label htmlFor="target_absenteeism_rate">Meta de taxa de absenteísmo (%)</Label>
              <Input
                id="target_absenteeism_rate"
                type="number"
                step="0.1"
                min="0"
                max="100"
                {...register('target_absenteeism_rate')}
              />
              <FieldError message={errors.target_absenteeism_rate?.message} />
              <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">
                Referência usada para sinalizar unidades "Crítico"/"Atenção"/"Sob controle" no Painel Executivo.
              </p>
            </div>
            <div>
              <Label htmlFor="overtime_hour_rate">Valor da hora extra (R$)</Label>
              <Input
                id="overtime_hour_rate"
                type="number"
                step="0.01"
                min="0"
                {...register('overtime_hour_rate')}
              />
              <FieldError message={errors.overtime_hour_rate?.message} />
              <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">
                Valor-base da hora extra, usado no relatório de Horas Extras. O adicional de 50% ou 100% lançado em
                cada ocorrência é aplicado sobre este valor.
              </p>
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando…' : 'Salvar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
