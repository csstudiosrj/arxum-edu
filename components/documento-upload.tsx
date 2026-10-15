'use client'

import { useState } from 'react'
import { Check, FileText, X } from 'lucide-react'
import { UploadDropzone } from '@/lib/uploadthing'

export function DocumentoUpload({
  label,
  onUploaded,
}: {
  label: string
  onUploaded: (url: string | null, nome: string | null) => void
}) {
  const [url, setUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  function handleComplete(res: Array<{ url: string; name: string }>) {
    if (res && res.length > 0) {
      const f = res[0]
      setUrl(f.url)
      setFileName(f.name)
      setError(null)
      onUploaded(f.url, f.name)
    }
  }

  function handleRemove() {
    setUrl(null)
    setFileName('')
    onUploaded(null, null)
  }

  return (
    <div className="rounded-lg border border-white/[.08] bg-[#0b1115] p-4">
      <div className="mb-3 flex items-center gap-3">
        <FileText className="size-4 text-[#0d9488]" />
        <span className="text-sm font-medium text-[#c7d5db]">{label}</span>
      </div>

      {url ? (
        <div className="flex items-center justify-between rounded-lg border border-[#0d9488]/30 bg-[#0d9488]/5 px-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <Check className="size-4 shrink-0 text-[#0d9488]" />
            <span className="truncate text-xs text-[#c7d5db]">{fileName || 'Arquivo enviado'}</span>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="ml-2 shrink-0 rounded p-1 text-[#5e7a94] transition hover:bg-white/5 hover:text-white"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <UploadDropzone
          endpoint="documentoMatricula"
          onClientUploadComplete={handleComplete}
          onUploadError={(err) => setError(err.message)}
          appearance={{
            container:
              'border border-dashed border-white/20 rounded-lg p-4 cursor-pointer transition hover:border-[#0d9488]/50 ut-uploading:opacity-50',
            label: 'text-xs text-[#8aa0ad] hover:text-white',
            allowedContent: 'text-[10px] text-[#5e7a94]',
            button:
              'bg-[#0d9488] text-white text-xs font-semibold rounded px-3 py-1.5 hover:bg-[#0f766e] ut-uploading:bg-[#0f766e]',
          }}
        />
      )}

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  )
}