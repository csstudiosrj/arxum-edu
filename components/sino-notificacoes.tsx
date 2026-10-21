'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Bell, FileText, AlertCircle, WalletCards, ShieldCheck, MessageSquare,
  Calendar, Loader2, Check, ArrowRight, Inbox,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Notificacao, ResultadoNotificacoes } from '@/lib/notificacoes'

const tipoIcone: Record<string, { icone: LucideIcon; cor: string }> = {
  comunicado: { icone: MessageSquare, cor: '#0d9488' },
  autorizacao: { icone: ShieldCheck, cor: '#3b82f6' },
  ocorrencia: { icone: AlertCircle, cor: '#dc2626' },
  fatura: { icone: WalletCards, cor: '#d97706' },
  matricula: { icone: FileText, cor: '#7c3aed' },
  nota: { icone: Check, cor: '#065f46' },
  evento: { icone: Calendar, cor: '#0891b2' },
  mensagem: { icone: Inbox, cor: '#be185d' },
}

const INTERVALO_POLLING_MS = 60_000

function formatarTempo(iso: string): string {
  try {
    const agora = new Date()
    const data = new Date(iso + (iso.length === 10 ? 'T12:00:00' : ''))
    const diffMs = agora.getTime() - data.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    const diffHoras = Math.floor(diffMs / 3600000)
    const diffDias = Math.floor(diffMs / 86400000)

    if (diffMin < 1) return 'agora'
    if (diffMin < 60) return `${diffMin} min`
    if (diffHoras < 24) return `${diffHoras}h`
    if (diffDias < 7) return `${diffDias}d`
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  } catch {
    return '—'
  }
}

export function SinoNotificacoes({
  carregarNotificacoes,
}: {
  carregarNotificacoes: () => Promise<ResultadoNotificacoes>
}) {
  const [aberto, setAberto] = useState(false)
  const [carregandoInicial, setCarregandoInicial] = useState(true)
  const [atualizando, setAtualizando] = useState(false)
  const [notificacoes, setNotificacoes] = useState<ResultadoNotificacoes>({ total: 0, itens: [] })
  const [carregado, setCarregado] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const recarregar = useCallback(
    async (silencioso: boolean) => {
      if (silencioso) setAtualizando(true)
      else setCarregandoInicial(true)
      try {
        const r = await carregarNotificacoes()
        setNotificacoes(r)
        setCarregado(true)
      } catch {
        // mantém estado anterior; não pisca
      } finally {
        if (silencioso) setAtualizando(false)
        else setCarregandoInicial(false)
      }
    },
    [carregarNotificacoes]
  )

  // Carrega na montagem + polling + refresh no foco da aba
  useEffect(() => {
    let ativo = true

    const executar = async (silencioso: boolean) => {
      if (!ativo) return
      if (silencioso) setAtualizando(true)
      else setCarregandoInicial(true)
      try {
        const r = await carregarNotificacoes()
        if (ativo) {
          setNotificacoes(r)
          setCarregado(true)
        }
      } catch {
        // silencioso
      } finally {
        if (ativo) {
          if (silencioso) setAtualizando(false)
          else setCarregandoInicial(false)
        }
      }
    }

    executar(false)

    const interval = setInterval(() => executar(true), INTERVALO_POLLING_MS)
    const onFocus = () => executar(true)
    window.addEventListener('focus', onFocus)

    return () => {
      ativo = false
      clearInterval(interval)
      window.removeEventListener('focus', onFocus)
    }
  }, [carregarNotificacoes])

  useEffect(() => {
    function handleClickFora(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAberto(false)
      }
    }
    if (aberto) {
      document.addEventListener('mousedown', handleClickFora)
      return () => document.removeEventListener('mousedown', handleClickFora)
    }
  }, [aberto])

  // Ao abrir o painel, força refresh silencioso (pode ter chegado coisa nova)
  function handleToggle() {
    const vaiAbrir = !aberto
    setAberto(vaiAbrir)
    if (vaiAbrir && carregado) recarregar(true)
  }

  const temNaoLidas = notificacoes.total > 0

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleToggle}
        className="relative rounded-lg p-2 text-[#71838b] transition hover:bg-[#f1f5f6]"
        aria-label="Notificações"
      >
        <Bell className="size-[19px]" />
        {temNaoLidas && (
          <span className="absolute -right-0.5 -top-0.5 grid min-w-[18px] place-items-center rounded-full bg-[#dc2626] px-1 text-[10px] font-bold leading-[18px] text-white">
            {notificacoes.total > 9 ? '9+' : notificacoes.total}
          </span>
        )}
        {atualizando && (
          <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-[#0d9488] animate-pulse" />
        )}
      </button>

      {aberto && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-[#dce5e8] bg-white shadow-2xl sm:w-96">
          <div className="flex items-center justify-between border-b border-[#e5ecee] px-4 py-3">
            <div>
              <h3 className="text-sm font-bold text-[#12232b]">Notificações</h3>
              {temNaoLidas && (
                <p className="text-xs text-[#82939a]">
                  {notificacoes.total} {notificacoes.total === 1 ? 'nova' : 'novas'}
                </p>
              )}
            </div>
            {atualizando && <Loader2 className="size-3.5 animate-spin text-[#0d9488]" />}
          </div>

          {!carregado && carregandoInicial ? (
            <div className="px-4 py-12 text-center">
              <Loader2 className="mx-auto size-5 animate-spin text-[#a0afb4]" />
            </div>
          ) : notificacoes.itens.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#f0f4f5] text-[#82939a]">
                <Bell className="size-5" />
              </div>
              <p className="mt-3 text-sm font-semibold text-[#536871]">Tudo em dia</p>
              <p className="mt-1 text-xs text-[#82939a]">Você não tem notificações no momento.</p>
            </div>
          ) : (
            <div className="max-h-[420px] overflow-y-auto">
              {notificacoes.itens.map((n) => {
                const info = tipoIcone[n.tipo] || tipoIcone.comunicado
                const Icone = info.icone
                return (
                  <Link
                    key={n.id}
                    href={n.href}
                    onClick={() => setAberto(false)}
                    className="flex items-start gap-3 border-b border-[#f0f4f5] px-4 py-3 transition last:border-0 hover:bg-[#fafcfc]"
                  >
                    <div
                      className="grid size-9 shrink-0 place-items-center rounded-lg"
                      style={{ backgroundColor: `${info.cor}15`, color: info.cor }}
                    >
                      <Icone className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-[#243942]">{n.titulo}</p>
                        <span className="shrink-0 text-[10px] text-[#82939a]">{formatarTempo(n.data)}</span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-[#82939a]">{n.descricao}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {notificacoes.itens.length > 0 && (
            <div className="border-t border-[#e5ecee] bg-[#fafcfc] px-4 py-2.5">
              <p className="text-center text-[11px] text-[#82939a]">
                Clique em uma notificação para ver os detalhes <ArrowRight className="ml-1 inline size-3" />
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}