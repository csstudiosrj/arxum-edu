'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, X, Loader2, Bus, ShieldCheck, Image as ImageIcon, Pill, FileQuestion, CheckCircle2, XCircle, Clock, Users } from 'lucide-react'
import { AdminShell, SectionHeading, Panel, ActionButton } from '@/components/admin-shell'
import { criarAutorizacao, excluirAutorizacao, getRespostas, type Autorizacao, type RespostaDetalhe } from './actions'

type IconeComponente = typeof Bus

const tipos: Array<{ key: string; label: string; icone: IconeComponente; cor: string }> = [
  { key: 'passeio', label: 'Passeio', icone: Bus, cor: '#0d9488' },
  { key: 'saida_antecipada', label: 'Saída antecipada', icone: ShieldCheck, cor: '#3b82f6' },
  { key: 'uso_imagem', label: 'Uso de imagem', icone: ImageIcon, cor: '#7c3aed' },
  { key: 'medicamento', label: 'Medicamento', icone: Pill, cor: '#d97706' },
  { key: 'outro', label: 'Outro', icone: FileQuestion, cor: '#6b7d86' },
]

const publicos = [
  { key: 'todos', label: 'Toda a escola' },
  { key: 'infantil', label: 'Educação Infantil' },
  { key: 'fundamental1', label: 'Fundamental I' },
  { key: 'fundamental2', label: 'Fundamental II' },
  { key: 'medio', label: 'Ensino Médio' },
]

function tipoInfo(key: string) {
  return tipos.find((t) => t.key === key) || tipos[4]
}

function formatarData(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR')
  } catch {
    return iso
  }
}

