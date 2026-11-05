'use client'

import { useState } from 'react'
import { Plus, Search, CheckCircle2, Clock, AlertCircle, Loader2, X, Copy, Check, QrCode } from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import { criarFaturamento, excluirFaturamento, atualizarStatusFaturamento, type Faturamento } from '../actions'
import { gerarPagamentoArxum } from './actions'

export function FinanceiroClient({ faturas, escolas }: { faturas: Faturamento[], escolas: any[] }) {
  const [busca, setBusca] = useState('')
  const [novaAberta, setNovaAberta] = useState(false)
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState('')
  
  // Form states
  const [escolaId, setEscolaId] = useState('')
  const [descricao, setDescricao] = useState('Mensalidade ARXUM')
  const [valor, setValor] = useState('')
  const [vencimento, setVencimento] = useState('')

  // Checkout states
  const [faturaPagando, setFaturaPagando] = useState<Faturamento | null>(null)
  const [pixData, setPixData] = useState<any>(null)
  const [copiou, setCopiou] = useState(false)

  async function handleCriarFatura() {
    if (!escolaId || !valor || !vencimento) return setErro('Preencha todos os campos.')
    setProcessando(true)
    setErro('')
    
    const valorCentavos = Math.round(parseFloat(valor.replace(',', '.')) * 100)
    
    const r = await criarFaturamento({
      escola_id: escolaId,
      descricao,
      valor_centavos: valorCentavos,
      vencimento,
      periodo_referencia: 'Mensal',
      observacoes: ''
    })

    setProcessando(false)
    if (!r.success) return setErro(r.error || 'Erro.')
    
    setNovaAberta(false)
    setValor('')
    window.location.reload()
  }

  async function gerarCobranca(fatura: Faturamento, metodo: 'pix' | 'boleto') {
    setProcessando(true)
    setFaturaPagando(fatura)
    setPixData(null)
    
    const r = await gerarPagamentoArxum(fatura.id, metodo)
    setProcessando(false)

    if (!r.success) {
      alert(r.error || 'Erro ao gerar pagamento.')
      setFaturaPagando(null)
      return
    }

    setPixData(r.data)
  }

  function copiarPix() {
    if (!pixData?.point_of_interaction?.transaction_data?.qr_code) return
    navigator.clipboard.writeText(pixData.point_of_interaction.transaction_data.qr_code)
    setCopiou(true)
    setTimeout(() => setCopiou(false), 2000)
  }

  return (
    <AdminShell mode="super" active="Financeiro">
      <main className="px-5 py-8 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading eyebrow="ARXUM Admin" title="Financeiro SaaS" description="Gestão de cobranças e recebimentos das escolas." />
          <button onClick={() => { setNovaAberta(true); setErro('') }} className="bg-[#0d9488] text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2">
            <Plus className="size-4" /> Nova cobrança
          </button>
        </div>

        <Panel className="mt-8">
          <div className="border-b border-[#e5ecee] px-5 py-4">
             <h2 className="text-base font-bold text-[#12232b]">Faturas emitidas</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e5ecee] bg-[#fafcfc]">
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Escola</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Descrição</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Valor</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Vencimento</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Status</th>
                  <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Ações</th>
                </tr>
              </thead>
              <tbody>
                {faturas.map(f => (
                  <tr key={f.id} className="border-b border-[#f0f4f5]">
                    <td className="px-5 py-3.5 text-sm font-semibold text-[#243942]">{f.escola_nome}</td>
                    <td className="px-5 py-3.5 text-sm text-[#4d626c]">{f.descricao}</td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-[#243942]">R$ {(f.valor_centavos / 100).toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-sm text-[#82939a]">{new Date(f.vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${f.status === 'pago' ? 'bg-[#d1fae5] text-[#065f46]' : f.status === 'vencido' ? 'bg-[#fee2e2] text-[#991b1b]' : 'bg-[#fef3c7] text-[#92400e]'}`}>
                        {f.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {f.status !== 'pago' && (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => gerarCobranca(f, 'pix')} className="text-xs bg-[#0d9488] text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-[#0f766e]">
                            Gerar PIX
                          </button>
                          <button onClick={() => gerarCobranca(f, 'boleto')} className="text-xs border border-[#b8c9ce] px-3 py-1.5 rounded-lg font-semibold hover:border-[#0d9488]">
                            Boleto
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </main>

      {/* Modal Nova Fatura */}
      {novaAberta && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <aside className="bg-white w-full max-w-md h-full p-6 relative shadow-2xl">
            <button onClick={() => setNovaAberta(false)} className="absolute right-4 top-4 text-gray-500"><X /></button>
            <h2 className="text-xl font-bold mb-6">Nova cobrança</h2>
            <div className="space-y-4">
              <select value={escolaId} onChange={e => setEscolaId(e.target.value)} className="w-full border p-2 rounded">
                <option value="">Selecione a escola</option>
                {escolas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
              </select>
              <input type="text" placeholder="Valor (Ex: 399,00)" value={valor} onChange={e => setValor(e.target.value)} className="w-full border p-2 rounded" />
              <input type="date" value={vencimento} onChange={e => setVencimento(e.target.value)} className="w-full border p-2 rounded" />
              {erro && <p className="text-red-500 text-sm">{erro}</p>}
              <button onClick={handleCriarFatura} disabled={processando} className="w-full bg-[#0d9488] text-white py-2 rounded font-bold flex justify-center">
                {processando ? <Loader2 className="animate-spin" /> : 'Salvar Fatura'}
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Modal de Pagamento */}
      {faturaPagando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white p-6 rounded-xl max-w-sm w-full relative">
            <button onClick={() => { setFaturaPagando(null); setPixData(null); }} className="absolute right-4 top-4 text-gray-500"><X /></button>
            <h3 className="text-center font-bold text-lg mb-4">Pagamento</h3>
            {processando ? (
               <div className="flex justify-center py-8"><Loader2 className="animate-spin text-[#0d9488]" /></div>
            ) : pixData ? (
              <div className="text-center space-y-4">
                {pixData.point_of_interaction?.transaction_data?.qr_code_base64 ? (
                  <img src={`data:image/jpeg;base64,${pixData.point_of_interaction.transaction_data.qr_code_base64}`} className="mx-auto size-48 border rounded-lg" />
                ) : (
                  <div className="mx-auto size-48 border rounded-lg flex items-center justify-center bg-gray-50"><QrCode className="text-gray-300 size-10"/></div>
                )}
                <div className="flex gap-2">
                  <input readOnly value={pixData.point_of_interaction?.transaction_data?.qr_code || pixData.transaction_details?.external_resource_url || ''} className="flex-1 border p-2 text-xs truncate bg-gray-50 rounded" />
                  <button onClick={copiarPix} className="bg-gray-100 p-2 rounded hover:bg-gray-200">{copiou ? <Check /> : <Copy />}</button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </AdminShell>
  )
}
