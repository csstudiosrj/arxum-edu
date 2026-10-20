'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Inbox, Mail, Phone, Trash2, X, Check, Eye, EyeOff, ExternalLink } from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import { marcarMensagemLida, marcarMensagemRespondida, excluirMensagem, type Mensagem } from '@/lib/cms/actions'

function formatarDataHora(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return '—'
  }
}

export function MensagensClient({ mensagens }: { mensagens: Mensagem[] }) {
  const router = useRouter()
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<'todas' | 'nao_lidas' | 'nao_respondidas'>('todas')
  const [selecionada, setSelecionada] = useState<Mensagem | null>(null)
  const [confirmarExclusao, setConfirmarExclusao] = useState<string | null>(null)
  const [processando, setProcessando] = useState(false)

  const filtradas = mensagens.filter((m) => {
    const termo = busca.toLowerCase()
    const matchBusca =
      busca === '' ||
      m.nome.toLowerCase().includes(termo) ||
      m.email.toLowerCase().includes(termo) ||
      (m.assunto || '').toLowerCase().includes(termo)
    const matchFiltro =
      filtro === 'todas' ||
      (filtro === 'nao_lidas' && !m.lida) ||
      (filtro === 'nao_respondidas' && !m.respondida)
    return matchBusca && matchFiltro
  })

  const naoLidas = mensagens.filter((m) => !m.lida).length
  const naoRespondidas = mensagens.filter((m) => !m.respondida).length

  async function abrir(m: Mensagem) {
    setSelecionada(m)
    if (!m.lida) {
      await marcarMensagemLida(m.id, true)
    }
  }

  async function handleMarcarRespondida(id: string) {
    setProcessando(true)
    await marcarMensagemRespondida(id)
    setProcessando(false)
    setSelecionada(null)
    router.refresh()
  }

  async function handleToggleLida(m: Mensagem) {
    setProcessando(true)
    await marcarMensagemLida(m.id, !m.lida)
    setProcessando(false)
    router.refresh()
  }

  async function handleExcluir() {
    if (!confirmarExclusao) return
    setProcessando(true)
    await excluirMensagem(confirmarExclusao)
    setProcessando(false)
    setConfirmarExclusao(null)
    setSelecionada(null)
    router.refresh()
  }

  return (
    <AdminShell mode="school" active="Mensagens">
      <main className="px-5 py-8 lg:px-8">
        <SectionHeading
          eyebrow="Contato"
          title="Mensagens recebidas"
          description="Mensagens enviadas pelo formulário de contato do site."
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Panel className="flex items-center gap-4 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#ccfbf1] text-[#0d9488]">
              <Inbox className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Total</p>
              <p className="text-2xl font-bold tracking-[-.03em] text-[#0d9488]">{mensagens.length}</p>
            </div>
          </Panel>
          <Panel className="flex items-center gap-4 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#fef3c7] text-[#92400e]">
              <Eye className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Não lidas</p>
              <p className="text-2xl font-bold tracking-[-.03em] text-[#92400e]">{naoLidas}</p>
            </div>
          </Panel>
          <Panel className="flex items-center gap-4 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#dbeafe] text-[#3b82f6]">
              <Check className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Não respondidas</p>
              <p className="text-2xl font-bold tracking-[-.03em] text-[#3b82f6]">{naoRespondidas}</p>
            </div>
          </Panel>
        </div>

        <Panel className="mt-8">
          <div className="border-b border-[#e5ecee] px-5 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: 'todas', label: 'Todas' },
                  { key: 'nao_lidas', label: 'Não lidas' },
                  { key: 'nao_respondidas', label: 'Não respondidas' },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFiltro(f.key as typeof filtro)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      filtro === f.key ? 'bg-[#ccfbf1] text-[#0f766e]' : 'text-[#6b7d86] hover:bg-[#f1f5f6]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 lg:w-72">
                <Search className="size-4 text-[#9aaab0]" />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por nome, e-mail ou assunto"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-[#a0afb4]"
                />
              </div>
            </div>
          </div>

          {filtradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <div className="grid size-14 place-items-center rounded-full bg-[#ccfbf1] text-[#0d9488]">
                <Inbox className="size-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-[#12232b]">Nenhuma mensagem</h3>
              <p className="mt-1 max-w-sm text-sm text-[#82939a]">
                Quando alguém enviar mensagem pelo formulário de contato, ela aparecerá aqui.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#f0f4f5]">
              {filtradas.map((m) => (
                <div key={m.id} className={`flex items-start gap-4 px-5 py-4 transition hover:bg-[#fafcfc] ${!m.lida ? 'bg-[#f0fbf8]' : ''}`}>
                  <div className={`grid size-10 shrink-0 place-items-center rounded-full ${!m.lida ? 'bg-[#0d9488] text-white' : 'bg-[#f0f4f5] text-[#536871]'}`}>
                    <span className="text-xs font-bold">
                      {m.nome.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-[#243942]">{m.nome}</h3>
                      {!m.lida && <span className="rounded-full bg-[#dc2626] px-2 py-0.5 text-[10px] font-bold text-white">Nova</span>}
                      {m.respondida && <span className="rounded-full bg-[#d1fae5] px-2 py-0.5 text-[10px] font-bold text-[#065f46]">Respondida</span>}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-[#82939a]">
                      {m.email}{m.telefone ? ` · ${m.telefone}` : ''}
                    </p>
                    {m.assunto && (
                      <p className="mt-1 text-sm font-medium text-[#243942]">{m.assunto}</p>
                    )}
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#82939a]">{m.mensagem}</p>
                    <p className="mt-1 text-[11px] text-[#a0afb4]">{formatarDataHora(m.criado_em)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => abrir(m)}
                      className="rounded-lg p-1.5 text-[#6b7d86] hover:bg-[#e5ecee]"
                      title="Abrir"
                    >
                      <Eye className="size-4" />
                    </button>
                    <button
                      onClick={() => handleToggleLida(m)}
                      disabled={processando}
                      className="rounded-lg p-1.5 text-[#6b7d86] hover:bg-[#e5ecee] disabled:opacity-50"
                      title={m.lida ? 'Marcar como não lida' : 'Marcar como lida'}
                    >
                      {m.lida ? <EyeOff className="size-4" /> : <Check className="size-4" />}
                    </button>
                    <button
                      onClick={() => setConfirmarExclusao(m.id)}
                      className="rounded-lg p-1.5 text-[#6b7d86] hover:bg-[#fee2e2] hover:text-[#dc2626]"
                      title="Excluir"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </main>

      {/* MODAL DE LEITURA */}
      {selecionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelecionada(null)} />
          <div className="relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl">
            <header className="flex items-start justify-between border-b border-[#e5ecee] px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-[#12232b]">
                  {selecionada.assunto || 'Sem assunto'}
                </h2>
                <p className="mt-1 text-xs text-[#82939a]">{formatarDataHora(selecionada.criado_em)}</p>
              </div>
              <button onClick={() => setSelecionada(null)} className="rounded-lg p-2 text-[#6b7d86] hover:bg-[#f1f5f6]">
                <X className="size-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="mb-5 rounded-lg border border-[#e5ecee] bg-[#fafcfc] p-4">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-full bg-[#0d9488] text-sm font-bold text-white">
                    {selecionada.nome.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#243942]">{selecionada.nome}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#82939a]">
                      <a href={`mailto:${selecionada.email}`} className="flex items-center gap-1 hover:text-[#0d9488]">
                        <Mail className="size-3.5" /> {selecionada.email}
                      </a>
                      {selecionada.telefone && (
                        <a href={`tel:${selecionada.telefone.replace(/\D/g, '')}`} className="flex items-center gap-1 hover:text-[#0d9488]">
                          <Phone className="size-3.5" /> {selecionada.telefone}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#82939a]">Mensagem</p>
                <p className="whitespace-pre-wrap text-sm leading-7 text-[#243942]">{selecionada.mensagem}</p>
              </div>
            </div>

            <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[#e5ecee] bg-[#fafcfc] px-6 py-4">
              <a
                href={`mailto:${selecionada.email}?subject=${encodeURIComponent(selecionada.assunto ? `Re: ${selecionada.assunto}` : 'Resposta')}`}
                className="inline-flex items-center gap-2 rounded-lg bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f766e]"
              >
                <ExternalLink className="size-4" /> Responder por e-mail
              </a>
              <div className="flex items-center gap-2">
                {!selecionada.respondida && (
                  <button
                    onClick={() => handleMarcarRespondida(selecionada.id)}
                    disabled={processando}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#b8c9ce] bg-white px-3 py-2 text-sm font-semibold text-[#30454e] hover:border-[#0d9488] hover:text-[#0f766e] disabled:opacity-50"
                  >
                    <Check className="size-4" /> Marcar como respondida
                  </button>
                )}
                <button
                  onClick={() => setConfirmarExclusao(selecionada.id)}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#dc2626]/30 bg-white px-3 py-2 text-sm font-semibold text-[#dc2626] hover:bg-[#fee2e2]"
                  title="Excluir mensagem"
                >
                  <Trash2 className="size-4" /> Excluir
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}

      {/* MODAL DE EXCLUSÃO */}
      {confirmarExclusao && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmarExclusao(null)} />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#fee2e2] text-[#dc2626]">
              <Trash2 className="size-5" />
            </div>
            <h3 className="mt-4 text-center text-lg font-bold text-[#12232b]">Excluir mensagem?</h3>
            <p className="mt-2 text-center text-sm text-[#82939a]">Essa ação não pode ser desfeita.</p>
            <div className="mt-6 flex gap-2">
              <button onClick={() => setConfirmarExclusao(null)} className="flex-1 rounded-lg border border-[#b8c9ce] bg-white px-4 py-2.5 text-sm font-semibold text-[#30454e]">Cancelar</button>
              <button onClick={handleExcluir} disabled={processando} className="flex-1 rounded-lg bg-[#dc2626] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#b91c1c] disabled:opacity-50">
                {processando ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  )
}