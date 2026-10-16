'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, Plus, Headphones, AlertCircle, CheckCircle2, Clock,
  Trash2, X, Loader2, Check, Eye, MessageSquare, Send,
} from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import {
  criarTicket, atualizarTicket, excluirTicket,
  type Ticket,
} from '../actions'

const prioridadeStyles: Record<string, string> = {
  baixa: 'bg-[#e5ecee] text-[#5e7a94]',
  normal: 'bg-[#dbeafe] text-[#1e40af]',
  alta: 'bg-[#fef3c7] text-[#92400e]',
  urgente: 'bg-[#fee2e2] text-[#991b1b]',
}

const prioridadeLabel: Record<string, string> = {
  baixa: 'Baixa',
  normal: 'Normal',
  alta: 'Alta',
  urgente: 'Urgente',
}

const statusStyles: Record<string, string> = {
  aberto: 'bg-[#fef3c7] text-[#92400e]',
  em_andamento: 'bg-[#dbeafe] text-[#1e40af]',
  resolvido: 'bg-[#d1fae5] text-[#065f46]',
  fechado: 'bg-[#e5ecee] text-[#5e7a94]',
}

const statusLabel: Record<string, string> = {
  aberto: 'Aberto',
  em_andamento: 'Em andamento',
  resolvido: 'Resolvido',
  fechado: 'Fechado',
}

const categoriaLabel: Record<string, string> = {
  duvida: 'Dúvida',
  bug: 'Bug',
  sugestao: 'Sugestão',
  financeiro: 'Financeiro',
  tecnico: 'Técnico',
  outro: 'Outro',
}

function formatarDataHora(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  } catch { return '—' }
}

