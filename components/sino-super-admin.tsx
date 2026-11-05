'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, LifeBuoy, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react'
import { getNotificacoesSuperAdmin, marcarNotificacaoLida, type NotificacaoSuper } from '@/app/super-admin/notificacoes-actions'

export function SinoSuperAdmin() {
  const [aberto, setAberto] = useState(false)
  const [notificacoes, setNotificacoes] = useState<NotificacaoSuper[]>([])
  const [carregando, setCarregando] = useState(true)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    let ativo = true
    async function carregar() {
      const data = await getNotificacoesSuperAdmin()
      if (ativo) {
        setNotificacoes(data)
        setCarregando(false)
      }
    }
    carregar()
    const interval = setInterval(carregar, 60000)
    return () => { ativo = false; clearInterval(interval) }
  }, [])

  useEffect(() => {
    function handleClickFora(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false)
    }
    if (aberto) document.addEventListener('mousedown', handleClickFora)
    return () => document.removeEventListener('mousedown', handleClickFora)
  }, [aberto])

  const naoLidas = notificacoes.filter(n => !n.lida).length

  async function handleClick(n: NotificacaoSuper) {
    setAberto(false)
    if (!n.lida) {
      await marcarNotificacaoLida(n.id)
      setNotificacoes(prev => prev.map(item => item.id === n.id ? { ...item, lida: true } : item))
    }
    router.push(n.link_destino)
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setAberto(!aberto)} className="relative rounded-lg p-2 text-[#71838b] transition hover:bg-[#f1f5f6]">
        <Bell className="size-[19px]" />
        {naoLidas > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid min-w-[18px] place-items-center rounded-full bg-[#dc2626] px-1 text-[10px] font-bold leading-[18px] text-white">
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </button>

      {aberto && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-[#dce5e8] bg-white shadow-2xl sm:w-96">
          <div className="flex items-center justify-between border-b border-[#e5ecee] px-4 py-3">
            <h3 className="text-sm font-bold text-[#12232b]">Notificações</h3>
            {carregando && <Loader2 className="size-3.5 animate-spin text-[#0d9488]" />}
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {notificacoes.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#f0f4f5] text-[#82939a]"><Bell className="size-5" /></div>
                <p className="mt-3 text-sm font-semibold text-[#536871]">Tudo em dia</p>
                <p className="mt-1 text-xs text-[#82939a]">Nenhum alerta no momento.</p>
              </div>
            ) : (
              notificacoes.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`flex w-full items-start gap-3 border-b border-[#f0f4f5] px-4 py-3 text-left transition last:border-0 hover:bg-[#fafcfc] ${!n.lida ? 'bg-[#f0fdfa]' : ''}`}
                >
                  <div className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg ${n.tipo === 'suporte' ? 'bg-[#dbeafe] text-[#3b82f6]' : n.tipo === 'financeiro' ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-[#ccfbf1] text-[#0d9488]'}`}>
                    {n.tipo === 'suporte' ? <LifeBuoy className="size-4" /> : n.tipo === 'financeiro' ? <AlertCircle className="size-4" /> : <CheckCircle2 className="size-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-start">
                      <p className={`text-sm ${!n.lida ? 'font-bold text-[#12232b]' : 'font-semibold text-[#536871]'}`}>{n.titulo}</p>
                      {!n.lida && <span className="size-2 rounded-full bg-[#0d9488] mt-1.5 shrink-0" />}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-[#82939a]">{n.descricao}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
