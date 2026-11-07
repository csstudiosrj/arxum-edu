'use client'

import { useState } from 'react'
import { Calendar, Smartphone, Monitor, Copy, Check, X } from 'lucide-react'
import QRCode from 'react-qr-code'

export function AgendaSync({ slug, onClose }: { slug: string; onClose: () => void }) {
  const [copiou, setCopiou] = useState(false)
  
  // O link absoluto do feed
  // Em produção, usará o domínio real. Em dev, usa o localhost.
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://arxum.com.br'
  const feedUrl = `${baseUrl}/edu/api/agenda/${slug}`
  
  // O protocolo webcal:// faz o celular abrir direto o app de calendário
  const webcalUrl = feedUrl.replace('https://', 'webcal://').replace('http://', 'webcal://')

  function handleCopiar() {
    navigator.clipboard.writeText(feedUrl)
    setCopiou(true)
    setTimeout(() => setCopiou(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-[#e5ecee] bg-[#fafcfc] px-5 py-4">
          <div className="flex items-center gap-2">
            <Calendar className="size-5 text-[#0d9488]" />
            <h3 className="font-bold text-[#12232b]">Sincronizar Calendário</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-[#82939a] hover:bg-[#f1f5f6] hover:text-[#12232b] transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="text-center mb-6">
            <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-[#f0fdfa] text-[#0d9488]">
              <Smartphone size={24} />
            </div>
            <h4 className="font-bold text-[#243942]">Acompanhe tudo no seu celular</h4>
            <p className="mt-1 text-xs text-[#82939a]">
              Os eventos da escola aparecerão automaticamente na agenda do seu iPhone ou Android.
            </p>
          </div>

          <div className="space-y-4">
            {/* OPÇÃO MOBILE (Direto) */}
            <div className="rounded-xl border border-[#e5ecee] bg-[#fafcfc] p-4 text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-[#536871] mb-3">Está no celular?</p>
              <a
                href={webcalUrl}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0d9488] px-4 py-3 text-sm font-bold text-white transition hover:brightness-90"
              >
                <Calendar size={18} /> Assinar no meu Calendário
              </a>
              <p className="mt-2 text-[10px] text-[#82939a]">Abre o app nativo do iOS/Android.</p>
            </div>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-[#e5ecee]"></div>
              <span className="flex-shrink-0 px-3 text-xs font-semibold text-[#82939a]">ou</span>
              <div className="flex-grow border-t border-[#e5ecee]"></div>
            </div>

            {/* OPÇÃO DESKTOP (QR Code) */}
            <div className="rounded-xl border border-[#e5ecee] bg-white p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Monitor size={16} className="text-[#536871]" />
                <p className="text-xs font-bold uppercase tracking-wider text-[#536871]">Está no computador?</p>
              </div>
              
              <div className="mx-auto flex size-32 items-center justify-center rounded-xl bg-white p-2 shadow-sm border border-[#e5ecee]">
                <QRCode value={feedUrl} size={110} fgColor="#12232b" />
              </div>
              
              <p className="mt-3 text-xs text-[#82939a]">
                Abra a câmera do seu celular e aponte para o código acima.
              </p>
            </div>
            
            {/* COPIAR LINK */}
            <div className="flex items-center gap-2 rounded-lg border border-[#d5e0e3] bg-[#fafcfc] p-2">
              <input readOnly value={feedUrl} className="w-full bg-transparent px-2 text-xs text-[#82939a] outline-none" />
              <button onClick={handleCopiar} className="shrink-0 rounded-md bg-white border border-[#d5e0e3] p-2 text-[#536871] hover:text-[#0d9488] hover:border-[#0d9488] transition">
                {copiou ? <Check size={14} className="text-[#0d9488]" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}