'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ShoppingCart, Plus, Minus, Trash2, X, Loader2, CheckCircle2, Package } from 'lucide-react'
import { ArxumBrand } from '@/components/arxum-brand'
import { criarPedido, type ProdutoLoja, type ItemCarrinho } from './actions'

const categoriaLabel: Record<string, string> = {
  uniformes: 'Uniformes',
  materiais: 'Materiais',
  eventos: 'Eventos',
  papelaria: 'Papelaria',
  outros: 'Outros',
}

function formatarMoeda(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function LojaClient({ produtos, estaLogado }: { produtos: ProdutoLoja[]; estaLogado: boolean }) {
  const router = useRouter()
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([])
  const [carrinhoAberto, setCarrinhoAberto] = useState(false)
  const [observacao, setObservacao] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')

  const porCategoria: Record<string, ProdutoLoja[]> = {}
  produtos.forEach((p) => {
    if (!porCategoria[p.categoria]) porCategoria[p.categoria] = []
    porCategoria[p.categoria].push(p)
  })

  const totalItens = carrinho.reduce((s, i) => s + i.quantidade, 0)
  const totalCentavos = carrinho.reduce((s, i) => s + i.quantidade * i.preco_unitario_centavos, 0)

  function adicionar(produto: ProdutoLoja) {
    setCarrinho((prev) => {
      const existente = prev.find((i) => i.produto_id === produto.id)
      if (existente) {
        return prev.map((i) => i.produto_id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i)
      }
      return [...prev, {
        produto_id: produto.id,
        produto_nome: produto.nome,
        quantidade: 1,
        preco_unitario_centavos: produto.preco_centavos,
      }]
    })
  }

  function diminuir(produtoId: string) {
    setCarrinho((prev) => prev
      .map((i) => i.produto_id === produtoId ? { ...i, quantidade: i.quantidade - 1 } : i)
      .filter((i) => i.quantidade > 0)
    )
  }

  function remover(produtoId: string) {
    setCarrinho((prev) => prev.filter((i) => i.produto_id !== produtoId))
  }

  async function finalizar() {
    if (!estaLogado) {
      router.push('/login')
      return
    }
    if (carrinho.length === 0) return

    setEnviando(true)
    setErro('')
    const result = await criarPedido(carrinho, observacao)
    setEnviando(false)

    if (!result.success) {
      setErro(result.error || 'Erro ao finalizar.')
      return
    }

    setCarrinho([])
    setObservacao('')
    setSucesso(true)
    setCarrinhoAberto(false)
    setTimeout(() => {
      setSucesso(false)
      router.push('/responsavel')
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-[#070b0f] text-[#e7f1f5]">
      <header className="sticky top-0 z-10 border-b border-white/[.08] bg-[#070b0f]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-2 text-sm text-[#8aa0ad] hover:text-white">
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Voltar</span>
          </Link>
          <ArxumBrand />
          <button
            onClick={() => setCarrinhoAberto(true)}
            className="relative flex items-center gap-2 rounded-lg bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f766e]"
          >
            <ShoppingCart className="size-4" />
            <span className="hidden sm:inline">Carrinho</span>
            {totalItens > 0 && (
              <span className="grid size-5 place-items-center rounded-full bg-white text-[10px] font-bold text-[#0d9488]">{totalItens}</span>
            )}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-[#0d9488]">Loja virtual</p>
          <h1 className="mt-3 font-syne text-4xl font-bold tracking-[-.04em] text-white">Produtos da escola</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#8aa0ad]">
            Uniformes, materiais e eventos. Finalize a compra e a escola entrará em contato para combinar a entrega.
          </p>
        </div>

        {produtos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="grid size-16 place-items-center rounded-full bg-[#0d9488]/15 text-[#0d9488]">
              <Package className="size-7" />
            </div>
            <h2 className="mt-5 font-syne text-2xl font-bold text-white">Nenhum produto disponível</h2>
            <p className="mt-2 max-w-md text-sm text-[#8aa0ad]">Assim que a escola cadastrar produtos, eles aparecerão aqui.</p>
          </div>
        ) : (
          Object.entries(porCategoria).map(([cat, lista]) => (
            <section key={cat} className="mb-12">
              <h2 className="mb-5 font-syne text-2xl font-bold text-white">{categoriaLabel[cat] || cat}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {lista.map((p) => {
                  const noCarrinho = carrinho.find((i) => i.produto_id === p.id)
                  return (
                    <div key={p.id} className="flex flex-col overflow-hidden rounded-xl border border-white/[.08] bg-[#0e151a] transition hover:border-[#0d9488]/50">
                      <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-[#0d9488]/20 to-[#0f766e]/20">
                        <Package className="size-10 text-[#0d9488]" />
                      </div>
                      <div className="flex flex-1 flex-col p-4">
                        <h3 className="line-clamp-2 text-sm font-semibold text-white">{p.nome}</h3>
                        {p.descricao && <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#82939a]">{p.descricao}</p>}
                        <div className="mt-auto pt-3">
                          <p className="font-syne text-lg font-bold text-white">{formatarMoeda(p.preco_centavos)}</p>
                          <p className="mt-0.5 text-xs text-[#82939a]">{p.estoque > 0 ? `${p.estoque} em estoque` : 'Sem estoque'}</p>
                        </div>
                        {noCarrinho ? (
                          <div className="mt-3 flex items-center justify-between rounded-lg border border-[#0d9488] bg-[#0d9488]/10 p-1">
                            <button onClick={() => diminuir(p.id)} className="grid size-7 place-items-center rounded-md text-[#0d9488] hover:bg-[#0d9488]/20">
                              <Minus className="size-3.5" />
                            </button>
                            <span className="text-sm font-semibold text-white">{noCarrinho.quantidade}</span>
                            <button onClick={() => adicionar(p)} disabled={noCarrinho.quantidade >= p.estoque} className="grid size-7 place-items-center rounded-md text-[#0d9488] hover:bg-[#0d9488]/20 disabled:opacity-40">
                              <Plus className="size-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => adicionar(p)}
                            disabled={p.estoque === 0}
                            className="mt-3 w-full rounded-lg bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f766e] disabled:opacity-40"
                          >
                            {p.estoque === 0 ? 'Esgotado' : 'Adicionar ao carrinho'}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          ))
        )}
      </main>

      {carrinhoAberto && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => !enviando && setCarrinhoAberto(false)} />
          <aside className="relative z-10 flex h-full w-full max-w-md flex-col bg-[#0e151a]">
            <header className="flex items-center justify-between border-b border-white/[.08] px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-white">Carrinho</h2>
                <p className="mt-0.5 text-xs text-[#82939a]">{totalItens} {totalItens === 1 ? 'item' : 'itens'}</p>
              </div>
              <button onClick={() => setCarrinhoAberto(false)} disabled={enviando} className="rounded-lg p-2 text-[#82939a] hover:bg-white/5 hover:text-white disabled:opacity-50">
                <X className="size-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {carrinho.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <ShoppingCart className="text-[#5e7a94]" size={32} />
                  <p className="mt-3 text-sm text-[#82939a]">Seu carrinho está vazio.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {carrinho.map((i) => (
                    <div key={i.produto_id} className="flex items-start gap-3 rounded-lg border border-white/[.08] bg-[#0b1115] p-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">{i.produto_nome}</p>
                        <p className="mt-0.5 text-xs text-[#82939a]">{formatarMoeda(i.preco_unitario_centavos)} cada</p>
                        <div className="mt-2 flex items-center gap-2">
                          <button onClick={() => diminuir(i.produto_id)} className="grid size-6 place-items-center rounded border border-white/10 text-[#8aa0ad] hover:border-[#0d9488] hover:text-white">
                            <Minus className="size-3" />
                          </button>
                          <span className="text-sm font-semibold text-white">{i.quantidade}</span>
                          <button onClick={() => {
                            const p = produtos.find((pr) => pr.id === i.produto_id)
                            if (p && i.quantidade < p.estoque) adicionar(p)
                          }} className="grid size-6 place-items-center rounded border border-white/10 text-[#8aa0ad] hover:border-[#0d9488] hover:text-white">
                            <Plus className="size-3" />
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-white">{formatarMoeda(i.quantidade * i.preco_unitario_centavos)}</p>
                        <button onClick={() => remover(i.produto_id)} className="mt-1 rounded p-1 text-[#5e7a94] hover:text-[#dc2626]">
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="mt-5">
                    <label className="mb-1.5 block text-xs font-semibold text-[#8aa0ad]">Observação (opcional)</label>
                    <textarea
                      value={observacao}
                      onChange={(e) => setObservacao(e.target.value)}
                      placeholder="Ex: Tamanho M para o uniforme"
                      rows={3}
                      className="w-full resize-none rounded-lg border border-white/10 bg-[#0b1115] px-3 py-2 text-sm text-white outline-none placeholder:text-[#5e7a94] focus:border-[#0d9488]"
                    />
                  </div>

                  {erro && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">{erro}</p>}
                </div>
              )}
            </div>

            {carrinho.length > 0 && (
              <footer className="border-t border-white/[.08] bg-[#0b1115] px-6 py-4">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm text-[#8aa0ad]">Total</span>
                  <span className="font-syne text-xl font-bold text-white">{formatarMoeda(totalCentavos)}</span>
                </div>
                {!estaLogado && (
                  <p className="mb-3 rounded-lg border border-[#d97706]/30 bg-[#d97706]/10 px-3 py-2 text-xs text-[#fbbf24]">
                    Faça login para finalizar a compra.
                  </p>
                )}
                <button
                  onClick={finalizar}
                  disabled={enviando}
                  className="w-full rounded-lg bg-[#0d9488] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0f766e] disabled:opacity-50"
                >
                  {enviando ? <><Loader2 className="mr-2 inline size-4 animate-spin" />Enviando...</> : estaLogado ? 'Finalizar compra' : 'Entrar e finalizar'}
                </button>
              </footer>
            )}
          </aside>
        </div>
      )}

      {sucesso && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-[#0e151a] p-8 text-center">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-[#0d9488]/15 text-[#0d9488]">
              <CheckCircle2 className="size-8" />
            </div>
            <h2 className="mt-5 font-syne text-2xl font-bold text-white">Pedido enviado!</h2>
            <p className="mt-3 text-sm leading-6 text-[#8aa0ad]">
              Sua compra foi registrada. A escola entrará em contato para combinar pagamento e entrega.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}