export function AutorizacoesClient({ autorizacoes }: { autorizacoes: Autorizacao[] }) {
  const router = useRouter()
  const [novoAberto, setNovoAberto] = useState(false)
  const [detalheId, setDetalheId] = useState<string | null>(null)
  const [respostas, setRespostas] = useState<RespostaDetalhe[] | null>(null)
  const [carregandoRespostas, setCarregandoRespostas] = useState(false)
  const [confirmarExclusao, setConfirmarExclusao] = useState<string | null>(null)

  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [tipo, setTipo] = useState('passeio')
  const [dataEvento, setDataEvento] = useState('')
  const [prazo, setPrazo] = useState('')
  const [publico, setPublico] = useState('todos')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  function limpar() {
    setTitulo('')
    setDescricao('')
    setTipo('passeio')
    setDataEvento('')
    setPrazo('')
    setPublico('todos')
    setErro('')
  }

  async function handleCriar() {
    if (!titulo.trim()) return setErro('Informe o título.')
    if (!descricao.trim()) return setErro('Informe a descrição.')

    setSalvando(true)
    setErro('')
    const result = await criarAutorizacao({ titulo, descricao, tipo, data_evento: dataEvento, prazo_resposta: prazo, publico })
    setSalvando(false)

    if (!result.success) return setErro(result.error || 'Erro.')

    limpar()
    setNovoAberto(false)
    router.refresh()
  }

  async function abrirDetalhe(id: string) {
    setDetalheId(id)
    setCarregandoRespostas(true)
    const r = await getRespostas(id)
    setRespostas(r)
    setCarregandoRespostas(false)
  }

  async function handleExcluir() {
    if (!confirmarExclusao) return
    await excluirAutorizacao(confirmarExclusao)
    setConfirmarExclusao(null)
    router.refresh()
  }

  const detalhe = autorizacoes.find((a) => a.id === detalheId)

  const totalRespostas = autorizacoes.reduce((s, a) => s + a.total_respostas, 0)
  const totalAutorizados = autorizacoes.reduce((s, a) => s + a.total_autorizados, 0)

  return (
    <AdminShell mode="school" active="Autorizações">
      <main className="px-5 py-8 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Autorizações digitais"
            title="Autorizações"
            description="Crie autorizações e acompanhe as respostas dos responsáveis."
          />
          <ActionButton variant="primary">
            <button onClick={() => { limpar(); setNovoAberto(true) }} className="inline-flex items-center gap-1.5">
              <Plus className="size-4" />
              Nova autorização
            </button>
          </ActionButton>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Panel className="p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#ccfbf1] text-[#0d9488]">
              <ShieldCheck className="size-5" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Autorizações</p>
            <p className="mt-1 text-2xl font-bold tracking-[-.03em] text-[#0d9488]">{autorizacoes.length}</p>
          </Panel>
          <Panel className="p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#dbeafe] text-[#3b82f6]">
              <Users className="size-5" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Respostas</p>
            <p className="mt-1 text-2xl font-bold tracking-[-.03em] text-[#3b82f6]">{totalRespostas}</p>
          </Panel>
          <Panel className="p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#d1fae5] text-[#065f46]">
              <CheckCircle2 className="size-5" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Autorizados</p>
            <p className="mt-1 text-2xl font-bold tracking-[-.03em] text-[#065f46]">{totalAutorizados}</p>
          </Panel>
        </div>

        <Panel className="mt-8">
          <div className="border-b border-[#e5ecee] px-5 py-4">
            <h2 className="text-base font-bold text-[#12232b]">Autorizações ativas</h2>
          </div>
          {autorizacoes.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <div className="grid size-14 place-items-center rounded-full bg-[#ccfbf1] text-[#0d9488]">
                <ShieldCheck className="size-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-[#12232b]">Nenhuma autorização ainda</h3>
              <p className="mt-1 max-w-sm text-sm text-[#82939a]">Crie a primeira autorização e ela aparecerá para os responsáveis responderem.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#f0f4f5]">
              {autorizacoes.map((a) => {
                const info = tipoInfo(a.tipo)
                const Icone = info.icone
                return (
                  <div key={a.id} className="flex items-center gap-4 px-5 py-4 transition hover:bg-[#fafcfc]">
                    <div className="grid size-11 shrink-0 place-items-center rounded-lg" style={{ backgroundColor: `${info.cor}15`, color: info.cor }}>
                      <Icone className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-[#243942]">{a.titulo}</h3>
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${info.cor}15`, color: info.cor }}>{info.label}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[#82939a]">
                        {a.data_evento && <span>Evento: {formatarData(a.data_evento)}</span>}
                        {a.prazo_resposta && <><span>·</span><span>Responder até: {formatarData(a.prazo_resposta)}</span></>}
                        <span>·</span>
                        <span className="inline-flex items-center gap-1"><Users className="size-3" /> {a.total_respostas} respostas ({a.total_autorizados} autorizados)</span>
                      </div>
                    </div>
                    <button
                      onClick={() => abrirDetalhe(a.id)}
                      className="hidden rounded-lg border border-[#b8c9ce] bg-white px-3 py-1.5 text-xs font-semibold text-[#30454e] hover:border-[#0d9488] hover:text-[#0f766e] sm:block"
                    >
                      Ver respostas
                    </button>
                    <button
                      onClick={() => setConfirmarExclusao(a.id)}
                      className="rounded-lg p-1.5 text-[#6b7d86] hover:bg-[#fee2e2] hover:text-[#dc2626]"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </Panel>
      </main>

      {novoAberto && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => !salvando && setNovoAberto(false)} />
          <aside className="relative z-10 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-[#e5ecee] px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-[#12232b]">Nova autorização</h2>
                <p className="mt-0.5 text-xs text-[#82939a]">Aparecerá para os responsáveis responderem</p>
              </div>
              <button onClick={() => setNovoAberto(false)} disabled={salvando} className="rounded-lg p-2 text-[#6b7d86] hover:bg-[#f1f5f6] disabled:opacity-50">
                <X className="size-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Título</label>
                  <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Passeio ao Museu Nacional" className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]" />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Descrição</label>
                  <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Detalhes do que o responsável está autorizando" rows={4} className="w-full resize-none rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]" />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Tipo</label>
                  <div className="grid grid-cols-3 gap-2">
                    {tipos.map((t) => {
                      const Icone = t.icone
                      return (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() => setTipo(t.key)}
                          className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-semibold transition ${
                            tipo === t.key ? 'border-[#0d9488] bg-[#ccfbf1] text-[#0f766e]' : 'border-[#d5e0e3] bg-white text-[#6b7d86] hover:border-[#0d9488]'
                          }`}
                        >
                          <Icone className="size-3.5" />
                          {t.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Data do evento</label>
                    <input type="date" value={dataEvento} onChange={(e) => setDataEvento(e.target.value)} className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none focus:border-[#0d9488]" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Prazo para responder</label>
                    <input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none focus:border-[#0d9488]" />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Público</label>
                  <div className="grid grid-cols-2 gap-2">
                    {publicos.map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => setPublico(p.key)}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                          publico === p.key ? 'border-[#0d9488] bg-[#ccfbf1] text-[#0f766e]' : 'border-[#d5e0e3] bg-white text-[#6b7d86] hover:border-[#0d9488]'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {erro && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-600">{erro}</p>}
              </div>
            </div>

            <footer className="flex items-center justify-end gap-2 border-t border-[#e5ecee] bg-[#fafcfc] px-6 py-4">
              <button onClick={() => setNovoAberto(false)} disabled={salvando} className="rounded-lg border border-[#b8c9ce] bg-white px-4 py-2 text-sm font-semibold text-[#30454e] disabled:opacity-50">Cancelar</button>
              <button onClick={handleCriar} disabled={salvando} className="inline-flex items-center gap-2 rounded-lg bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f766e] disabled:opacity-50">
                {salvando ? <Loader2 className="size-4 animate-spin" /> : null}
                {salvando ? 'Salvando...' : 'Criar autorização'}
              </button>
            </footer>
          </aside>
        </div>
      )}

      {detalheId && detalhe && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setDetalheId(null); setRespostas(null) }} />
          <aside className="relative z-10 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-[#e5ecee] px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-[#12232b]">{detalhe.titulo}</h2>
                <p className="mt-0.5 text-xs text-[#82939a]">{detalhe.total_respostas} respostas · {detalhe.total_autorizados} autorizados</p>
              </div>
              <button onClick={() => { setDetalheId(null); setRespostas(null) }} className="rounded-lg p-2 text-[#6b7d86] hover:bg-[#f1f5f6]">
                <X className="size-5" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {carregandoRespostas ? (
                <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin text-[#0d9488]" /></div>
              ) : !respostas || respostas.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Clock className="text-[#a0afb4]" size={28} />
                  <p className="mt-3 text-sm text-[#82939a]">Nenhum responsável respondeu ainda.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {respostas.map((r, i) => (
                    <div key={i} className={`rounded-lg border p-4 ${r.resposta === 'autorizado' ? 'border-[#0d9488]/30 bg-[#ccfbf1]/30' : 'border-[#dc2626]/30 bg-[#fee2e2]/30'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-[#243942]">{r.aluno_nome}</p>
                          <p className="mt-0.5 truncate text-xs text-[#82939a]">{r.responsavel_email}</p>
                          {r.observacao && <p className="mt-2 text-xs italic text-[#536871]">"{r.observacao}"</p>}
                          <p className="mt-2 text-xs text-[#82939a]">{new Date(r.respondido_em).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${r.resposta === 'autorizado' ? 'bg-[#d1fae5] text-[#065f46]' : 'bg-[#fee2e2] text-[#991b1b]'}`}>
                          {r.resposta === 'autorizado' ? <><CheckCircle2 className="size-3" /> Autorizado</> : <><XCircle className="size-3" /> Recusado</>}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      {confirmarExclusao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmarExclusao(null)} />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#fee2e2] text-[#dc2626]">
              <Trash2 className="size-5" />
            </div>
            <h3 className="mt-4 text-center text-lg font-bold text-[#12232b]">Excluir autorização?</h3>
            <p className="mt-2 text-center text-sm text-[#82939a]">Todas as respostas vinculadas serão removidas. Essa ação não pode ser desfeita.</p>
            <div className="mt-6 flex gap-2">
              <button onClick={() => setConfirmarExclusao(null)} className="flex-1 rounded-lg border border-[#b8c9ce] bg-white px-4 py-2.5 text-sm font-semibold text-[#30454e]">Cancelar</button>
              <button onClick={handleExcluir} className="flex-1 rounded-lg bg-[#dc2626] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#b91c1c]">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  )
}