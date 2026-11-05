'use client'

import { useState } from 'react'
import { 
  Package, Plus, Search, Edit, Trash2, CheckCircle2, X, Loader2, 
  ShoppingBag, DollarSign, Clock, Truck, Check, Eye, EyeOff
} from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import { 
  criarProduto, atualizarProduto, alternarAtivoProduto, excluirProduto, 
  atualizarStatusPedido, type Produto, type Pedido, type NovoProduto 
} from './actions'

const categoriaLabel: Record<string, string> = {
  uniformes: 'Uniformes',
  materiais: 'Materiais',
  eventos: 'Eventos',
  papelaria: 'Papelaria',
  outros: 'Outros',
}

const statusPedidoLabel: Record<string, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
  enviado: 'Enviado',
  disponivel_retirada: 'Disponível para Retirada',
  cancelado: 'Cancelado',
}

const statusColors: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-700',
  pago: 'bg-blue-100 text-blue-700',
  enviado: 'bg-purple-100 text-purple-700',
  disponivel_retirada: 'bg-teal-100 text-teal-700',
  cancelado: 'bg-red-100 text-red-700',
}

function formatarMoeda(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function LojaAdminClient({ produtos, pedidos }: { produtos: Produto[]; pedidos: Pedido[] }) {
  const [abaAtiva, setAbaAtiva] = useState<'pedidos' | 'produtos'>('pedidos')
  const [busca, setBusca] = useState('')
  
  // Modal de Produto
  const [modalProdutoAberto, setModalProdutoAberto] = useState(false)
  const [editandoProduto, setEditandoProduto] = useState<Produto | null>(null)
  const [formNome, setFormNome] = useState('')
  const [formDescricao, setFormDescricao] = useState('')
  const [formCategoria, setFormCategoria] = useState('uniformes')
  const [formPreco, setFormPreco] = useState('')
  const [formEstoque, setFormEstoque] = useState('0')
  const [salvandoProduto, setSalvandoProduto] = useState(false)
  const [erroProduto, setErroProduto] = useState('')

  // Modal de Pedido (Detalhes)
  const [pedidoDetalhe, setPedidoDetalhe] = useState<Pedido | null>(null)
  const [atualizandoStatus, setAtualizandoStatus] = useState(false)

  const produtosFiltrados = produtos.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()))
  const pedidosFiltrados = pedidos.filter(p => p.responsavel_nome.toLowerCase().includes(busca.toLowerCase()))

  function abrirNovoProduto() {
    setEditandoProduto(null)
    setFormNome('')
    setFormDescricao('')
    setFormCategoria('uniformes')
    setFormPreco('')
    setFormEstoque('0')
    setErroProduto('')
    setModalProdutoAberto(true)
  }

  function abrirEdicaoProduto(p: Produto) {
    setEditandoProduto(p)
    setFormNome(p.nome)
    setFormDescricao(p.descricao || '')
    setFormCategoria(p.categoria)
    setFormPreco((p.preco_centavos / 100).toFixed(2).replace('.', ','))
    setFormEstoque(p.estoque.toString())
    setErroProduto('')
    setModalProdutoAberto(true)
  }

  async function handleSalvarProduto() {
    if (!formNome || !formPreco) return setErroProduto('Preencha nome e preço.')
    
    setSalvandoProduto(true)
    setErroProduto('')
    
    const precoCentavos = Math.round(parseFloat(formPreco.replace(',', '.')) * 100)
    
    const payload: NovoProduto = {
      nome: formNome,
      descricao: formDescricao,
      categoria: formCategoria,
      preco_centavos: precoCentavos,
      estoque: parseInt(formEstoque) || 0,
    }

    const r = editandoProduto 
      ? await atualizarProduto(editandoProduto.id, payload)
      : await criarProduto(payload)

    setSalvandoProduto(false)
    
    if (!r.success) return setErroProduto(r.error || 'Erro ao salvar.')
    
    setModalProdutoAberto(false)
    window.location.reload()
  }

  async function handleAlternarAtivo(id: string, ativoAtual: boolean) {
    await alternarAtivoProduto(id, !ativoAtual)
    window.location.reload()
  }

  async function handleExcluirProduto(id: string) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return
    const r = await excluirProduto(id)
    if (r.success) window.location.reload()
    else alert(r.error)
  }

  async function handleMudarStatusPedido(id: string, novoStatus: string) {
    setAtualizandoStatus(true)
    const r = await atualizarStatusPedido(id, novoStatus)
    setAtualizandoStatus(false)
    if (r.success) {
      setPedidoDetalhe(null)
      window.location.reload()
    } else {
      alert(r.error)
    }
  }

  return (
    <AdminShell mode="school" active="Loja">
      <main className="px-5 py-8 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading 
            eyebrow="Gestão" 
            title="Loja Virtual" 
            description="Gerencie os produtos e os pedidos recebidos pelos responsáveis." 
          />
          {abaAtiva === 'produtos' && (
            <button onClick={abrirNovoProduto} className="bg-[#0d9488] text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-[#0f766e]">
              <Plus className="size-4" /> Novo Produto
            </button>
          )}
        </div>

        <div className="mt-8 flex gap-1 border-b border-[#e5ecee]">
          <button onClick={() => setAbaAtiva('pedidos')} className={`px-4 py-3 text-sm font-semibold border-b-2 transition ${abaAtiva === 'pedidos' ? 'border-[#0d9488] text-[#0d9488]' : 'border-transparent text-[#6b7d86] hover:text-[#12232b]'}`}>
            Pedidos Recebidos
          </button>
          <button onClick={() => setAbaAtiva('produtos')} className={`px-4 py-3 text-sm font-semibold border-b-2 transition ${abaAtiva === 'produtos' ? 'border-[#0d9488] text-[#0d9488]' : 'border-transparent text-[#6b7d86] hover:text-[#12232b]'}`}>
            Catálogo de Produtos
          </button>
        </div>

        {abaAtiva === 'pedidos' && (
          <Panel className="mt-6">
            <div className="border-b border-[#e5ecee] px-5 py-4 flex justify-between items-center">
              <h2 className="text-base font-bold text-[#12232b]">Histórico de Pedidos</h2>
              <div className="flex items-center gap-2 rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 w-64">
                <Search className="size-4 text-[#9aaab0]" />
                <input type="text" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por responsável..." className="w-full bg-transparent text-sm outline-none" />
              </div>
            </div>
            
            {pedidos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <ShoppingBag className="size-10 text-[#a0afb4] mb-3" />
                <h3 className="text-base font-bold text-[#12232b]">Nenhum pedido recebido</h3>
                <p className="mt-1 text-sm text-[#82939a]">Os pedidos feitos na loja aparecerão aqui.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#e5ecee] bg-[#fafcfc]">
                      <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Responsável</th>
                      <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Data</th>
                      <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Total</th>
                      <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Status</th>
                      <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedidosFiltrados.map(p => (
                      <tr key={p.id} className="border-b border-[#f0f4f5] hover:bg-[#fafcfc]">
                        <td className="px-5 py-3.5 text-sm font-semibold text-[#243942]">{p.responsavel_nome}</td>
                        <td className="px-5 py-3.5 text-sm text-[#82939a]">{new Date(p.criado_em).toLocaleDateString('pt-BR')}</td>
                        <td className="px-5 py-3.5 text-sm font-bold text-[#0d9488]">{formatarMoeda(p.total_centavos)}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusColors[p.status] || 'bg-gray-100 text-gray-700'}`}>
                            {statusPedidoLabel[p.status] || p.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button onClick={() => setPedidoDetalhe(p)} className="text-xs bg-white border border-[#d5e0e3] text-[#30454e] px-3 py-1.5 rounded-lg font-semibold hover:border-[#0d9488]">
                            Ver Detalhes
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        )}

        {abaAtiva === 'produtos' && (
          <Panel className="mt-6">
            <div className="border-b border-[#e5ecee] px-5 py-4 flex justify-between items-center">
              <h2 className="text-base font-bold text-[#12232b]">Catálogo de Produtos</h2>
              <div className="flex items-center gap-2 rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 w-64">
                <Search className="size-4 text-[#9aaab0]" />
                <input type="text" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar produto..." className="w-full bg-transparent text-sm outline-none" />
              </div>
            </div>

            {produtos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Package className="size-10 text-[#a0afb4] mb-3" />
                <h3 className="text-base font-bold text-[#12232b]">Nenhum produto cadastrado</h3>
                <p className="mt-1 text-sm text-[#82939a]">Adicione produtos para começar a vender.</p>
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
                      <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Status</th>
                      <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produtosFiltrados.map(p => (
                      <tr key={p.id} className="border-b border-[#f0f4f5] hover:bg-[#fafcfc]">
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-semibold text-[#243942]">{p.nome}</p>
                          <p className="text-xs text-[#82939a] line-clamp-1">{p.descricao || 'Sem descrição'}</p>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-[#4d626c] capitalize">{categoriaLabel[p.categoria] || p.categoria}</td>
                        <td className="px-5 py-3.5 text-sm font-bold text-[#0d9488]">{formatarMoeda(p.preco_centavos)}</td>
                        <td className="px-5 py-3.5 text-sm text-[#4d626c]">{p.estoque}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${p.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {p.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right flex justify-end gap-1">
                          <button onClick={() => handleAlternarAtivo(p.id, p.ativo)} className="p-1.5 text-gray-400 hover:text-[#0d9488]" title={p.ativo ? 'Desativar' : 'Ativar'}>
                            {p.ativo ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </button>
                          <button onClick={() => abrirEdicaoProduto(p)} className="p-1.5 text-[#0d9488] hover:bg-[#ccfbf1] rounded-lg" title="Editar">
                            <Edit className="size-4" />
                          </button>
                          <button onClick={() => handleExcluirProduto(p.id)} className="p-1.5 text-gray-400 hover:text-red-500" title="Excluir">
                            <Trash2 className="size-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        )}
      </main>

      {/* MODAL CRIAR/EDITAR PRODUTO */}
      {modalProdutoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white p-6 rounded-xl max-w-lg w-full relative shadow-2xl">
            <button onClick={() => setModalProdutoAberto(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"><X className="size-5" /></button>
            <h3 className="text-lg font-bold text-[#12232b] mb-6">{editandoProduto ? 'Editar Produto' : 'Novo Produto'}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">Nome do Produto</label>
                <input type="text" value={formNome} onChange={e => setFormNome(e.target.value)} className="w-full border p-2 rounded outline-none focus:border-[#0d9488]" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Descrição (Opcional)</label>
                <textarea value={formDescricao} onChange={e => setFormDescricao(e.target.value)} rows={2} className="w-full border p-2 rounded outline-none focus:border-[#0d9488] resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">Preço (R$)</label>
                  <input type="text" value={formPreco} onChange={e => setFormPreco(e.target.value)} placeholder="Ex: 50,00" className="w-full border p-2 rounded outline-none focus:border-[#0d9488]" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Estoque</label>
                  <input type="number" value={formEstoque} onChange={e => setFormEstoque(e.target.value)} className="w-full border p-2 rounded outline-none focus:border-[#0d9488]" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Categoria</label>
                <select value={formCategoria} onChange={e => setFormCategoria(e.target.value)} className="w-full border p-2 rounded outline-none focus:border-[#0d9488]">
                  {Object.entries(categoriaLabel).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {erroProduto && <p className="text-red-500 text-sm">{erroProduto}</p>}

              <button onClick={handleSalvarProduto} disabled={salvandoProduto} className="w-full bg-[#0d9488] text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2 hover:bg-[#0f766e] mt-2 disabled:opacity-50">
                {salvandoProduto ? <Loader2 className="animate-spin size-5" /> : <Check className="size-5" />}
                {salvandoProduto ? 'Salvando...' : 'Salvar Produto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER DETALHE DO PEDIDO */}
      {pedidoDetalhe && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <aside className="bg-white w-full max-w-md h-full p-6 relative shadow-2xl flex flex-col">
            <button onClick={() => setPedidoDetalhe(null)} className="absolute right-4 top-4 text-gray-500 hover:text-gray-800"><X className="size-5" /></button>
            
            <div className="mb-6">
              <h2 className="text-xl font-bold text-[#12232b]">Pedido de {pedidoDetalhe.responsavel_nome}</h2>
              <p className="text-sm text-[#82939a]">{new Date(pedidoDetalhe.criado_em).toLocaleString('pt-BR')}</p>
            </div>

            <div className="flex-1 overflow-y-auto">
              <h3 className="text-xs font-bold uppercase text-[#536871] mb-2">Itens</h3>
              <div className="space-y-2 mb-6">
                {pedidoDetalhe.itens.map((i, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded-lg">
                    <span>{i.quantidade}x {i.produto_nome}</span>
                    <span className="font-semibold">{formatarMoeda(i.quantidade * i.preco_unitario_centavos)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center font-bold text-lg pt-2 border-t border-[#e5ecee]">
                  <span>Total:</span>
                  <span className="text-[#0d9488]">{formatarMoeda(pedidoDetalhe.total_centavos)}</span>
                </div>
              </div>

              {pedidoDetalhe.observacao && (
                <div className="mb-6">
                  <h3 className="text-xs font-bold uppercase text-[#536871] mb-2">Observação do Responsável</h3>
                  <p className="text-sm p-3 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-lg">{pedidoDetalhe.observacao}</p>
                </div>
              )}

              <div>
                <h3 className="text-xs font-bold uppercase text-[#536871] mb-3">Alterar Status</h3>
                <div className="space-y-2">
                  {['pendente', 'pago', 'enviado', 'disponivel_retirada', 'cancelado'].map(status => (
                    <button 
                      key={status}
                      onClick={() => handleMudarStatusPedido(pedidoDetalhe.id, status)}
                      disabled={pedidoDetalhe.status === status || atualizandoStatus}
                      className={`w-full text-left px-4 py-3 rounded-lg border text-sm font-semibold transition flex items-center justify-between ${pedidoDetalhe.status === status ? 'border-[#0d9488] bg-[#f0fdfa] text-[#0d9488]' : 'border-[#e5ecee] hover:border-[#0d9488] text-[#30454e]'}`}
                    >
                      {statusPedidoLabel[status]}
                      {pedidoDetalhe.status === status && <CheckCircle2 className="size-4" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </AdminShell>
  )
}
