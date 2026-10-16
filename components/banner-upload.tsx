'use client'

import { useState } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { UploadDropzone } from '@/lib/uploadthing'

export function BannerUpload({
  urlAtual,
  onUploaded,
}: {
  urlAtual: string
  onUploaded: (url: string) => void
}) {
  const [url, setUrl] = useState(urlAtual)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  function handleComplete(res: Array<{ url: string }>) {
    if (res && res[0]) {
      setUrl(res[0].url)
      onUploaded(res[0].url)
      setErro('')
    }
    setEnviando(false)
  }

  function handleRemove() {
    setUrl('')
    onUploaded('')
  }

  if (url) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-[#e5ecee] bg-[#f0f4f5]">
        <img src={url} alt="" className="h-full w-full object-cover" />
        <button
          onClick={handleRemove}
          className="absolute right-2 top-2 rounded-lg bg-black/60 p-1.5 text-white transition hover:bg-black/80"
          title="Remover banner"
        >
          <X className="size-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-lg border-2 border-dashed border-[#d5e0e3] bg-[#fafcfc] p-4">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-[#536871]">
        <Upload className="size-4" />
        Enviar imagem do banner
      </div>
      {enviando && <p className="mb-2 text-xs text-[#0d9488]">Enviando...</p>}
      <UploadDropzone
        endpoint="bannerHero"
        onUploadBegin={() => setEnviando(true)}
        onClientUploadComplete={handleComplete}
        onUploadError={(err) => {
          setErro(err.message)
          setEnviando(false)
        }}
        appearance={{
          container: 'border-none bg-transparent p-0 cursor-pointer',
          label: 'text-xs text-[#82939a] hover:text-[#0d9488]',
          allowedContent: 'text-[10px] text-[#a0afb4]',
          button: 'bg-[#0d9488] text-white text-xs font-semibold rounded px-3 py-1.5 hover:bg-[#0f766e] ut-uploading:bg-[#0f766e]',
        }}
      />
      {erro && <p className="mt-2 text-xs text-red-500">{erro}</p>}
    </div>
  )
}