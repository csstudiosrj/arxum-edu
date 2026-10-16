'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, Building2, Users, DollarSign, Inbox, Eye, Edit, Trash2,
  X, Loader2, Check, Calendar, Mail, MessageCircle, FileText,
} from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import { atualizarEscola, excluirEscola, type EscolaSuper, type Plano } from '../actions'

const statusStyles: Record<string, string> = {
  ativa: 'bg-[#d1fae5] text-[#065f46]',
  trial: 'bg-[#dbeafe] text-[#1e40af]',
  suspensa: 'bg-[#fef3c7] text-[#92400e]',
  cancelada: 'bg-[#fee2e2] text-[#991b1b]',
}

const statusLabel: Record<string, string> = {
  ativa: 'Ativa',
  trial: 'Trial',
  suspensa: 'Suspensa',
  cancelada: 'Cancelada',
}

function corPlano(slug: string): string {
  const cores: Record<string, string> = {
    semente: '#5e7a94',
    raiz: '#0d9488',
    copa: '#3b82f6',
    rede: '#7c3aed',
  }
  return cores[slug] || '#6b7d86'
}

function formatarMoeda(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function formatarData(iso: string | null): string {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('pt-BR') } catch { return '—' }
}

export function EscolasClient({ escolas, planos }: { escolas: EscolaSuper[]; planos: Plano[] }) {
  const router = useRouter()
  const [busca, setBusca] = useState('')
  const [filtroPlano, setFiltroPlano] = useState('todos')
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [editando, setEditando] = useState<EscolaSuper | null>(null)
  const [confirmarExclusao, setConfirmarExclusao] = useState<string | null>(null)
  const [processando, setProcessando] = useState(false)

  const [formPlano, setFormPlano] = useState('')
  const [formStatus, setFormStatus] = useState('ativa')
  const [formVencimento, setFormVencimento] = useState('')
  const [formContato, setFormContato] = useState('')
  const [formWhatsapp, setFormWhatsapp] = useState('')
  const [formObservacoes, setFormObservacoes] = useState('')

  const filtradas = escolas.filter((e) => {
    const matchPlano = filtroPlano === 'todos' || e.plano === filtroPlano
    const matchStatus = filtroStatus === 'todos' || e.status_assinatura === filtroStatus
    const termo = busca.toLowerCase()
    const matchBusca = busca === '' || e.nome.toLowerCase().includes(termo) || e.slug.toLowerCase().includes(termo)
    return matchPlano && matchStatus && matchBusca
  })

  const totalAlunos = escolas.reduce((s, e) => s + e.alunos, 0)
  const mrrTotal = escolas.reduce((s, e) => s + e.mrrCentavos, 0)

  function abrirEdicao(escola: EscolaSuper) {
    setEditando(escola)
    setFormPlano(escola.plano)
    setFormStatus(escola.status_assinatura || 'ativa')
    setFormVencimento(escola.data_vencimento || '')
    setFormContato(escola.contato_responsavel || '')
    setFormWhatsapp(escola.whatsapp || '')
    setFormObservacoes(escola.observacoes_admin || '')
  }

  async function handleSalvar() {
    if (!editando) return
    setProcessando(true)
    const r = await atualizarEscola(editando.id, {
      plano: formPlano,
      status_assinatura: formStatus,
      data_vencimento: formVencimento || null,
      contato_responsavel: formContato || null,
      whatsapp: formWhatsapp || null,
      observacoes_admin: formObservacoes || null,
    })
    setProcessando(false)
    if (!r.success) { alert(r.error || 'Erro.'); return }
    setEditando(null)
    router.refresh()
  }

  async function handleExcluir() {
    if (!confirmarExclusao) return
    setProcessando(true)
    const r = await excluirEscola(confirmarExclusao)
    setProcessando(false)
    if (!r.success) { alert(r.error || 'Erro.'); return }
    setConfirmarExclusao(null)
    router.refresh()
  }

  return (
    <AdminShell mode="super" active="Escolas">
      <main className="px-5 py-8 lg:px-8">
        <SectionHeading
          eyebrow="ARXUM Admin"
          title="Escolas"
          description="Todas as escolas clientes da plataforma."
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Panel className="flex items-center gap-4 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#ccfbf1] text-[#0d9488]"><Building2 className="size-5" /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Escolas</p>
              <p className="text-2xl font-bold tracking-[-.03em] text-[#0d9488]">{escolas.length}</p>
            </div>
          </Panel>
          <Panel className="flex items-center gap-4 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#dbeafe] text-[#3b82f6]"><Users className="size-5" /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Alunos</p>
              <p className="text-2xl font-bold tracking-[-.03em] text-[#3b82f6]">{totalAlunos.toLocaleString('pt-BR')}</p>
            </div>
          </Panel>
          <Panel className="flex items-center gap-4 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#d1fae5] text-[#065f46]"><DollarSign className="size-5" /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">MRR</p>
              <p className="text-2xl font-bold tracking-[-.03em] text-[#065f46]">{formatarMoeda(mrrTotal)}</p>
            </div>
          </Panel>
        </div>

        <Panel className="mt-8">
          <div className="border-b border-[#e5ecee] px-5 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => setFiltroStatus('todos')} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${filtroStatus === 'todos' ? 'bg-[#ccfbf1] text-[#0f766e]' : 'text-[#6b7d86] hover:bg-[#f1f5f6]'}`}>Todas</button>
                {Object.keys(statusLabel).map((s) => (
                  <button key={s} onClick={() => setFiltroStatus(s)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${filtroStatus === s ? 'bg-[#ccfbf1] text-[#0f766e]' : 'text-[#6b7d86] hover:bg-[#f1f5f6]'}`}>
                    {statusLabel[s]}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <select value={filtroPlano} onChange={(e) => setFiltroPlano(e.target.value)} className="rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-xs font-semibold text-[#6b7d86] outline-none focus:border-[#0d9488]">
                  <option value="todos">Todos os planos</option>
                  {planos.map((p) => <option key={p.slug} value={p.slug}>{p.nome}</option>)}
                </select>
                <div className="flex items-center gap-2 rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 lg:w-64">
                  <Search className="size-4 text-[#9aaab0]" />
                  <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar escola" className="w-full bg-transparent text-sm outline-none placeholder:text-[#a0afb4]" />
                </div>
              </div>
            </div>
          </div>

          {escolas.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <div className="grid size-14 place-items-center rounded-full bg-[#ccfbf1] text-[#0d9488]"><Inbox className="size-6" /></div>
              <h3 className="mt-4 text-base font-bold text-[#12232b]">Nenhuma escola ainda</h3>
              <p className="mt-1 max-w-sm text-sm text-[#82939a]">As escolas que se cadastrarem aparecerão aqui.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#e5ecee] bg-[#fafcfc]">
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Escola</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Plano</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Status</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Alunos</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">MRR</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Vencimento</th>
                    <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map((e) => (
                    <tr key={e.id} className="border-b border-[#f0f4f5] transition hover:bg-[#fafcfc]">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="grid size-9 place-items-center rounded-lg bg-[#f0f4f5] text-[#536871]"><Building2 className="size-4" /></div>
                          <div>
                            <div className="text-sm font-semibold text-[#243942]">{e.nome}</div>
                            <div className="text-xs text-[#82939a]">{e.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ backgroundColor: `${corPlano(e.plano)}15`, color: corPlano(e.plano) }}>
                          {planos.find((p) => p.slug === e.plano)?.nome || e.plano}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyles[e.status_assinatura]}`}>
                          {statusLabel[e.status_assinatura]}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-[#4d626c]">{e.alunos}</td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-[#243942]">{formatarMoeda(e.mrrCentavos)}</td>
                      <td className="px-5 py-3.5 text-sm text-[#82939a]">{formatarData(e.data_vencimento)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => abrirEdicao(e)} className="rounded-lg p-1.5 text-[#0d9488] hover:bg-[#ccfbf1]" title="Editar">
                            <Edit className="size-4" />
                          </button>
                          <button onClick={() => setConfirmarExclusao(e.id)} className="rounded-lg p-1.5 text-[#6b7d86] hover:bg-[#fee2e2] hover:text-[#dc2626]" title="Excluir">
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </main>

      {editando && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => !processando && setEditando(null)} />
          <aside className="relative z-10 flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-[#e5ecee] px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-[#12232b]">{editando.nome}</h2>
                <p className="mt-0.5 text-xs text-[#82939a]">Editar assinatura e contato</p>
              </div>
              <button onClick={() => setEditando(null)} disabled={processando} className="rounded-lg p-2 text-[#6b7d86] hover:bg-[#f1f5f6] disabled:opacity-50"><X className="size-5" /></button>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Plano</label>
                  <div className="grid grid-cols-2 gap-2">
                    {planos.map((p) => (
                      <button key={p.slug} type="button" onClick={() => setFormPlano(p.slug)} className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${formPlano === p.slug ? 'border-[#0d9488] bg-[#ccfbf1] text-[#0f766e]' : 'border-[#d5e0e3] bg-white text-[#6b7d86] hover:border-[#0d9488]'}`}>
                        {p.nome} · {formatarMoeda(p.preco_centavos)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Status da assinatura</label>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(statusLabel).map(([key, label]) => (
                      <button key={key} type="button" onClick={() => setFormStatus(key)} className={`rounded-lg border px-2 py-2 text-xs font-semibold transition ${formStatus === key ? 'border-[#0d9488] bg-[#ccfbf1] text-[#0f766e]' : 'border-[#d5e0e3] bg-white text-[#6b7d86] hover:border-[#0d9488]'}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Data de vencimento</label>
                  <input type="date" value={formVencimento} onChange={(e) => setFormVencimento(e.target.value)} className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none focus:border-[#0d9488]" />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Contato responsável</label>
                  <input type="text" value={formContato} onChange={(e) => setFormContato(e.target.value)} placeholder="Nome do contato principal" className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]" />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">WhatsApp</label>
                  <input type="text" value={formWhatsapp} onChange={(e) => setFormWhatsapp(e.target.value)} placeholder="(21) 90000-0000" className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]" />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Observações internas</label>
                  <textarea value={formObservacoes} onChange={(e) => setFormObservacoes(e.target.value)} rows={3} placeholder="Notas sobre essa escola (visível só para ARXUM)" className="w-full resize-none rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]" />
                </div>
              </div>
            </div>

            <footer className="flex items-center justify-end gap-2 border-t border-[#e5ecee] bg-[#fafcfc] px-6 py-4">
              <button onClick={() => setEditando(null)} disabled={processando} className="rounded-lg border border-[#b8c9ce] bg-white px-4 py-2 text-sm font-semibold text-[#30454e] disabled:opacity-50">Cancelar</button>
              <button onClick={handleSalvar} disabled={processando} className="inline-flex items-center gap-2 rounded-lg bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f766e] disabled:opacity-50">
                {processando ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                {processando ? 'Salvando...' : 'Salvar'}
              </button>
            </footer>
          </aside>
        </div>
      )}

      {confirmarExclusao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmarExclusao(null)} />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#fee2e2] text-[#dc2626]"><Trash2 className="size-5" /></div>
            <h3 className="mt-4 text-center text-lg font-bold text-[#12232b]">Excluir escola?</h3>
            <p className="mt-2 text-center text-sm text-[#82939a]">
              Todos os dados vinculados (alunos, matrículas, notas, faturas) serão permanentemente removidos. Essa ação não pode ser desfeita.
            </p>
            <div className="mt-6 flex gap-2">
              <button onClick={() => setConfirmarExclusao(null)} className="flex-1 rounded-lg border border-[#b8c9ce] bg-white px-4 py-2.5 text-sm font-semibold text-[#30454e]">Cancelar</button>
              <button onClick={handleExcluir} disabled={processando} className="flex-1 rounded-lg bg-[#dc2626] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#b91c1c] disabled:opacity-50">
                {processando ? 'Excluindo...' : 'Excluir escola'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  )
}