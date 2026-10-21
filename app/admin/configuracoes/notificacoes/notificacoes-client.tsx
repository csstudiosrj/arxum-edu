'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Mail, MessageCircle, Smartphone, Loader2, Bell,
  Info, Check,
} from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import {
  EVENTOS_META,
  type ConfigEvento,
  type EventoNotificacao,
} from '@/lib/notificacoes-config'
import { salvarConfig } from './actions'

export function NotificacoesClient({ config }: { config: ConfigEvento[] }) {
  const router = useRouter()
  const [estado, setEstado] = useState<ConfigEvento[]>(config)
  const [processando, setProcessando] = useState<string | null>(null)
  const [salvou, setSalvou] = useState<string | null>(null)

  function patchLocal(evento: EventoNotificacao, patch: Partial<ConfigEvento>) {
    setEstado((prev) =>
      prev.map((c) => (c.evento === evento ? { ...c, ...patch } : c))
    )
  }

  async function handleToggle(
    evento: EventoNotificacao,
    canal: 'canal_email' | 'canal_whatsapp' | 'canal_push',
    valor: boolean
  ) {
    const atual = estado.find((c) => c.evento === evento)
    if (!atual) return
    const novo = { ...atual, [canal]: valor }
    patchLocal(evento, { [canal]: valor })
    setProcessando(evento)
    const r = await salvarConfig(evento, {
      canal_email: novo.canal_email,
      canal_whatsapp: novo.canal_whatsapp,
      canal_push: novo.canal_push,
    })
    setProcessando(null)
    if (!r.success) {
      // reverte
      patchLocal(evento, { [canal]: !valor })
      alert(r.error || 'Erro ao salvar.')
      return
    }
    setSalvou(evento)
    router.refresh()
    setTimeout(() => setSalvou(null), 1800)
  }

  return (
    <AdminShell mode="school" active="Configurações">
      <main className="px-5 py-8 lg:px-8">
        <Link
          href="/admin/configuracoes"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6b7d86] hover:brightness-75"
        >
          <ArrowLeft className="size-3.5" /> Voltar para configurações
        </Link>

        <div className="mt-4">
          <SectionHeading
            eyebrow="Administração"
            title="Notificações"
            description="Escolha quais avisos automáticos a sua escola envia e por quais canais."
          />
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-xl border border-[#dbeafe] bg-[#dbeafe]/40 p-4">
          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#dbeafe] text-[#1e40af]">
            <Info className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[#1e40af]">
              Canal de e-mail já está ativo.
            </p>
            <p className="mt-0.5 text-xs leading-5 text-[#1e40af]/80">
              WhatsApp e push dependem de integração oficial e liberação da Meta.
              Estarão disponíveis nas próximas versões — as chaves ficam guardadas
              para quando ligarmos.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {EVENTOS_META.map((meta) => {
            const item = estado.find((c) => c.evento === meta.evento)
            if (!item) return null
            const salvando = processando === meta.evento
            const confirmou = salvou === meta.evento

            return (
              <Panel key={meta.evento} className="p-5">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
                  <div
                    className="grid size-11 shrink-0 place-items-center rounded-lg"
                    style={{ backgroundColor: `${meta.cor}15`, color: meta.cor }}
                  >
                    <Bell className="size-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-[#12232b]">{meta.titulo}</h3>
                      {salvando && (
                        <Loader2
                          className="size-3.5 animate-spin"
                          style={{ color: 'var(--cor-primaria, #0d9488)' }}
                        />
                      )}
                      {confirmou && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#d1fae5] px-2 py-0.5 text-[10px] font-bold text-[#065f46]">
                          <Check className="size-2.5" /> Salvo
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs leading-5 text-[#82939a]">{meta.descricao}</p>
                    <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-[#a0afb4]">
                      Quem recebe · {meta.quemRecebe}
                    </p>
                  </div>

                  <div className="grid shrink-0 grid-cols-3 gap-2 lg:w-[360px]">
                    <CanalToggle
                      icone={Mail}
                      label="E-mail"
                      ativo={item.canal_email}
                      onToggle={(v) => handleToggle(meta.evento, 'canal_email', v)}
                      desabilitado={salvando}
                      cor={meta.cor}
                    />
                    <CanalToggle
                      icone={MessageCircle}
                      label="WhatsApp"
                      ativo={item.canal_whatsapp}
                      onToggle={() => {}}
                      desabilitado
                      emBreve
                      cor={meta.cor}
                    />
                    <CanalToggle
                      icone={Smartphone}
                      label="Push"
                      ativo={item.canal_push}
                      onToggle={() => {}}
                      desabilitado
                      emBreve
                      cor={meta.cor}
                    />
                  </div>
                </div>
              </Panel>
            )
          })}
        </div>
      </main>
    </AdminShell>
  )
}

function CanalToggle({
  icone: Icone,
  label,
  ativo,
  onToggle,
  desabilitado,
  emBreve,
  cor,
}: {
  icone: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  label: string
  ativo: boolean
  onToggle: (v: boolean) => void
  desabilitado?: boolean
  emBreve?: boolean
  cor: string
}) {
  return (
    <button
      type="button"
      onClick={() => !desabilitado && onToggle(!ativo)}
      disabled={desabilitado}
      className={`relative flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-center transition ${
        desabilitado
          ? 'cursor-not-allowed border-[#e5ecee] bg-[#fafcfc] opacity-60'
          : ativo
            ? 'border-transparent bg-[#f0fbf8]'
            : 'border-[#d5e0e3] bg-white hover:border-[var(--cor-primaria,#0d9488)]'
      }`}
      style={!desabilitado && ativo ? { borderColor: cor, backgroundColor: `${cor}0d` } : undefined}
    >
      <Icone className="size-4" style={{ color: desabilitado ? '#a0afb4' : ativo ? cor : '#6b7d86' }} />
      <span
        className={`text-[11px] font-semibold ${desabilitado ? 'text-[#a0afb4]' : ativo ? '' : 'text-[#6b7d86]'}`}
        style={!desabilitado && ativo ? { color: cor } : undefined}
      >
        {label}
      </span>
      {emBreve && (
        <span className="absolute -top-2 right-1 rounded-full bg-[#f0f4f5] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#82939a]">
          breve
        </span>
      )}
    </button>
  )
}