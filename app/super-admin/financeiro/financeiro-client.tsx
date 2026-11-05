'use client'

import { useState } from 'react'
import { Plus, Loader2, X, Copy, Check, Link as LinkIcon, RefreshCw, DollarSign, WalletCards, AlertCircle, TrendingUp, Building2, ArrowRight } from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import { type MetricasFinanceiras, type EscolaFinanceiro } from '../actions'
import { gerarCobrancaCheckout, sincronizarPagamentoManual } from './actions'

export function FinanceiroClient({ metricas, escolas }: { metricas: MetricasFinanceiras, escolas: EscolaFinanceiro[] }) {
  const [novaAberta, setNovaAberta] = useState(false)
  const [escolaDetalhe, setEscolaDetalhe] = useState<EscolaFinanceiro | null>(null)
  const [processando, setProcessando] = useState(false)
  const [sincronizando, setSincronizando] = useState<string | null>(null)
  const [erro, setErro] = useState('')
  const [linkGerado, setLinkGerado] = useState<string | null>(null)
  const [copiou, setCopiou] = useState(false)
  
  // Form nova fatura
  const [escolaId, setEscolaId] = useState('')
  const [descricao, setDescricao] = useState('Assinatura ARXUM')
  const [valor, setValor] = useState('')
  const [referencia, setReferencia] = useState(new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }))

  const formatarDinheiro = (centavos: number) => (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  async function handleGerarCobranca() {
    if (!escolaId || !valor) return setErro('Preencha a escola e o valor.')
    setProcessando(true)
    setErro('')
    
    const valorCentavos = Math.round(parseFloat(valor.replace(',', '.')) * 100)
    const r = await gerarCobrancaCheckout(escolaId, valorCentavos, descricao, referencia)
    
    setProcessando(false)
    if (!r.success) return setErro(r.error || 'Erro.')
    
    setLinkGerado(r.link || null)
    navigator.clipboard.writeText(r.link || '')
    setCopiou(true)
    setTimeout(() => setCopiou(false), 3000)
  }

  function abrirNovaCobranca(escola?: EscolaFinanceiro) {
    if (escola) {
      setEscolaId(escola.id)
      const valorPlano = escola.plano === 'raiz' ? '399,00' : escola.plano === 'copa' ? '699,00' : '199,00'
      setValor(valorPlano)
    } else {
      setEscolaId('')
      setValor('')
    }
    setLinkGerado(null)
    setErro('')
    setNovaAberta(true)
  }

  return (
    <AdminShell mode="super" active="Financeiro">
      <main className="px-5 py-8 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading eyebrow="ARXUM Admin" title="Inteligência Financeira" description="Gestão de LTV, inadimplência e saúde das escolas." />
          <button onClick={() => abrirNovaCobranca()} className="bg-[#0d9488] text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-[#0f766e]">
            <Plus className="size-4" /> Nova cobrança avulsa
          </button>
        </div>

        {/* DASHBOARD */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Panel className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="grid size-8 place-items-center rounded-lg bg-[#d1fae5] text-[#065f46]"><TrendingUp className="size-4" /></div>
              <p className="text-xs font-semibold uppercase text-[#6b7d86]">MRR (Mensal)</p>
            </div>
            <p className="text-2xl font-bold text-[#065f46]">{formatarDinheiro(metricas.mrrCentavos)}</p>
            <p className="mt-1 text-xs text-[#82939a]">ARR: {formatarDinheiro(metricas.arrCentavos)}</p>
          </Panel>
          <Panel className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="grid size-8 place-items-center rounded-lg bg-[#dbeafe] text-[#1e40af]"><DollarSign className="size-4" /></div>
              <p className="text-xs font-semibold uppercase text-[#6b7d86]">Total Recebido</p>
            </div>
            <p className="text-2xl font-bold text-[#1e40af]">{formatarDinheiro(metricas.totalRecebido)}</p>
          </Panel>
          <Panel className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="grid size-8 place-items-center rounded-lg bg-[#fef3c7] text-[#92400e]"><WalletCards className="size-4" /></div>
              <p className="text-xs font-semibold uppercase text-[#6b7d86]">Em Aberto</p>
            </div>
            <p className="text-2xl font-bold text-[#92400e]">{formatarDinheiro(metricas.totalEmAberto)}</p>
          </Panel>
          <Panel className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="grid size-8 place-items-center rounded-lg bg-[#fee2e2] text-[#991b1b]"><AlertCircle className="size-4" /></div>
              <p className="text-xs font-semibold uppercase text-[#6b7d86]">Vencido</p>
            </div>
            <p className="text-2xl font-bold text-[#991b1b]">{formatarDinheiro(metricas.totalVencido)}</p>
          </Panel>
        </div>

        {/* LISTA DE ESCOLAS */}
        <Panel className="mt-8">
          <div className="border-b border-[#e5ecee] px-5 py-4 flex justify-between items-center">
             <h2 className="text-base font-bold text-[#12232b]">Saúde Financeira das Escolas</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e5ecee] bg-[#fafcfc]">
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase text-[#6b7d86]">Escola</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase text-[#6b7d86]">Plano</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase text-[#6b7d86]">LTV (Gerado)</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase text-[#6b7d86]">Atraso Médio</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase text-[#6b7d86]">Health Score</th>
                  <th className="px-5 py-3 text-right text-[10px] font-bold uppercase text-[#6b7d86]">Ações</th>
                </tr>
              </thead>
              <tbody>
                {escolas.map(e => (
                  <tr key={e.id} className="border-b border-[#f0f4f5]">
                    <td className="px-5 py-3.5 text-sm font-semibold text-[#243942]">{e.nome}</td>
                    <td className="px-5 py-3.5 text-sm capitalize text-[#4d626c]">{e.plano}</td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-[#0d9488]">{formatarDinheiro(e.ltvCentavos)}</td>
                    <td className="px-5 py-3.5 text-sm text-[#82939a]">{e.media_dias_atraso} dias</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${e.health_score === 'bom' ? 'bg-[#d1fae5] text-[#065f46]' : e.health_score === 'atencao' ? 'bg-[#fef3c7] text-[#92400e]' : 'bg-[#fee2e2] text-[#991b1b]'}`}>
                        {e.health_score === 'bom' ? 'Em dia' : e.health_score === 'atencao' ? 'Atenção' : 'Risco'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right flex justify-end gap-2">
                      <button onClick={() => abrirNovaCobranca(e)} className="text-xs bg-[#0d9488] text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-[#0f766e]">
                        Cobrar
                      </button>
                      <button onClick={() => setEscolaDetalhe(e)} className="text-xs border border-[#b8c9ce] text-[#30454e] px-3 py-1.5 rounded-lg font-semibold hover:border-[#0d9488] flex items-center gap-1">
                        Extrato <ArrowRight className="size-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </main>

      {/* MODAL NOVA COBRANÇA (Checkout Pro) */}
      {novaAberta && !linkGerado && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <aside className="bg-white w-full max-w-md h-full p-6 relative shadow-2xl">
            <button onClick={() => setNovaAberta(false)} className="absolute right-4 top-4 text-gray-500 hover:text-gray-800"><X /></button>
            <h2 className="text-xl font-bold mb-1">Gerar Link de Pagamento</h2>
            <p className="text-sm text-gray-500 mb-6">O cliente poderá pagar via PIX, Boleto ou Cartão (até 12x).</p>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold mb-1 block">Escola</label>
                <select value={escolaId} onChange={e => setEscolaId(e.target.value)} className="w-full border p-2 rounded outline-none focus:border-[#0d9488]">
                  <option value="">Selecione a escola...</option>
                  {escolas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold mb-1 block">Descrição da Cobrança</label>
                <input type="text" value={descricao} onChange={e => setDescricao(e.target.value)} className="w-full border p-2 rounded outline-none focus:border-[#0d9488]" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold mb-1 block">Valor (R$)</label>
                  <input type="text" value={valor} onChange={e => setValor(e.target.value)} placeholder="Ex: 399,00" className="w-full border p-2 rounded outline-none focus:border-[#0d9488]" />
                </div>
                <div>
                  <label className="text-xs font-bold mb-1 block">Referência</label>
                  <input type="text" value={referencia} onChange={e => setReferencia(e.target.value)} className="w-full border p-2 rounded outline-none focus:border-[#0d9488]" />
                </div>
              </div>

              {erro && <p className="text-red-500 text-sm">{erro}</p>}
              
              <button onClick={handleGerarCobranca} disabled={processando} className="w-full bg-[#0d9488] text-white py-3 rounded-lg font-bold flex justify-center hover:bg-[#0f766e] mt-4">
                {processando ? <Loader2 className="animate-spin" /> : 'Gerar Link no Mercado Pago'}
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* MODAL LINK GERADO */}
      {linkGerado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white p-6 rounded-xl max-w-md w-full relative text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-green-100 text-green-600 mb-4">
              <Check className="size-6" />
            </div>
            <h3 className="font-bold text-lg mb-2">Link de Pagamento Pronto!</h3>
            <p className="text-sm text-gray-500 mb-4">Copie o link e envie para a escola. Ele abrange PIX, Boleto e Cartão.</p>
            <div className="flex gap-2">
              <input readOnly value={linkGerado} className="flex-1 border p-2 text-xs truncate bg-gray-50 rounded text-gray-500" />
              <button onClick={() => navigator.clipboard.writeText(linkGerado)} className="bg-[#0d9488] text-white px-3 py-2 rounded hover:bg-[#0f766e] font-bold text-sm">Copiar</button>
            </div>
            <button onClick={() => { setLinkGerado(null); setNovaAberta(false); window.location.reload(); }} className="mt-6 w-full border py-2 rounded font-bold text-gray-700 hover:bg-gray-50">Fechar</button>
          </div>
        </div>
      )}

      {/* DRAWER EXTRATO DA ESCOLA */}
      {escolaDetalhe && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <aside className="bg-white w-full max-w-2xl h-full p-6 relative shadow-2xl flex flex-col">
            <button onClick={() => setEscolaDetalhe(null)} className="absolute right-4 top-4 text-gray-500 hover:text-gray-800"><X /></button>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-[#12232b]">{escolaDetalhe.nome}</h2>
              <p className="text-sm text-gray-500">Extrato e inteligência financeira</p>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <div className="bg-gray-50 p-4 rounded-lg mb-6 flex gap-6">
                <div><p className="text-xs text-gray-500 uppercase font-bold">Total Pago</p><p className="text-xl font-bold text-green-600">{formatarDinheiro(escolaDetalhe.ltvCentavos)}</p></div>
                <div><p className="text-xs text-gray-500 uppercase font-bold">Faturas em Atraso</p><p className="text-xl font-bold text-red-600">{escolaDetalhe.faturas_vencidas}</p></div>
                <div><p className="text-xs text-gray-500 uppercase font-bold">Média Atraso</p><p className="text-xl font-bold text-yellow-600">{escolaDetalhe.media_dias_atraso} dias</p></div>
              </div>
              
              {/* Aqui entraria a lista de faturas da escola via getFaturasPorEscola */}
              <p className="text-sm text-gray-500 text-center py-8">O histórico detalhado de faturas ficará aqui.</p>
            </div>
          </aside>
        </div>
      )}
    </AdminShell>
  )
}
