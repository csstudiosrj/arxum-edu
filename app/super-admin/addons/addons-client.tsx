'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Package, DollarSign, Users, Trash2, X, Loader2, Check, Edit, Sparkles,
} from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import { criarAddon, atualizarAddon, excluirAddon, type AddonAdmin } from './actions'

function formatarMoeda(centavos: number): string {
  if (centavos === 0) return 'Incluso'
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function gerarSlug(texto: string): string {
  return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40)
}

export function AddonsClient({ addons }: { addons: AddonAdmin[] }) {
  const router = useRouter()
  const [novoAberto, setNovoAberto] = useState(false)
  const [editando, setEditando] = useState<AddonAdmin | null>(null)
  const [confirmarExclusao, setConfirmarExclusao] = useState<string | null>(null)
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState('')

  // Novo
  const [novoNome, setNovoNome] = useState('')
  const [novoSlug, setNovoSlug] = useState('')
  const [novaDescricao, setNovaDescricao] = useState('')
  const [novoPreco, setNovoPreco] = useState('')

  // Editar
  const [editNome, setEditNome] = useState('')
  const [editDescricao, setEditDescricao] = useState('')
  const [editPreco, setEditPreco] = useState('')
  const [editAtivo, setEditAtivo] = useState(true)

  function limparNovo() {
    setNovoNome(''); setNovoSlug(''); setNovaDescricao(''); setNovoPreco(''); setErro('')
  }

  function abrirEdicao(a: AddonAdmin) {
    setEditando(a)
    setEditNome(a.nome)
    setEditDescricao(a.descricao || '')
    setEditPreco((a.preco_centavos / 100).toFixed(2))
    setEditAtivo(a.ativo)
    setErro('')
  }

  async function handleCriar() {
    setErro('')
    if (!novoNome.trim()) return setErro('Informe o nome.')
    if (!novoSlug.trim()) return setErro('Informe o slug.')

    const preco = novoPreco ? Math.round(parseFloat(novoPreco.replace(',', '.')) * 100) : 0
    if (isNaN(preco) || preco < 0) return setErro('Preço inválido.')

    setProcessando(true)
    const r = await criarAddon({
      slug: novoSlug,
      nome: novoNome,
      descricao: novaDescricao,
      preco_centavos: preco,
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
    const r = await atualizarAddon(editando.id, {
      nome: editNome,
      descricao: editDescricao,
      preco_centavos: preco,
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
    const r = await excluirAddon(confirmarExclusao)
    setProcessando(false)
    if (!r.success) { alert(r.error || 'Erro.'); return }
    setConfirmarExclusao(null)
    router.refresh()
  }

  const totalEscolasUsando = addons.reduce((s, a) => s + a.total_escolas, 0)
  const receitaAddons = addons.reduce((s, a) => s + a.receita_centavos, 0)

  return (
    <AdminShell mode="super" active="Add-ons">
      <main className="px-5 py-8 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="ARXUM Admin"
            title="Add-ons"
            description="Recursos extras que as escolas podem ativar sob demanda."
          />
          <button
            onClick={() => { limparNovo(); setNovoAberto(true) }}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f766e]"
          >
            <Plus className="size-4" /> Novo add-on
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Panel className="flex items-center gap-4 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#ccfbf1] text-[#0d9488]"><Package className="size-5" /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Add-ons</p>
              <p className="text-2xl font-bold tracking-[-.03em] text-[#0d9488]">{addons.length}</p>
            </div>
          </Panel>
          <Panel className="flex items-center gap-4 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#dbeafe] text-[#3b82f6]"><Users className="size-5" /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Ativações</p>
              <p className="text-2xl font-bold tracking-[-.03em] text-[#3b82f6]">{totalEscolasUsando}</p>
            </div>
          </Panel>
          <Panel className="flex items-center gap-4 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#d1fae5] text-[#065f46]"><DollarSign className="size-5" /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Receita add-ons</p>
              <p className="text-2xl font-bold tracking-[-.03em] text-[#065f46]">{formatarMoeda(receitaAddons)}</p>
            </div>
          </Panel>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {addons.map((a) => (
            <Panel key={a.id} className={`relative p-5 ${!a.ativo ? 'opacity-70' : ''}`}>
              {!a.ativo && (
                <div className="absolute -top-2.5 left-4 rounded-full bg-[#e5ecee] px-2.5 py-0.5 text-[10px] font-bold text-[#5e7a94]">Inativo</div>
              )}
              <div className="grid size-10 place-items-center rounded-lg bg-[#ccfbf1] text-[#0d9488]">
                <Sparkles className="size-5" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-[#12232b]">{a.nome}</h3>
              {a.descricao && <p className="mt-1 line-clamp-3 text-xs leading-5 text-[#82939a]">{a.descricao}</p>}

              <p className="mt-4 font-syne text-xl font-bold text-[#0d9488]">{formatarMoeda(a.preco_centavos)}<span className="text-xs font-normal text-[#82939a]">{a.preco_centavos > 0 ? '/mês' : ''}</span></p>

              <div className="mt-4 space-y-1.5 border-t border-[#e5ecee] pt-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#82939a]">Escolas usando</span>
                  <span className="font-semibold text-[#243942]">{a.total_escolas}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#82939a]">Receita gerada</span>
                  <span className="font-semibold text-[#065f46]">{formatarMoeda(a.receita_centavos)}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button onClick={() => abrirEdicao(a)} className="flex-1 rounded-lg border border-[#b8c9ce] bg-white px-3 py-1.5 text-xs font-semibold text-[#30454e] hover:border-[#0d9488] hover:text-[#0f766e]">
                  <Edit className="mr-1 inline size-3.5" /> Editar
                </button>
                <button onClick={() => setConfirmarExclusao(a.id)} className="rounded-lg p-1.5 text-[#6b7d86] hover:bg-[#fee2e2] hover:text-[#dc2626]" title="Excluir">
                  <Trash2 className="size-4" />
                </button>
              </div>
            </Panel>
          ))}

          {addons.length === 0 && (
            <Panel className="col-span-full flex flex-col items-center justify-center px-5 py-16 text-center">
              <div className="grid size-14 place-items-center rounded-full bg-[#ccfbf1] text-[#0d9488]"><Package className="size-6" /></div>
              <h3 className="mt-4 text-base font-bold text-[#12232b]">Nenhum add-on cadastrado</h3>
              <p className="mt-1 max-w-sm text-sm text-[#82939a]">Crie o primeiro add-on para começar a oferecer recursos extras.</p>
            </Panel>
          )}
        </div>
      </main>

      {novoAberto && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => !processando && setNovoAberto(false)} />
          <aside className="relative z-10 flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-[#e5ecee] px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-[#12232b]">Novo add-on</h2>
              </div>
              <button onClick={() => setNovoAberto(false)} disabled={processando} className="rounded-lg p-2 text-[#6b7d86] hover:bg-[#f1f5f6] disabled:opacity-50"><X className="size-5" /></button>
            </header>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Nome</label>
                  <input
                    type="text"
                    value={novoNome}
                    onChange={(e) => {
                      setNovoNome(e.target.value)
                      if (!novoSlug || novoSlug === gerarSlug(novoNome)) setNovoSlug(gerarSlug(e.target.value))
                    }}
                    placeholder="Ex: Branding nos portais"
                    className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Slug (identificador interno)</label>
                  <input
                    type="text"
                    value={novoSlug}
                    onChange={(e) => setNovoSlug(e.target.value)}
                    placeholder="branding"
                    className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 font-mono text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Descrição</label>
                  <textarea
                    value={novaDescricao}
                    onChange={(e) => setNovaDescricao(e.target.value)}
                    rows={3}
                    placeholder="O que esse add-on oferece"
                    className="w-full resize-none rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Preço mensal (R$)</label>
                  <input
                    type="text"
                    value={novoPreco}
                    onChange={(e) => setNovoPreco(e.target.value)}
                    placeholder="99,00"
                    className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]"
                  />
                </div>
                {erro && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-600">{erro}</p>}
              </div>
            </div>
            <footer className="flex items-center justify-end gap-2 border-t border-[#e5ecee] bg-[#fafcfc] px-6 py-4">
              <button onClick={() => setNovoAberto(false)} disabled={processando} className="rounded-lg border border-[#b8c9ce] bg-white px-4 py-2 text-sm font-semibold text-[#30454e] disabled:opacity-50">Cancelar</button>
              <button onClick={handleCriar} disabled={processando} className="inline-flex items-center gap-2 rounded-lg bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f766e] disabled:opacity-50">
                {processando ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                {processando ? 'Criando...' : 'Criar add-on'}
              </button>
            </footer>
          </aside>
        </div>
      )}

      {editando && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => !processando && setEditando(null)} />
          <aside className="relative z-10 flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-[#e5ecee] px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-[#12232b]">{editando.nome}</h2>
                <p className="mt-0.5 text-xs text-[#82939a]">Editar add-on</p>
              </div>
              <button onClick={() => setEditando(null)} disabled={processando} className="rounded-lg p-2 text-[#6b7d86] hover:bg-[#f1f5f6] disabled:opacity-50"><X className="size-5" /></button>
            </header>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Nome</label>
                  <input
                    type="text"
                    value={editNome}
                    onChange={(e) => setEditNome(e.target.value)}
                    className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none focus:border-[#0d9488]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Descrição</label>
                  <textarea
                    value={editDescricao}
                    onChange={(e) => setEditDescricao(e.target.value)}
                    rows={3}
                    className="w-full resize-none rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none focus:border-[#0d9488]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Preço mensal (R$)</label>
                  <input
                    type="text"
                    value={editPreco}
                    onChange={(e) => setEditPreco(e.target.value)}
                    className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none focus:border-[#0d9488]"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-[#243942]">
                  <input
                    type="checkbox"
                    checked={editAtivo}
                    onChange={(e) => setEditAtivo(e.target.checked)}
                    className="size-4 accent-[#0d9488]"
                  />
                  Add-on ativo (aparece para novas ativações)
                </label>
                {erro && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-600">{erro}</p>}
              </div>
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
            <h3 className="mt-4 text-center text-lg font-bold text-[#12232b]">Excluir add-on?</h3>
            <p className="mt-2 text-center text-sm text-[#82939a]">Escolas que usam esse add-on precisam ser desativadas antes.</p>
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