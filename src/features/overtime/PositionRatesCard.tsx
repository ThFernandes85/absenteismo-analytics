import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'
import { FullPageSpinner } from '@/components/ui/Spinner'
import { useEmployees } from '@/features/employees/api'
import { usePositionOvertimeRates, useSetPositionOvertimeRate } from './ratesApi'

interface RateValues {
  rate_50: string
  rate_100: string
}

export function PositionRatesCard() {
  const { data: employees, isLoading: loadingEmployees } = useEmployees('all')
  const { data: rates, isLoading: loadingRates } = usePositionOvertimeRates()
  const setRate = useSetPositionOvertimeRate()
  const [values, setValues] = useState<Record<string, RateValues>>({})

  const positions = Array.from(new Set((employees ?? []).map((e) => e.position))).sort((a, b) =>
    a.localeCompare(b, 'pt-BR'),
  )

  useEffect(() => {
    if (!rates) return
    setValues((prev) => {
      const next = { ...prev }
      rates.forEach((r) => {
        if (next[r.position] === undefined) {
          next[r.position] = { rate_50: String(r.rate_50), rate_100: String(r.rate_100) }
        }
      })
      return next
    })
  }, [rates])

  function getValues(position: string): RateValues {
    return values[position] ?? { rate_50: '0', rate_100: '0' }
  }

  async function handleSave(position: string) {
    const { rate_50, rate_100 } = getValues(position)
    const rate50 = Number(rate_50)
    const rate100 = Number(rate_100)
    if (Number.isNaN(rate50) || rate50 < 0 || Number.isNaN(rate100) || rate100 < 0) {
      toast.error('Informe valores válidos.')
      return
    }
    try {
      await setRate.mutateAsync({ position, rate_50: rate50, rate_100: rate100 })
      toast.success(`Valores de hora extra de "${position}" salvos.`)
    } catch {
      toast.error('Erro ao salvar valores.')
    }
  }

  if (loadingEmployees || loadingRates) return <FullPageSpinner />

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Valor da Hora Extra por Função</CardTitle>
      </CardHeader>
      <CardContent>
        {positions.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">Nenhum cargo cadastrado ainda.</p>
        ) : (
          <ul className="space-y-4">
            {positions.map((position) => (
              <li key={position} className="flex items-end gap-3 border-b border-[var(--color-border)] pb-4 last:border-0">
                <span className="flex-1 text-sm font-medium">{position}</span>
                <div>
                  <Label htmlFor={`rate50-${position}`}>Hora extra 50% (R$)</Label>
                  <Input
                    id={`rate50-${position}`}
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-32"
                    value={getValues(position).rate_50}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [position]: { ...getValues(position), rate_50: e.target.value } }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor={`rate100-${position}`}>Hora extra 100% (R$)</Label>
                  <Input
                    id={`rate100-${position}`}
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-32"
                    value={getValues(position).rate_100}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [position]: { ...getValues(position), rate_100: e.target.value } }))
                    }
                  />
                </div>
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
          Cada função tem um valor fixo de hora extra a 50% e outro a 100% — não há multiplicação, o valor
          cadastrado aqui já é o valor final da hora.
        </p>
      </CardContent>
    </Card>
  )
}
