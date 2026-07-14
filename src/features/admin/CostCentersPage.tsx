import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FullPageSpinner } from '@/components/ui/Spinner'
import { useCostCentersList } from './costCentersApi'
import { CostCenterFormModal } from './CostCenterFormModal'
import type { CostCenter } from '@/types/database.types'

export function CostCentersPage() {
  const { data: costCenters, isLoading } = useCostCentersList()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<CostCenter | null>(null)

  if (isLoading) return <FullPageSpinner />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Centros de Lucro</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Cada site/unidade deve possuir seu próprio centro de lucro para relatórios e auditorias.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
        >
          <Plus className="h-4 w-4" /> Novo Centro de Lucro
        </Button>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-hover)] text-left text-xs text-[var(--color-text-muted)]">
              <th className="px-4 py-2.5 font-medium">Código</th>
              <th className="px-4 py-2.5 font-medium">Nome</th>
              <th className="px-4 py-2.5 font-medium" />
            </tr>
          </thead>
          <tbody>
            {costCenters?.map((cc) => (
              <tr key={cc.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-hover)]">
                <td className="px-4 py-2.5 font-medium">{cc.code}</td>
                <td className="px-4 py-2.5">{cc.name}</td>
                <td className="px-4 py-2.5 text-right">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setEditing(cc)
                      setFormOpen(true)
                    }}
                  >
                    Editar
                  </Button>
                </td>
              </tr>
            ))}
            {costCenters?.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-[var(--color-text-muted)]">
                  Nenhum centro de lucro cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <CostCenterFormModal open={formOpen} onClose={() => setFormOpen(false)} costCenter={editing} />
    </div>
  )
}
