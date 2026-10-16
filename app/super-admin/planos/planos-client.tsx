'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Package, DollarSign, Users, Trash2, X, Loader2, Check, Edit, Star,
} from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import { criarPlano, atualizarPlano, excluirPlano, type Plano } from '../actions'

function formatarMoeda(centavos: number): string {
  if (centavos === 0) return 'Sob consulta'
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function gerarSlug(texto: string): string {
  return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30)
}

export function PlanosClient({ planos }: { planos: Plano[] }) {
  const router = useRouter()
  const [editando, setEditando] = useState<Plano | null>(null)
  const [novoAberto, setNovoAberto] = useState(false)
  const [confirmarExclusao, setConfirmarExclusao] = useState<string | null>(null)
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState('')

  // Form novo
  const [novoNome, setNovoNome] = useState('')
  const [novoSlug, setNovoSlug] = useState('')
  const [novaDescricao, setNovaDescricao] = useState('')
  const [novoPreco, setNovoPreco] = useState('')
  const [novoMaxAlunos, setNovoMaxAlunos] = useState('')
  const [novoMaxUnidades, setNovoMaxUnidades] = useState('')
  const [novosRecursos, setNovosRecursos] = useState<string[]>([])
  const [novoRecurso, setNovoRecurso] = useState('')
  const [novoDestaque, setNovoDestaque] = useState(false)

  // Form edição
  const [editNome, setEditNome] = useState('')
  const [editDescricao, setEditDescricao] = useState('')
  const [editPreco, setEditPreco] = useState('')
  const [editMaxAlunos, setEditMaxAlunos] = useState('')
  const [editMaxUnidades, setEditMaxUnidades] = useState('')
  const [editRecursos, setEditRecursos] = useState<string[]>([])
  const [editRecurso, setEditRecurso] = useState('')
  const [editDestaque, setEditDestaque] = useState(false)
  const [editAtivo, setEditAtivo] = useState(true)

  function abrirEdicao(p: Plano) {
    setEditando(p)
    setEditNome(p.nome)
    setEditDescricao(p.descricao || '')
    setEditPreco((p.preco_centavos / 100).toFixed(2))
    setEditMaxAlunos(p.max_alunos ? String(p.max_alunos) : '')
    setEditMaxUnidades(p.max_unidades ? String(p.max_unidades) : '')
    setEditRecursos(p.recursos || [])
    setEditDestaque(p.destaque)
    setEditAtivo(p.ativo)
    setErro('')
  }

  function limparNovo() {
    setNovoNome(''); setNovoSlug(''); setNovaDescricao(''); setNovoPreco('')
    setNovoMaxAlunos(''); setNovoMaxUnidades(''); setNovosRecursos([]); setNovoRecurso(''); setNovoDestaque(false)
    setErro('')
  }

  async function handleCriar() {
    setErro('')
    if (!novoNome.trim()) return setErro('Informe o nome.')
    if (!novoSlug.trim()) return setErro('Informe o slug.')

    const preco = novoPreco ? Math.round(parseFloat(novoPreco.replace(',', '.')) * 100) : 0
    if (isNaN(preco) || preco < 0) return setErro('Preço inválido.')

    setProcessando(true)
    const r = await criarPlano({
      slug: novoSlug,
      nome: novoNome,
      descricao: novaDescricao,
      preco_centavos: preco,
      max_alunos: novoMaxAlunos ? parseInt(novoMaxAlunos, 10) : null,
      max_unidades: novoMaxUnidades ? parseInt(novoMaxUnidades, 10) : null,
      recursos: novosRecursos,
      destaque: novoDestaque,
    })
    setProcessando(false)
    if (!r.success) return setErro(r.error || 'Erro.')

    limparNovo()
    setNovoAberto(false)
    router.refresh()
  }

  async function handleSalvarEdicao() {
    if (!editando) return
    setErro('')

    const preco = editPreco ? Math.round(parseFloat(editPreco.replace(',', '.')) * 100) : 0
    if (isNaN(preco) || preco < 0) return setErro('Preço inválido.')

    setProcessando(true)
    const r = await atualizarPlano(editando.id, {
      nome: editNome,
      descricao: editDescricao,
      preco_centavos: preco,
      max_alunos: editMaxAlunos ? parseInt(editMaxAlunos, 10) : null,
      max_unidades: editMaxUnidades ? parseInt(editMaxUnidades, 10) : null,
      recursos: editRecursos,
      destaque: editDestaque,
      ativo: editAtivo,
    })
    setProcessando(false)
    if (!r.success) return setErro(r.error || 'Erro.')

    setEditando(null)
    router.refresh()
  }

  async function handleExcluir() {
    if (!confirmarExclusao) return
    setProcessando(true)
    const r = await excluirPlano(confirmarExclusao)
    setProcessando(false)
    if (!r.success) { alert(r.error || 'Erro.'); return }
    setConfirmarExclusao(null)
    router.refresh()
  }

  const mrrTotal = planos.reduce((s, p) => s + (p.preco_centavos * (p.total_escolas || 0)), 0)
  const totalEscolas = planos.reduce((s, p) => s + (p.total_escolas || 0), 0)

  return (
    <AdminShell mode="super" active="Planos">
      <main className="px-5 py-8 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="ARXUM Admin"
            title="Planos"
            description="Gerencie os planos comercializados para as escolas."
          />
          <button
            onClick={() => { limparNovo(); setNovoAberto(true) }}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f766e]"
          >
            <Plus className="size-4" /> Novo plano
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Panel className="flex items-center gap-4 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#ccfbf1] text-[#0d9488]"><Package className="size-5" /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Planos</p>
              <p className="text-2xl font-bold tracking-[-.03em] text-[#0d9488]">{planos.length}</p>
            </div>
          </Panel>
          <Panel className="flex items-center gap-4 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#dbeafe] text-[#3b82f6]"><Users className="size-5" /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Escolas</p>
              <p className="text-2xl font-bold tracking-[-.03em] text-[#3b82f6]">{totalEscolas}</p>
            </div>
          </Panel>
          <Panel className="flex items-center gap-4 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#d1fae5] text-[#065f46]"><DollarSign className="size-5" /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">MRR estimado</p>
              <p className="text-2xl font-bold tracking-[-.03em] text-[#065f46]">{formatarMoeda(mrrTotal)}</p>
            </div>
          </Panel>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {planos.map((p) => (
            <Panel key={p.id} className={`relative p-5 ${p.destaque ? 'border-[#0d9488]' : ''}`}>
              {p.destaque && (
                <div className="absolute -top-2.5 right-4 rounded-full bg-[#0d9488] px-2.5 py-0.5 text-[10px] font-bold text-white">Destaque</div>
              )}
              {!p.ativo && (
                <div className="absolute -top-2.5 left-4 rounded-full bg-[#e5ecee] px-2.5 py-0.5 text-[10px] font-bold text-[#5e7a94]">Inativo</div>
              )}
              <h3 className="text-lg font-bold text-[#12232b]">{p.nome}</h3>
              {p.descricao && <p className="mt-1 text-xs leading-5 text-[#82939a]">{p.descricao}</p>}
              <p className="mt-4 font-syne text-2xl font-bold text-[#0d9488]">{formatarMoeda(p.preco_centavos)}</p>
              <p className="mt-0.5 text-xs text-[#82939a]">
                {p.max_alunos ? `Até ${p.max_alunos} alunos` : 'Alunos ilimitados'}
                {p.max_unidades && p.max_unidades > 1 ? ` · ${p.max_unidades} unidades` : ''}
              </p>

              {p.recursos.length > 0 && (
                <ul className="mt-4 space-y-1.5">
                  {p.recursos.slice(0, 5).map((r) => (
                    <li key={r} className="flex items-start gap-2 text-xs text-[#536871]">
                      <Check className="mt-0.5 size-3 shrink-0 text-[#0d9488]" />
                      {r}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-5 flex items-center gap-2 border-t border-[#e5ecee] pt-4">
                <span className="flex-1 text-xs font-semibold text-[#82939a]">
                  {p.total_escolas} {p.total_escolas === 1 ? 'escola' : 'escolas'}
                </span>
                <button onClick={() => abrirEdicao(p)} className="rounded-lg p-1.5 text-[#0d9488] hover:bg-[#ccfbf1]" title="Editar">
                  <Edit className="size-4" />
                </button>
                <button onClick={() => setConfirmarExclusao(p.id)} className="rounded-lg p-1.5 text-[#6b7d86] hover:bg-[#fee2e2] hover:text-[#dc2626]" title="Excluir">
                  <Trash2 className="size-4" />
                </button>
              </div>
            </Panel>
          ))}
        </div>
      </main>

      {/* Drawer criar */}
      {novoAberto && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => !processando && setNovoAberto(false)} />
          <aside className="relative z-10 flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-[#e5ecee] px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-[#12232b]">Novo plano</h2>
              </div>
              <button onClick={() => setNovoAberto(false)} disabled={processando} className="rounded-lg p-2 text-[#6b7d86] hover:bg-[#f1f5f6] disabled:opacity-50"><X className="size-5" /></button>
            </header>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <FormPlano
                nome={novoNome} setNome={(v) => { setNovoNome(v); if (!novoSlug || novoSlug === gerarSlug(novoNome)) setNovoSlug(gerarSlug(v)) }}
                slug={novoSlug} setSlug={setNovoSlug}
                descricao={novaDescricao} setDescricao={setNovaDescricao}
                preco={novoPreco} setPreco={setNovoPreco}
                maxAlunos={novoMaxAlunos} setMaxAlunos={setNovoMaxAlunos}
                maxUnidades={novoMaxUnidades} setMaxUnidades={setNovoMaxUnidades}
                recursos={novosRecursos} setRecursos={setNovosRecursos}
                recursoAtual={novoRecurso} setRecursoAtual={setNovoRecurso}
                destaque={novoDestaque} setDestaque={setNovoDestaque}
                mostrarAtivo={false}
              />
              {erro && <p className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-600">{erro}</p>}
            </div>
            <footer className="flex items-center justify-end gap-2 border-t border-[#e5ecee] bg-[#fafcfc] px-6 py-4">
              <button onClick={() => setNovoAberto(false)} disabled={processando} className="rounded-lg border border-[#b8c9ce] bg-white px-4 py-2 text-sm font-semibold text-[#30454e] disabled:opacity-50">Cancelar</button>
              <button onClick={handleCriar} disabled={processando} className="inline-flex items-center gap-2 rounded-lg bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f766e] disabled:opacity-50">
                {processando ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                {processando ? 'Criando...' : 'Criar plano'}
              </button>
            </footer>
          </aside>
        </div>
      )}

      {/* Drawer editar */}
      {editando && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => !processando && setEditando(null)} />
          <aside className="relative z-10 flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-[#e5ecee] px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-[#12232b]">{editando.nome}</h2>
                <p className="mt-0.5 text-xs text-[#82939a]">Editar plano</p>
              </div>
              <button onClick={() => setEditando(null)} disabled={processando} className="rounded-lg p-2 text-[#6b7d86] hover:bg-[#f1f5f6] disabled:opacity-50"><X className="size-5" /></button>
            </header>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <FormPlano
                nome={editNome} setNome={setEditNome}
                slug={editando.slug} setSlug={() => {}}
                descricao={editDescricao} setDescricao={setEditDescricao}
                preco={editPreco} setPreco={setEditPreco}
                maxAlunos={editMaxAlunos} setMaxAlunos={setEditMaxAlunos}
                maxUnidades={editMaxUnidades} setMaxUnidades={setEditMaxUnidades}
                recursos={editRecursos} setRecursos={setEditRecursos}
                recursoAtual={editRecurso} setRecursoAtual={setEditRecurso}
                destaque={editDestaque} setDestaque={setEditDestaque}
                ativo={editAtivo} setAtivo={setEditAtivo}
                mostrarAtivo={true}
                slugBloqueado={true}
              />
              {erro && <p className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-600">{erro}</p>}
            </div>
            <footer className="flex items-center justify-end gap-2 border-t border-[#e5ecee] bg-[#fafcfc] px-6 py-4">
              <button onClick={() => setEditando(null)} disabled={processando} className="rounded-lg border border-[#b8c9ce] bg-white px-4 py-2 text-sm font-semibold text-[#30454e] disabled:opacity-50">Cancelar</button>
              <button onClick={handleSalvarEdicao} disabled={processando} className="inline-flex items-center gap-2 rounded-lg bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f766e] disabled:opacity-50">
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
            <h3 className="mt-4 text-center text-lg font-bold text-[#12232b]">Excluir plano?</h3>
            <p className="mt-2 text-center text-sm text-[#82939a]">Escolas que usam esse plano precisam ser movidas antes.</p>
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

function FormPlano(props: {
  nome: string; setNome: (v: string) => void
  slug: string; setSlug: (v: string) => void
  descricao: string; setDescricao: (v: string) => void
  preco: string; setPreco: (v: string) => void
  maxAlunos: string; setMaxAlunos: (v: string) => void
  maxUnidades: string; setMaxUnidades: (v: string) => void
  recursos: string[]; setRecursos: (v: string[]) => void
  recursoAtual: string; setRecursoAtual: (v: string) => void
  destaque: boolean; setDestaque: (v: boolean) => void
  ativo?: boolean; setAtivo?: (v: boolean) => void
  mostrarAtivo: boolean
  slugBloqueado?: boolean
}) {
  function adicionarRecurso() {
    if (!props.recursoAtual.trim()) return
    props.setRecursos([...props.recursos, props.recursoAtual.trim()])
    props.setRecursoAtual('')
  }
  function removerRecurso(idx: number) {
    props.setRecursos(props.recursos.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Nome</label>
        <input type="text" value={props.nome} onChange={(e) => props.setNome(e.target.value)} className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none focus:border-[#0d9488]" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Slug (URL de identificação)</label>
        <input type="text" value={props.slug} onChange={(e) => props.setSlug(e.target.value)} disabled={props.slugBloqueado} className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 font-mono text-sm text-[#243942] outline-none focus:border-[#0d9488] disabled:bg-[#f0f4f5] disabled:text-[#82939a]" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Descrição</label>
        <textarea value={props.descricao} onChange={(e) => props.setDescricao(e.target.value)} rows={2} className="w-full resize-none rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none focus:border-[#0d9488]" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Preço (R$)</label>
          <input type="text" value={props.preco} onChange={(e) => props.setPreco(e.target.value)} placeholder="0,00" className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Máx. alunos</label>
          <input type="number" value={props.maxAlunos} onChange={(e) => props.setMaxAlunos(e.target.value)} placeholder="Ilimitado" className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Máx. unidades</label>
          <input type="number" value={props.maxUnidades} onChange={(e) => props.setMaxUnidades(e.target.value)} placeholder="1" className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]" />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Recursos inclusos</label>
        <div className="flex gap-2">
          <input type="text" value={props.recursoAtual} onChange={(e) => props.setRecursoAtual(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); adicionarRecurso() } }} placeholder="Ex: Portal do aluno" className="flex-1 rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]" />
          <button type="button" onClick={adicionarRecurso} className="rounded-lg border border-[#b8c9ce] bg-white px-3 py-2 text-xs font-semibold text-[#30454e] hover:border-[#0d9488]">Adicionar</button>
        </div>
        {props.recursos.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {props.recursos.map((r, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-[#e5ecee] bg-[#fafcfc] px-3 py-1.5">
                <Check className="size-3.5 text-[#0d9488]" />
                <span className="flex-1 text-xs text-[#536871]">{r}</span>
                <button onClick={() => removerRecurso(i)} className="rounded p-0.5 text-[#6b7d86] hover:text-[#dc2626]">
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <label className="flex items-center gap-2 text-sm text-[#243942]">
          <input type="checkbox" checked={props.destaque} onChange={(e) => props.setDestaque(e.target.checked)} className="size-4 accent-[#0d9488]" />
          <Star className="size-3.5 text-[#d97706]" /> Marcar como plano em destaque
        </label>
        {props.mostrarAtivo && props.setAtivo && (
          <label className="flex items-center gap-2 text-sm text-[#243942]">
            <input type="checkbox" checked={props.ativo ?? true} onChange={(e) => props.setAtivo?.(e.target.checked)} className="size-4 accent-[#0d9488]" />
            Plano ativo
          </label>
        )}
      </div>
    </div>
  )
}