export function SuporteClient({
  tickets,
  escolas,
}: {
  tickets: Ticket[]
  escolas: Array<{ id: string; nome: string; plano: string }>
}) {
  const router = useRouter()
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [filtroPrioridade, setFiltroPrioridade] = useState('todas')
  const [busca, setBusca] = useState('')
  const [novoAberto, setNovoAberto] = useState(false)
  const [detalhe, setDetalhe] = useState<Ticket | null>(null)
  const [confirmarExclusao, setConfirmarExclusao] = useState<string | null>(null)
  const [processando, setProcessando] = useState(false)

  // Novo
  const [escolaIdx, setEscolaIdx] = useState('')
  const [assunto, setAssunto] = useState('')
  const [descricao, setDescricao] = useState('')
  const [prioridade, setPrioridade] = useState('normal')
  const [categoria, setCategoria] = useState('duvida')
  const [erro, setErro] = useState('')

  // Detalhe
  const [resposta, setResposta] = useState('')
  const [novoStatus, setNovoStatus] = useState('')

  const filtradas = tickets.filter((t) => {
    const matchStatus = filtroStatus === 'todos' || t.status === filtroStatus
    const matchPrioridade = filtroPrioridade === 'todas' || t.prioridade === filtroPrioridade
    const termo = busca.toLowerCase()
    const matchBusca = busca === '' || t.escola_nome.toLowerCase().includes(termo) || t.assunto.toLowerCase().includes(termo)
    return matchStatus && matchPrioridade && matchBusca
  })

  const abertos = tickets.filter((t) => t.status === 'aberto').length
  const emAndamento = tickets.filter((t) => t.status === 'em_andamento').length
  const resolvidos = tickets.filter((t) => t.status === 'resolvido' || t.status === 'fechado').length

  function limpar() { setEscolaIdx(''); setAssunto(''); setDescricao(''); setPrioridade('normal'); setCategoria('duvida'); setErro('') }

  async function handleCriar() {
    if (!escolaIdx) return setErro('Selecione a escola.')
    if (!assunto.trim()) return setErro('Informe o assunto.')

    const escola = escolas[parseInt(escolaIdx, 10)]
    if (!escola) return setErro('Escola inválida.')

    setProcessando(true); setErro('')
    const r = await criarTicket({ escola_id: escola.id, assunto, descricao, prioridade, categoria })
    setProcessando(false)
    if (!r.success) return setErro(r.error || 'Erro.')
    limpar()
    setNovoAberto(false)
    router.refresh()
  }

  function abrirDetalhe(t: Ticket) {
    setDetalhe(t)
    setResposta(t.resposta || '')
    setNovoStatus(t.status)
  }

  async function handleSalvarDetalhe() {
    if (!detalhe) return
    setProcessando(true)
    const r = await atualizarTicket(detalhe.id, {
      status: novoStatus,
      resposta: resposta || undefined,
    })
    setProcessando(false)
    if (!r.success) { alert(r.error || 'Erro.'); return }
    setDetalhe(null)
    router.refresh()
  }

  async function handleMudarPrioridade(id: string, prio: string) {
    setProcessando(true)
    await atualizarTicket(id, { prioridade: prio })
    setProcessando(false)
    router.refresh()
  }

  async function handleExcluir() {
    if (!confirmarExclusao) return
    setProcessando(true)
    await excluirTicket(confirmarExclusao)
    setProcessando(false)
    setConfirmarExclusao(null)
    setDetalhe(null)
    router.refresh()
  }

  return (
    <AdminShell mode="super" active="Suporte">
      <main className="px-5 py-8 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="ARXUM Admin"
            title="Suporte"
            description="Central de tickets das escolas clientes."
          />
          <button
            onClick={() => { limpar(); setNovoAberto(true) }}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f766e]"
          >
            <Plus className="size-4" /> Novo ticket
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Panel className="flex items-center gap-4 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#fef3c7] text-[#92400e]"><Clock className="size-5" /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Abertos</p>
              <p className="text-2xl font-bold tracking-[-.03em] text-[#92400e]">{abertos}</p>
            </div>
          </Panel>
          <Panel className="flex items-center gap-4 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#dbeafe] text-[#3b82f6]"><Headphones className="size-5" /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Em andamento</p>
              <p className="text-2xl font-bold tracking-[-.03em] text-[#3b82f6]">{emAndamento}</p>
            </div>
          </Panel>
          <Panel className="flex items-center gap-4 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#d1fae5] text-[#065f46]"><CheckCircle2 className="size-5" /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Resolvidos</p>
              <p className="text-2xl font-bold tracking-[-.03em] text-[#065f46]">{resolvidos}</p>
            </div>
          </Panel>
        </div>

        <Panel className="mt-8">
          <div className="border-b border-[#e5ecee] px-5 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => setFiltroStatus('todos')} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${filtroStatus === 'todos' ? 'bg-[#ccfbf1] text-[#0f766e]' : 'text-[#6b7d86] hover:bg-[#f1f5f6]'}`}>Todos</button>
                {Object.entries(statusLabel).map(([k, l]) => (
                  <button key={k} onClick={() => setFiltroStatus(k)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${filtroStatus === k ? 'bg-[#ccfbf1] text-[#0f766e]' : 'text-[#6b7d86] hover:bg-[#f1f5f6]'}`}>{l}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <select value={filtroPrioridade} onChange={(e) => setFiltroPrioridade(e.target.value)} className="rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-xs font-semibold text-[#6b7d86] outline-none focus:border-[#0d9488]">
                  <option value="todas">Todas prioridades</option>
                  {Object.entries(prioridadeLabel).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
                <div className="flex items-center gap-2 rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 lg:w-64">
                  <Search className="size-4 text-[#9aaab0]" />
                  <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar" className="w-full bg-transparent text-sm outline-none placeholder:text-[#a0afb4]" />
                </div>
              </div>
            </div>
          </div>

          {filtradas.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <Headphones className="mx-auto text-[#a0afb4]" size={32} />
              <p className="mt-3 text-sm text-[#82939a]">Nenhum ticket encontrado.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#f0f4f5]">
              {filtradas.map((t) => (
                <div key={t.id} className="flex items-start gap-4 px-5 py-4 transition hover:bg-[#fafcfc]">
                  <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#f0f4f5] text-[#536871]">
                    <MessageSquare className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-[#243942]">{t.assunto}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${prioridadeStyles[t.prioridade]}`}>{prioridadeLabel[t.prioridade]}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusStyles[t.status]}`}>{statusLabel[t.status]}</span>
                      <span className="rounded-full bg-[#e5ecee] px-2 py-0.5 text-[10px] font-bold text-[#5e7a94]">{categoriaLabel[t.categoria]}</span>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-[#536871]">{t.escola_nome}</p>
                    {t.descricao && <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#82939a]">{t.descricao}</p>}
                    <p className="mt-1 text-[11px] text-[#a0afb4]">{formatarDataHora(t.criado_em)}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <select
                      value={t.prioridade}
                      onChange={(e) => handleMudarPrioridade(t.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      disabled={processando}
                      className="rounded border border-[#d5e0e3] bg-white px-2 py-1 text-[10px] font-semibold text-[#6b7d86] outline-none focus:border-[#0d9488] disabled:opacity-50"
                    >
                      {Object.entries(prioridadeLabel).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                    </select>
                    <div className="flex gap-1">
                      <button onClick={() => abrirDetalhe(t)} className="rounded-lg p-1.5 text-[#6b7d86] hover:bg-[#e5ecee]" title="Ver detalhes">
                        <Eye className="size-4" />
                      </button>
                      <button onClick={() => setConfirmarExclusao(t.id)} className="rounded-lg p-1.5 text-[#6b7d86] hover:bg-[#fee2e2] hover:text-[#dc2626]" title="Excluir">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </main>

      {novoAberto && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => !processando && setNovoAberto(false)} />
          <aside className="relative z-10 flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-[#e5ecee] px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-[#12232b]">Novo ticket</h2>
                <p className="mt-0.5 text-xs text-[#82939a]">Registrar um contato da escola</p>
              </div>
              <button onClick={() => setNovoAberto(false)} disabled={processando} className="rounded-lg p-2 text-[#6b7d86] hover:bg-[#f1f5f6] disabled:opacity-50"><X className="size-5" /></button>
            </header>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Escola</label>
                  <select value={escolaIdx} onChange={(e) => setEscolaIdx(e.target.value)} className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none focus:border-[#0d9488]">
                    <option value="">Selecione</option>
                    {escolas.map((e, i) => <option key={e.id} value={String(i)}>{e.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Assunto</label>
                  <input type="text" value={assunto} onChange={(e) => setAssunto(e.target.value)} placeholder="Resumo do problema" className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Descrição</label>
                  <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={5} placeholder="Detalhe o que aconteceu" className="w-full resize-none rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Prioridade</label>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(prioridadeLabel).map(([k, l]) => (
                      <button key={k} type="button" onClick={() => setPrioridade(k)} className={`rounded-lg border px-2 py-2 text-xs font-semibold transition ${prioridade === k ? 'border-[#0d9488] bg-[#ccfbf1] text-[#0f766e]' : 'border-[#d5e0e3] bg-white text-[#6b7d86] hover:border-[#0d9488]'}`}>{l}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Categoria</label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(categoriaLabel).map(([k, l]) => (
                      <button key={k} type="button" onClick={() => setCategoria(k)} className={`rounded-lg border px-2 py-2 text-xs font-semibold transition ${categoria === k ? 'border-[#0d9488] bg-[#ccfbf1] text-[#0f766e]' : 'border-[#d5e0e3] bg-white text-[#6b7d86] hover:border-[#0d9488]'}`}>{l}</button>
                    ))}
                  </div>
                </div>
                {erro && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-600">{erro}</p>}
              </div>
            </div>
            <footer className="flex items-center justify-end gap-2 border-t border-[#e5ecee] bg-[#fafcfc] px-6 py-4">
              <button onClick={() => setNovoAberto(false)} disabled={processando} className="rounded-lg border border-[#b8c9ce] bg-white px-4 py-2 text-sm font-semibold text-[#30454e] disabled:opacity-50">Cancelar</button>
              <button onClick={handleCriar} disabled={processando} className="inline-flex items-center gap-2 rounded-lg bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f766e] disabled:opacity-50">
                {processando ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                {processando ? 'Criando...' : 'Criar ticket'}
              </button>
            </footer>
          </aside>
        </div>
      )}

      {detalhe && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => !processando && setDetalhe(null)} />
          <aside className="relative z-10 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
            <header className="flex items-start justify-between border-b border-[#e5ecee] px-6 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${prioridadeStyles[detalhe.prioridade]}`}>{prioridadeLabel[detalhe.prioridade]}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusStyles[detalhe.status]}`}>{statusLabel[detalhe.status]}</span>
                  <span className="rounded-full bg-[#e5ecee] px-2 py-0.5 text-[10px] font-bold text-[#5e7a94]">{categoriaLabel[detalhe.categoria]}</span>
                </div>
                <h2 className="mt-2 text-lg font-bold text-[#12232b]">{detalhe.assunto}</h2>
                <p className="mt-0.5 text-xs text-[#82939a]">{detalhe.escola_nome} · {formatarDataHora(detalhe.criado_em)}</p>
              </div>
              <button onClick={() => setDetalhe(null)} disabled={processando} className="rounded-lg p-2 text-[#6b7d86] hover:bg-[#f1f5f6] disabled:opacity-50"><X className="size-5" /></button>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {detalhe.descricao && (
                <div className="mb-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#82939a]">Descrição</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#243942]">{detalhe.descricao}</p>
                </div>
              )}

              <div className="mb-5">
                <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Status</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(statusLabel).map(([k, l]) => (
                    <button key={k} type="button" onClick={() => setNovoStatus(k)} className={`rounded-lg border px-2 py-2 text-xs font-semibold transition ${novoStatus === k ? 'border-[#0d9488] bg-[#ccfbf1] text-[#0f766e]' : 'border-[#d5e0e3] bg-white text-[#6b7d86] hover:border-[#0d9488]'}`}>{l}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Resposta interna</label>
                <textarea value={resposta} onChange={(e) => setResposta(e.target.value)} rows={6} placeholder="Registre aqui a solução ou andamento do ticket..." className="w-full resize-none rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]" />
              </div>
            </div>

            <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[#e5ecee] bg-[#fafcfc] px-6 py-4">
              <button onClick={() => setConfirmarExclusao(detalhe.id)} className="inline-flex items-center gap-2 rounded-lg border border-[#dc2626] bg-white px-3 py-2 text-sm font-semibold text-[#dc2626] hover:bg-[#fee2e2]">
                <Trash2 className="size-4" /> Excluir
              </button>
              <button onClick={handleSalvarDetalhe} disabled={processando} className="inline-flex items-center gap-2 rounded-lg bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f766e] disabled:opacity-50">
                {processando ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                {processando ? 'Salvando...' : 'Salvar'}
              </button>
            </footer>
          </aside>
        </div>
      )}

      {confirmarExclusao && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmarExclusao(null)} />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#fee2e2] text-[#dc2626]"><Trash2 className="size-5" /></div>
            <h3 className="mt-4 text-center text-lg font-bold text-[#12232b]">Excluir ticket?</h3>
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