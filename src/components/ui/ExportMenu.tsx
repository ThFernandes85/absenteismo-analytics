import { useEffect, useRef, useState } from 'react'
import { Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { exportToCsv, exportToExcel, exportToPdf, type ExportColumn } from '@/lib/export'

export function ExportMenu({
  filename,
  title,
  columns,
  rows,
}: {
  filename: string
  title: string
  columns: ExportColumn[]
  rows: Record<string, string | number>[]
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  async function handleExport(format: 'pdf' | 'excel' | 'csv') {
    setOpen(false)
    if (rows.length === 0) {
      toast.error('Não há dados para exportar com os filtros atuais.')
      return
    }
    const options = { filename, title, columns, rows }
    if (format === 'pdf') exportToPdf(options)
    else if (format === 'excel') await exportToExcel(options)
    else exportToCsv(options)
    toast.success('Exportação concluída.')
  }

  return (
    <div ref={rootRef} className="relative">
      <Button variant="secondary" onClick={() => setOpen((v) => !v)}>
        <Download className="h-4 w-4" /> Exportar
      </Button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-36 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-lg">
          {(['pdf', 'excel', 'csv'] as const).map((format) => (
            <button
              key={format}
              onClick={() => handleExport(format)}
              className="block w-full px-3 py-1.5 text-left text-sm hover:bg-[var(--color-surface-hover)] cursor-pointer"
            >
              {format === 'pdf' ? 'PDF' : format === 'excel' ? 'Excel (.xlsx)' : 'CSV'}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
