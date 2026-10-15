'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Package, ShoppingCart, TrendingUp, DollarSign, Trash2, X, Loader2, Check, Eye } from 'lucide-react'
import { AdminShell, SectionHeading, Panel, ActionButton } from '@/components/admin-shell'
import { criarProduto, excluirProduto, atualizarStatusPedido, type Produto, type Pedido } from './actions'

const categorias = ['Todas', 'Uniformes', 'Materiais', 'Eventos', 'Papelaria', 'Outros']

const categoriaKey: Record<string, string> = {
  'Uniformes': 'uniformes',
  'Materiais': 'materiais',
  'Eventos': 'eventos',
  'Papelaria': 'papelaria',
  'Outros': 'outros',
}

const statusStyles: Record<string, string> = {
  pendente: 'bg-[#fff7df] text-[#a16207]',
  pago: 'bg-[#d1fae5] text-[#065f46]',
  entregue: 'bg-[#dbeafe] text-[#1e40af]',
  cancelado: 'bg-[#e5ecee] text-[#5e7a94]',
}

const statusLabels: Record<string, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
}

function formatarMoeda(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarData(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR')
  } catch {
    return '—'
  }
}

export function LojaAdminClient({ produtos, pedidos }: { produtos: Produto[]; pedidos: Pedido[] }) {
  const router = useRouter()
  const [aba, setAba] = useState<'produtos' | 'pedidos'>('produtos')
  const [categoria, setCategoria] = useState('Todas')
  const [busca, setBusca] = useState('')
  const [novoAberto, setNovoAberto] = useState(false)
  const [detalhePedido, setDetalhePedido] = useState<Pedido | null>(null)
  const [confirmarExclusao, setConfirmarExclusao] = useState<string | null>(null)

  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [novaCategoria, setNovaCategoria] = useState('uniformes')
  const [preco, setPreco] = useState('')
  const [estoque, setEstoque] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const produtosFiltrados = produtos.filter((p) => {
    const matchCat = categoria === 'Todas' || p.categoria === categoriaKey[categoria]
    const matchBusca = busca === '' || p.nome.toLowerCase().includes(busca.toLowerCase())
    return matchCat && matchBusca
  })

  const vendasMes = pedidos.filter((p) => p.status === 'pago' || p.status === 'entregue').reduce((s, p) => s + p.total_centavos, 0)
  const pedidosPendentes = pedidos.filter((p) => p.status === 'pendente').length
  const ticketMedio = pedidos.length > 0 ? Math.round(pedidos.reduce((s, p) => s + p.total_centavos, 0) / pedidos.length) : 0

  function limpar() {
    setNome('')
    setDescricao('')
    setNovaCategoria('uniformes')
    setPreco('')
    setEstoque('')
    setErro('')
  }

  async function handleCriar() {
    if (!nome.trim()) return setErro('Informe o nome.')
    if (!preco.trim()) return setErro('Informe o preço.')

    const precoCentavos = Math.round(parseFloat(preco.replace(',', '.')) * 100)
    if (isNaN(precoCentavos) || precoCentavos <= 0) return setErro('Preço inválido.')

    const estoqueNum = estoque.trim() ? parseInt(estoque, 10) : 0
    if (isNaN(estoqueNum) || estoqueNum < 0) return setErro('Estoque inválido.')

    setSalvando(true)
    setErro('')
    const result = await criarProduto({ nome, descricao, categoria: novaCategoria, preco_centavos: precoCentavos, estoque: estoqueNum })
    setSalvando(false)

    if (!result.success) return setErro(result.error || 'Erro.')

    limpar()
    setNovoAberto(false)
    router.refresh()
  }

  async function handleExcluir() {
    if (!confirmarExclusao) return
    await excluirProduto(confirmarExclusao)
    setConfirmarExclusao(null)
    router.refresh()
  }

  async function handleStatusPedido(id: string, status: string) {
    await atualizarStatusPedido(id, status)
    setDetalhePedido(null)
    router.refresh()
  }

  return (
    <AdminShell mode="school" active="Loja">
      <main className="px-5 py-8 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Loja virtual"
            title="Loja"
            description="Gerencie produtos, estoque e pedidos da escola."
          />
          {aba === 'produtos' && (
            <ActionButton variant="primary">
              <button onClick={() => { limpar(); setNovoAberto(true) }} className="inline-flex items-center gap-1.5">
                <Plus className="size-4" />
                Novo produto
              </button>
            </ActionButton>
          )}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Panel className="p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#ccfbf1] text-[#0d9488]">
              <DollarSign className="size-5" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Vendas confirmadas</p>
            <p className="mt-1 text-2xl font-bold tracking-[-.03em] text-[#0d9488]">{formatarMoeda(vendasMes)}</p>
          </Panel>
          <Panel className="p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#fef3c7] text-[#92400e]">
              <ShoppingCart className="size-5" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Pedidos pendentes</p>
            <p className="mt-1 text-2xl font-bold tracking-[-.03em] text-[#92400e]">{pedidosPendentes}</p>
          </Panel>
          <Panel className="p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#dbeafe] text-[#3b82f6]">
              <Package className="size-5" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Produtos ativos</p>
            <p className="mt-1 text-2xl font-bold tracking-[-.03em] text-[#3b82f6]">{produtos.filter((p) => p.ativo).length}</p>
          </Panel>
          <Panel className="p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#ede9fe] text-[#5b21b6]">
              <TrendingUp className="size-5" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Ticket médio</p>
            <p className="mt-1 text-2xl font-bold tracking-[-.03em] text-[#5b21b6]">{formatarMoeda(ticketMedio)}</p>
          </Panel>
        </div>

        <div className="mt-8 flex gap-1 border-b border-[#e5ecee]">
          <button onClick={() => setAba('produtos')} className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition ${aba === 'produtos' ? 'border-[#0d9488] text-[#0f766e]' : 'border-transparent text-[#6b7d86] hover:text-[#243942]'}`}>
            Produtos ({produtos.length})
          </button>
          <button onClick={() => setAba('pedidos')} className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition ${aba === 'pedidos' ? 'border-[#0d9488] text-[#0f766e]' : 'border-transparent text-[#6b7d86] hover:text-[#243942]'}`}>
            Pedidos ({pedidos.length})
          </button>
        </div>

        {aba === 'produtos' && (
          <Panel className="mt-6">
            <div className="border-b border-[#e5ecee] px-5 py-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-1.5">
                  {categorias.map((c) => (
                    <button key={c} onClick={() => setCategoria(c)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${categoria === c ? 'bg-[#ccfbf1] text-[#0f766e]' : 'text-[#6b7d86] hover:bg-[#f1f5f6]'}`}>
                      {c}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 lg:w-64">
                  <Search className="size-4 text-[#9aaab0]" />
                  <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar produto" className="w-full bg-transparent text-sm outline-none placeholder:text-[#a0afb4]" />
                </div>
              </div>
            </div>
            {produtos.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
                <div className="grid size-14 place-items-center rounded-full bg-[#ccfbf1] text-[#0d9488]"><Package className="size-6" /></div>
                <h3 className="mt-4 text-base font-bold text-[#12232b]">Nenhum produto ainda</h3>
                <p className="mt-1 max-w-sm text-sm text-[#82939a]">Cadastre o primeiro produto da loja.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#e5ecee] bg-[#fafcfc]">
                      <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Produto</th>
                      <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Categoria</th>
                      <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Preço</th>
                      <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Estoque</th>
                      <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produtosFiltrados.length === 0 ? (
                      <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-[#82939a]">Nenhum produto encontrado.</td></tr>
                    ) : (
                      produtosFiltrados.map((p) => (
                        <tr key={p.id} className="border-b border-[#f0f4f5] transition hover:bg-[#fafcfc]">
                          <td className="px-5 py-3.5 text-sm font-semibold text-[#243942]">
                            <div>{p.nome}</div>
                            {p.descricao && <div className="mt-0.5 truncate text-xs font-normal text-[#82939a]">{p.descricao}</div>}
                          </td>
                          <td className="px-5 py-3.5 text-sm text-[#4d626c] capitalize">{p.categoria}</td>
                          <td className="px-5 py-3.5 text-sm font-semibold text-[#243942]">{formatarMoeda(p.preco_centavos)}</td>
                          <td className="px-5 py-3.5 text-sm">
                            <span className={p.estoque === 0 ? 'font-semibold text-[#dc2626]' : p.estoque < 15 ? 'font-semibold text-[#d97706]' : 'text-[#4d626c]'}>
                              {p.estoque} un.
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex justify-end">
                              <button onClick={() => setConfirmarExclusao(p.id)} className="rounded-lg p-1.5 text-[#6b7d86] hover:bg-[#fee2e2] hover:text-[#dc2626]"><Trash2 className="size-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        )}

        {aba === 'pedidos' && (
          <Panel className="mt-6">
            <div className="border-b border-[#e5ecee] px-5 py-4">
              <h2 className="text-base font-bold text-[#12232b]">Pedidos recebidos</h2>
            </div>
            {pedidos.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
                <div className="grid size-14 place-items-center rounded-full bg-[#ccfbf1] text-[#0d9488]"><ShoppingCart className="size-6" /></div>
                <h3 className="mt-4 text-base font-bold text-[#12232b]">Nenhum pedido ainda</h3>
                <p className="mt-1 max-w-sm text-sm text-[#82939a]">Os pedidos dos responsáveis aparecerão aqui.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#f0f4f5]">
                {pedidos.map((p) => (
                  <div key={p.id} className="flex flex-wrap items-center gap-4 px-5 py-4 transition hover:bg-[#fafcfc]">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-[#243942]">{p.responsavel_nome}</h3>
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusStyles[p.status]}`}>{statusLabels[p.status]}</span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-[#82939a]">{p.responsavel_email} · {formatarData(p.criado_em)} · {p.itens.length} {p.itens.length === 1 ? 'item' : 'itens'}</p>
                    </div>
                    <strong className="text-sm font-semibold text-[#243942]">{formatarMoeda(p.total_centavos)}</strong>
                    <button onClick={() => setDetalhePedido(p)} className="rounded-lg border border-[#b8c9ce] bg-white px-3 py-1.5 text-xs font-semibold text-[#30454e] hover:border-[#0d9488] hover:text-[#0f766e]">
                      <Eye className="mr-1 inline size-3" />Ver
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        )}
      </main>

      {novoAberto && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => !salvando && setNovoAberto(false)} />
          <aside className="relative z-10 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-[#e5ecee] px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-[#12232b]">Novo produto</h2>
                <p className="mt-0.5 text-xs text-[#82939a]">Aparecerá na loja virtual</p>
              </div>
              <button onClick={() => setNovoAberto(false)} disabled={salvando} className="rounded-lg p-2 text-[#6b7d86] hover:bg-[#f1f5f6] disabled:opacity-50"><X className="size-5" /></button>
            </header>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Nome</label>
                  <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Uniforme completo" className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Descrição</label>
                  <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Detalhes do produto" rows={3} className="w-full resize-none rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Categoria</label>
                  <select value={novaCategoria} onChange={(e) => setNovaCategoria(e.target.value)} className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none focus:border-[#0d9488]">
                    <option value="uniformes">Uniformes</option>
                    <option value="materiais">Materiais</option>
                    <option value="eventos">Eventos</option>
                    <option value="papelaria">Papelaria</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Preço (R$)</label>
                    <input type="text" value={preco} onChange={(e) => setPreco(e.target.value)} placeholder="0,00" className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Estoque</label>
                    <input type="number" value={estoque} onChange={(e) => setEstoque(e.target.value)} placeholder="0" className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]" />
                  </div>
                </div>
                {erro && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-600">{erro}</p>}
              </div>
            </div>
            <footer className="flex items-center justify-end gap-2 border-t border-[#e5ecee] bg-[#fafcfc] px-6 py-4">
              <button onClick={() => setNovoAberto(false)} disabled={salvando} className="rounded-lg border border-[#b8c9ce] bg-white px-4 py-2 text-sm font-semibold text-[#30454e] disabled:opacity-50">Cancelar</button>
              <button onClick={handleCriar} disabled={salvando} className="inline-flex items-center gap-2 rounded-lg bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f766e] disabled:opacity-50">
                {salvando ? <Loader2 className="size-4 animate-spin" /> : null}
                {salvando ? 'Salvando...' : 'Criar produto'}
              </button>
            </footer>
          </aside>
        </div>
      )}

      {detalhePedido && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDetalhePedido(null)} />
          <div className="relative z-10 w-full max-w-lg rounded-xl bg-white shadow-2xl">
            <header className="flex items-start justify-between border-b border-[#e5ecee] px-6 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#82939a]">Pedido</p>
                <h2 className="mt-1 text-lg font-bold text-[#12232b]">{detalhePedido.responsavel_nome}</h2>
                <p className="mt-0.5 text-xs text-[#82939a]">{detalhePedido.responsavel_email} · {formatarData(detalhePedido.criado_em)}</p>
              </div>
              <button onClick={() => setDetalhePedido(null)} className="rounded-lg p-2 text-[#6b7d86] hover:bg-[#f1f5f6]"><X className="size-5" /></button>
            </header>
            <div className="px-6 py-5">
              <div className="mb-4">
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusStyles[detalhePedido.status]}`}>{statusLabels[detalhePedido.status]}</span>
              </div>
              <div className="space-y-2 rounded-lg border border-[#e5ecee] bg-[#fafcfc] p-4">
                {detalhePedido.itens.map((i, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-semibold text-[#243942]">{i.produto_nome}</p>
                      <p className="text-xs text-[#82939a]">{i.quantidade} × {formatarMoeda(i.preco_unitario_centavos)}</p>
                    </div>
                    <span className="font-semibold text-[#243942]">{formatarMoeda(i.quantidade * i.preco_unitario_centavos)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t border-[#e5ecee] pt-3">
                  <span className="text-sm font-bold text-[#12232b]">Total</span>
                  <span className="font-syne text-lg font-bold text-[#0d9488]">{formatarMoeda(detalhePedido.total_centavos)}</span>
                </div>
              </div>
              {detalhePedido.observacao && (
                <div className="mt-4 rounded-lg border border-[#e5ecee] bg-[#fafcfc] p-3">
                  <p className="text-xs text-[#82939a]">Observação do responsável</p>
                  <p className="mt-1 text-sm text-[#243942]">{detalhePedido.observacao}</p>
                </div>
              )}
            </div>
            <footer className="flex items-center justify-end gap-2 border-t border-[#e5ecee] bg-[#fafcfc] px-6 py-4">
              {detalhePedido.status === 'pendente' && (
                <>
                  <button onClick={() => handleStatusPedido(detalhePedido.id, 'cancelado')} className="rounded-lg border border-[#b8c9ce] bg-white px-4 py-2 text-sm font-semibold text-[#30454e]">Cancelar</button>
                  <button onClick={() => handleStatusPedido(detalhePedido.id, 'pago')} className="inline-flex items-center gap-2 rounded-lg bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f766e]"><Check className="size-4" />Marcar como pago</button>
                </>
              )}
              {detalhePedido.status === 'pago' && (
                <button onClick={() => handleStatusPedido(detalhePedido.id, 'entregue')} className="inline-flex items-center gap-2 rounded-lg bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f766e]"><Check className="size-4" />Marcar como entregue</button>
              )}
            </footer>
          </div>
        </div>
      )}

      {confirmarExclusao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmarExclusao(null)} />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#fee2e2] text-[#dc2626]"><Trash2 className="size-5" /></div>
            <h3 className="mt-4 text-center text-lg font-bold text-[#12232b]">Excluir produto?</h3>
            <p className="mt-2 text-center text-sm text-[#82939a]">Essa ação não pode ser desfeita.</p>
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