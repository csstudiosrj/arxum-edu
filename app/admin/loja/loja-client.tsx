'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Plus, Search, Package, Trash2, X, Loader2, Check, Edit, ShoppingBag, 
  Truck, CheckCircle2, Clock, PlusCircle
} from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import { 
  criarProduto, atualizarProduto, excluirProduto, alternarAtivoProduto, atualizarStatusPedido, 
  type Produto, type Pedido, type NovoProduto, type Variacao 
} from './actions'

const categoriaLabel: Record<string, string> = {
  uniformes: 'Uniformes', materiais: 'Materiais', eventos: 'Eventos', papelaria: 'Papelaria', outros: 'Outros',
}

const statusLabels: Record<string, string> = {
  pendente: 'Pendente', pago: 'Pago', preparando: 'Preparando', enviado: 'Enviado', disponivel_retirada: 'Disp. Retirada', entregue: 'Entregue', cancelado: 'Cancelado'
}

const statusCores: Record<string, string> = {
  pendente: 'bg-[#fef3c7] text-[#92400e]', pago: 'bg-[#d1fae5] text-[#065f46]', preparando: 'bg-[#dbeafe] text-[#1e40af]', 
  enviado: 'bg-[#ede9fe] text-[#5b21b6]', disponivel_retirada: 'bg-[#ccfbf1] text-[#0f766e]', entregue: 'bg-[#e5ecee] text-[#5e7a94]', cancelado: 'bg-[#fee2e2] text-[#991b1b]'
}

