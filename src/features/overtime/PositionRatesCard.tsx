import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { FullPageSpinner } from '@/components/ui/Spinner'
import { useEmployees } from '@/features/employees/api'
import { usePositionOvertimeRates, useSetPositionOvertimeRate } from './ratesApi'

export function PositionRatesCard() {
  const { data: employees, isLoading: loadingEmployees } = useEmployees('all')
  const { data: rates, isLoading: loadingRates } = usePositionOvertimeRates()
  const setRate = useSetPositionOvertimeRate()
  const [values, setValues] = useState<Record<string, string>>({})

  const positions = Array.from(new Set((employees ?? []).map((e) => e.position))).sort((a, b) =>
    a.localeCompare(b, 'pt-BR'),
  )

  useEffect(() => {
    if (!rates) return
    setValues((prev) => {
      const next = { ...prev }
      rates.forEach((r) => {
        if (next[r.position] === undefined) next[r.position] = String(r.hourly_rate)
      })
      return next
    })
  }, [rates])

  async function handleSave(position: string) {
    const value = Number(values[position] ?? 0)
    if (Number.isNaN(value) || value < 0) {
      toast.error('Informe um valor válido.')
      return
    }
    try {
      await setRate.mutateAsync({ position, hourly_rate: value })
      toast.success(`Valor da hora extra de "${position}" salvo.`)
    } catch {
      toast.error('Erro ao salvar valor.')
    }
  }

  if (loadingEmployees || loadingRates) return <FullPageSpinner />

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Valor da Hora Extra por Função</CardTitle>
      </CardHeader>
      <CardContent>
        {positions.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">Nenhum cargo cadastrado ainda.</p>
        ) : (
          <ul className="space-y-3">
            {positions.map((position) => (
              <li key={position} className="flex items-center gap-3">
                <span className="flex-1 text-sm">{position}</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-28"
                  value={values[position] ?? '0'}
                  onChange={(e) => setValues((v) => ({ ...v, [position]: e.target.value }))}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSave(position)}
                  disabled={setRate.isPending}
                >
                  Salvar
                </Button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-[var(--color-text-muted)]">
          Usado no relatório de Horas Extras para calcular o valor de cada colaborador de acordo com o cargo.
        </p>
      </CardContent>
    </Card>
  )
}
