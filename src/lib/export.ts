import ExcelJS from 'exceljs'
import Papa from 'papaparse'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface ExportColumn {
  key: string
  header: string
}

interface ExportOptions {
  filename: string
  title: string
  columns: ExportColumn[]
  rows: Record<string, string | number>[]
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function exportToCsv({ filename, columns, rows }: ExportOptions) {
  const csv = Papa.unparse({
    fields: columns.map((c) => c.header),
    data: rows.map((row) => columns.map((c) => row[c.key] ?? '')),
  })
  downloadBlob(new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' }), `${filename}.csv`)
}

export async function exportToExcel({ filename, title, columns, rows }: ExportOptions) {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet(title.slice(0, 31))
  sheet.columns = columns.map((c) => ({ header: c.header, key: c.key, width: 22 }))
  sheet.getRow(1).font = { bold: true }
  rows.forEach((row) => sheet.addRow(row))
  const buffer = await workbook.xlsx.writeBuffer()
  downloadBlob(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `${filename}.xlsx`,
  )
}

export function exportToPdf({ filename, title, columns, rows }: ExportOptions) {
  const doc = new jsPDF({ orientation: columns.length > 5 ? 'landscape' : 'portrait' })
  doc.setFontSize(14)
  doc.text(title, 14, 16)
  doc.setFontSize(9)
  doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, 14, 22)
  autoTable(doc, {
    startY: 28,
    head: [columns.map((c) => c.header)],
    body: rows.map((row) => columns.map((c) => String(row[c.key] ?? ''))),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [37, 99, 235] },
  })
  doc.save(`${filename}.pdf`)
}