function formatarMoeda(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarData(iso: string): string {
  try { return new Date(iso).toLocaleDateString('pt-BR') } catch { return '—' }
}

export function LojaAdminClient({ produtos, pedidos }: { produtos: Produto[], pedidos: Pedido[] }) {
  const router = useRouter()
  const [aba, setAba] = useState<'produtos' | 'pedidos'>('produtos')
  
  // Produtos
  const [produtoAberto, setProdutoAberto] = useState(false)
  const [editando, setEditando] = useState<Produto | null>(null)
  const [confirmarExclusao, setConfirmarExclusao] = useState<string | null>(null)
  
  // Form Produto
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [categoria, setCategoria] = useState('uniformes')
  const [preco, setPreco] = useState('')
  const [estoque, setEstoque] = useState('')
  const [variacoes, setVariacoes] = useState<Variacao[]>([])
  
  // Pedidos
  const [pedidoDetalhe, setPedidoDetalhe] = useState<Pedido | null>(null)
  const [buscaPedido, setBuscaPedido] = useState('')

  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState('')

  function limparForm() {
    setNome(''); setDescricao(''); setCategoria('uniformes'); setPreco(''); setEstoque(''); setVariacoes([]); setEditando(null); setErro('')
  }

  function abrirEdicao(p: Produto) {
    setNome(p.nome); setDescricao(p.descricao || ''); setCategoria(p.categoria); 
    setPreco((p.preco_centavos / 100).toString().replace('.', ',')); 
    setEstoque(p.estoque.toString());
    setVariacoes(p.variacoes || [])
    setEditando(p)
    setProdutoAberto(true)
    setErro('')
  }

  function adicionarVariacao() {
    setVariacoes([...variacoes, { sku: '', tamanho: '', cor: '', estoque: 0 }])
  }

  function atualizarVariacao(idx: number, campo: keyof Variacao, valor: any) {
    const novas = [...variacoes]
    novas[idx] = { ...novas[idx], [campo]: valor }
    setVariacoes(novas)
  }

  function removerVariacao(idx: number) {
    setVariacoes(variacoes.filter((_, i) => i !== idx))
  }

  async function handleSalvarProduto() {
    if (!nome.trim()) return setErro('Informe o nome.')
    const valorCentavos = Math.round(parseFloat(preco.replace(',', '.')) * 100)
    if (isNaN(valorCentavos) || valorCentavos <= 0) return setErro('Preço inválido.')
    const estoqueNum = parseInt(estoque) || 0
    
    // Valida se as variações têm estoque
    const variacoesValidas = variacoes.map(v => ({ ...v, estoque: Number(v.estoque) || 0 }))

    setProcessando(true); setErro('')
    
    const payload = { 
      nome, descricao, categoria, preco_centavos: valorCentavos, 
      estoque: variacoesValidas.length > 0 ? 0 : estoqueNum, // O estoque principal zera se tiver variações
      variacoes: variacoesValidas 
    }

    const r = editando ? await atualizarProduto(editando.id, payload) : await criarProduto(payload)
    setProcessando(false)
    
    if (!r.success) return setErro(r.error || 'Erro.')
    limparForm(); setProdutoAberto(false); router.refresh()
  }

  const produtosFiltrados = produtos.filter(p => p.nome.toLowerCase().includes(buscaPedido.toLowerCase()))
  const pedidosFiltrados = pedidos.filter(p => p.responsavel_nome.toLowerCase().includes(buscaPedido.toLowerCase()) || p.id.includes(buscaPedido))

  return (
    <AdminShell mode="school" active="Loja">
      <main className="px-5 py-8 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Loja Virtual"
            title="Gestão da Loja"
            description="Gerencie produtos, estoque e pedidos da escola."
          />
          {aba === 'produtos' && (
            <button onClick={() => { limparForm(); setProdutoAberto(true) }} className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:brightness-90" style={{ backgroundColor: 'var(--cor-primaria, #0d9488)' }}>
              <Plus className="size-4" /> Novo produto
            </button>
          )}
        </div>

        <div className="mt-8 flex gap-1 border-b border-[#e5ecee]">
          {[
            { key: 'produtos', label: 'Produtos', icon: Package },
            { key: 'pedidos', label: 'Pedidos', icon: ShoppingBag },
          ].map(t => {
            const ativo = aba === t.key
            return (
              <button key={t.key} onClick={() => setAba(t.key as any)} className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${ativo ? '' : 'border-transparent text-[#6b7d86] hover:text-[#12232b]'}`} style={ativo ? { borderColor: 'var(--cor-primaria, #0d9488)', color: 'var(--cor-primaria, #0d9488)' } : undefined}>
                <t.icon size={16} /> {t.label}
              </button>
            )
          })}
        </div>

        <div className="mt-6">
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 lg:w-96">
            <Search className="size-4 text-[#9aaab0]" />
            <input type="text" value={buscaPedido} onChange={(e) => setBuscaPedido(e.target.value)} placeholder={`Buscar ${aba === 'produtos' ? 'produto' : 'pedido'}...`} className="w-full bg-transparent text-sm outline-none placeholder:text-[#a0afb4]" />
          </div>

          {aba === 'produtos' && (
            <Panel>
              {produtosFiltrados.length === 0 ? (
                <div className="p-12 text-center text-sm text-[#82939a]">Nenhum produto cadastrado.</div>
              ) : (
                <div className="divide-y divide-[#f0f4f5]">
                  {produtosFiltrados.map(p => (
                    <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 hover:bg-[#fafcfc] transition">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-[#243942]">{p.nome}</h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.ativo ? 'bg-[#d1fae5] text-[#065f46]' : 'bg-[#fee2e2] text-[#991b1b]'}`}>{p.ativo ? 'Ativo' : 'Inativo'}</span>
                        </div>
                        <p className="text-xs text-[#82939a] mt-1">{categoriaLabel[p.categoria]} · {formatarMoeda(p.preco_centavos)} · Estoque: {p.estoque}</p>
                        {p.variacoes && p.variacoes.length > 0 && (
                          <p className="text-[11px] text-[#0d9488] mt-1">{p.variacoes.length} variações cadastradas</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => alternarAtivoProduto(p.id, !p.ativo).then(() => router.refresh())} className="text-xs font-semibold text-[#6b7d86] hover:text-[#12232b] px-3 py-1.5">{p.ativo ? 'Desativar' : 'Ativar'}</button>
                        <button onClick={() => abrirEdicao(p)} className="p-2 text-[#6b7d86] hover:text-[var(--cor-primaria)] rounded-lg"><Edit size={16} /></button>
                        <button onClick={() => setConfirmarExclusao(p.id)} className="p-2 text-[#6b7d86] hover:text-[#dc2626] rounded-lg"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          )}

          {aba === 'pedidos' && (
            <Panel>
              {pedidosFiltrados.length === 0 ? (
                <div className="p-12 text-center text-sm text-[#82939a]">Nenhum pedido recebido.</div>
              ) : (
                <div className="divide-y divide-[#f0f4f5]">
                  {pedidosFiltrados.map(p => (
                    <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 hover:bg-[#fafcfc] transition">
                      <div>
                        <p className="font-semibold text-[#243942]">{p.responsavel_nome}</p>
                        <p className="text-xs text-[#82939a]">{formatarData(p.criado_em)} · {p.itens.length} itens · {formatarMoeda(p.total_centavos)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${statusCores[p.status] || 'bg-[#e5ecee]'}`}>{statusLabels[p.status] || p.status}</span>
                        <button onClick={() => setPedidoDetalhe(p)} className="rounded-lg border border-[#b8c9ce] bg-white px-3 py-1.5 text-xs font-semibold hover:border-[var(--cor-primaria)]">Ver detalhes</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          )}
        </div>
      </main>

      {/* MODAL PRODUTO (COM VARIAÇÕES) */}
      {produtoAberto && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => !processando && setProdutoAberto(false)} />
          <aside className="relative z-10 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-[#e5ecee] px-6 py-4">
              <div><h2 className="text-lg font-bold text-[#12232b]">{editando ? 'Editar produto' : 'Novo produto'}</h2></div>
              <button onClick={() => setProdutoAberto(false)} disabled={processando}><X className="size-5" /></button>
            </header>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div><label className="mb-1.5 block text-xs font-semibold text-[#536871]">Nome</label><input type="text" value={nome} onChange={e => setNome(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[var(--cor-primaria)]" /></div>
              <div><label className="mb-1.5 block text-xs font-semibold text-[#536871]">Descrição</label><textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={3} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[var(--cor-primaria)]" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Categoria</label>
                  <select value={categoria} onChange={e => setCategoria(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm outline-none">
                    {Object.entries(categoriaLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Preço (R$)</label>
                  <input type="text" value={preco} onChange={e => setPreco(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm outline-none" />
                </div>
              </div>
              
              <div className="pt-4 border-t border-[#e5ecee]">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-[#12232b]">Variações (Tamanho / Cor)</p>
                  <button onClick={adicionarVariacao} className="text-xs font-bold text-[var(--cor-primaria)] flex items-center gap-1"><PlusCircle size={14}/> Adicionar Variação</button>
                </div>
                {variacoes.length === 0 ? (
                  <p className="text-xs text-[#82939a] bg-[#fafcfc] p-3 rounded border text-center">Deixe vazio se o produto não tiver tamanho/cor (ex: material escolar).</p>
                ) : (
                  <div className="space-y-2">
                    {variacoes.map((v, i) => (
                      <div key={i} className="flex gap-2 items-center bg-[#fafcfc] p-2 rounded border">
                        <input type="text" placeholder="SKU" value={v.sku} onChange={e => atualizarVariacao(i, 'sku', e.target.value)} className="w-20 px-2 py-1 text-xs border rounded" />
                        <input type="text" placeholder="Tam (ex: P)" value={v.tamanho} onChange={e => atualizarVariacao(i, 'tamanho', e.target.value)} className="w-20 px-2 py-1 text-xs border rounded" />
                        <input type="text" placeholder="Cor" value={v.cor} onChange={e => atualizarVariacao(i, 'cor', e.target.value)} className="flex-1 px-2 py-1 text-xs border rounded" />
                        <input type="number" placeholder="Estoque" value={v.estoque} onChange={e => atualizarVariacao(i, 'estoque', e.target.value)} className="w-20 px-2 py-1 text-xs border rounded" />
                        <button onClick={() => removerVariacao(i)} className="text-[#dc2626] p-1"><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {variacoes.length === 0 && (
                <div className="pt-2">
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Estoque Geral</label>
                  <input type="number" value={estoque} onChange={e => setEstoque(e.target.value)} className="w-32 rounded-lg border px-3 py-2 text-sm outline-none" />
                </div>
              )}
              
              {erro && <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{erro}</p>}
            </div>
            <footer className="p-4 border-t bg-[#fafcfc] flex justify-end gap-2">
              <button onClick={() => setProdutoAberto(false)} className="px-4 py-2 text-sm text-[#536871]">Cancelar</button>
              <button onClick={handleSalvarProduto} disabled={processando} className="px-4 py-2 text-sm font-semibold text-white rounded bg-[var(--cor-primaria)] disabled:opacity-50">{processando ? 'Salvando...' : 'Salvar Produto'}</button>
            </footer>
          </aside>
        </div>
      )}

      {/* MODAL DETALHE PEDIDO */}
      {pedidoDetalhe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPedidoDetalhe(null)} />
          <div className="relative z-10 w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-bold text-[#12232b]">Pedido de {pedidoDetalhe.responsavel_nome}</h2>
                <p className="text-xs text-[#82939a]">{formatarData(pedidoDetalhe.criado_em)}</p>
              </div>
              <button onClick={() => setPedidoDetalhe(null)}><X size={20} /></button>
            </div>
            <div className="max-h-60 overflow-y-auto border rounded-lg divide-y mb-4">
              {pedidoDetalhe.itens.map((i, idx) => (
                <div key={idx} className="p-3 text-sm flex justify-between">
                  <div>
                    <p className="font-semibold">{i.quantidade}x {i.produto_nome}</p>
                    <p className="text-xs text-[#82939a]">{i.tamanho ? `Tam: ${i.tamanho}` : ''} {i.cor ? `Cor: ${i.cor}` : ''}</p>
                  </div>
                  <p className="font-mono">{formatarMoeda(i.preco_unitario_centavos * i.quantidade)}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-bold text-lg mb-6"><span>Total</span><span>{formatarMoeda(pedidoDetalhe.total_centavos)}</span></div>
            
            <div>
              <label className="text-xs font-semibold text-[#536871] mb-2 block">Atualizar Status</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(statusLabels).map(([k, v]) => (
                  <button key={k} onClick={() => atualizarStatusPedido(pedidoDetalhe.id, k).then(() => { setPedidoDetalhe(null); router.refresh() })} className={`text-xs py-2 border rounded font-semibold ${pedidoDetalhe.status === k ? 'bg-[var(--cor-primaria)] text-white' : 'bg-white hover:border-[var(--cor-primaria)]'}`}>{v}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EXCLUIR PRODUTO */}
      {confirmarExclusao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmarExclusao(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-2xl">
            <Trash2 className="mx-auto text-[#dc2626] mb-3" size={32} />
            <h3 className="font-bold text-[#12232b]">Excluir produto?</h3>
            <p className="text-xs text-[#82939a] mt-2 mb-6">Essa ação não pode ser desfeita.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmarExclusao(null)} className="flex-1 py-2 border rounded text-sm">Cancelar</button>
              <button onClick={() => excluirProduto(confirmarExclusao).then(() => { setConfirmarExclusao(null); router.refresh() })} className="flex-1 py-2 bg-[#dc2626] text-white rounded text-sm font-bold">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  )
}