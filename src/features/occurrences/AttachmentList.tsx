import { useState } from 'react'
import { FileText, Paperclip } from 'lucide-react'
import { getAttachmentUrl, useOccurrenceAttachments } from './api'

export function AttachmentList({ occurrenceId }: { occurrenceId: string }) {
  const { data: attachments } = useOccurrenceAttachments(occurrenceId)
  const [previewUrl, setPreviewUrl] = useState<{ url: string; type: string } | null>(null)

  async function openPreview(path: string, type: string) {
    const url = await getAttachmentUrl(path)
    setPreviewUrl({ url, type })
  }

  if (!attachments || attachments.length === 0) return null

  return (
    <>
      <div className="mt-2 flex flex-wrap gap-2">
        {attachments.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => openPreview(a.file_path, a.file_type)}
            className="flex items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs hover:bg-[var(--color-surface-hover)] cursor-pointer"
          >
            {a.file_type.startsWith('image/') ? <Paperclip className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
            {a.file_name}
          </button>
        ))}
      </div>

      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
          onClick={() => setPreviewUrl(null)}
        >
          {previewUrl.type.startsWith('image/') ? (
            <img src={previewUrl.url} className="max-h-full max-w-full rounded-md" alt="Anexo" />
          ) : (
            <iframe src={previewUrl.url} className="h-full w-full max-w-3xl rounded-md bg-white" title="Anexo" />
          )}
        </div>
      )}
    </>
  )
}
