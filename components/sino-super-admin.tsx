'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Bell, AlertCircle, LifeBuoy, Loader2 } from 'lucide-react'
import { getNotificacoesSuperAdmin, type NotificacaoSuper } from '@/app/super-admin/notificacoes-actions'

export function SinoSuperAdmin() {
  const [aberto, setAberto] = useState(false)
  const [notificacoes, setNotificacoes] = useState<NotificacaoSuper[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    getNotificacoesSuperAdmin().then(data => {
      setNotificacoes(data)
      setCarregando(false)
    })
  }, [])

  const total = notificacoes.length

  return (
    <div className="relative">
      <button 
        onClick={() => setAberto(!aberto)} 
        className="relative p-2 rounded-full hover:bg-[#f1f5f6] transition-colors"
      >
        <Bell className="size-[19px] text-[#71838b]" />
        {total > 0 && (
          <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white">
            {total > 9 ? '9+' : total}
          </span>
        )}
      </button>

      {aberto && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setAberto(false)} />
          <div className="absolute right-0 top-full z-40 mt-2 w-80 rounded-xl border border-[#dce5e8] bg-white shadow-xl overflow-hidden">
            <div className="bg-[#fafcfc] border-b border-[#dce5e8] px-4 py-3 flex justify-between items-center">
              <h3 className="text-sm font-bold text-[#12232b]">Notificações</h3>
              {total > 0 && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{total} novas</span>}
            </div>
            
            <div className="max-h-[300px] overflow-y-auto">
              {carregando ? (
                <div className="flex justify-center py-8"><Loader2 className="size-5 animate-spin text-gray-400" /></div>
              ) : total === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                  <Bell className="size-8 text-gray-300 mb-2" />
                  <p className="text-sm font-semibold text-gray-600">Tudo em dia!</p>
                  <p className="text-xs text-gray-400 mt-1">Nenhuma notificação no momento.</p>
                </div>
              ) : (
                <div className="divide-y divide-[#edf1f2]">
                  {notificacoes.map(n => (
                    <Link 
                      key={n.id} 
                      href={n.link}
                      onClick={() => setAberto(false)}
                      className="flex gap-3 px-4 py-3 hover:bg-[#fafcfc] transition-colors"
                    >
                      <div className="mt-0.5 shrink-0">
                        {n.tipo === 'suporte' ? (
                          <div className="grid size-8 place-items-center rounded-full bg-blue-100 text-blue-600"><LifeBuoy className="size-4" /></div>
                        ) : (
                          <div className="grid size-8 place-items-center rounded-full bg-red-100 text-red-600"><AlertCircle className="size-4" /></div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#12232b]">{n.titulo}</p>
                        <p className="text-xs text-[#82939a] mt-0.5 line-clamp-2">{n.descricao}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
