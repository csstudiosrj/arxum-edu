'use client'

import { useState, useEffect } from 'react'
import { Plus, Loader2, X, Copy, Check, QrCode, CreditCard, Barcode } from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import { criarFaturamento, type Faturamento } from '../actions'
import { gerarPagamentoArxum } from './actions'
import Script from 'next/script'

declare global {
  interface Window { MercadoPago: any; }
}

export function FinanceiroClient({ faturas, escolas }: { faturas: Faturamento[], escolas: any[] }) {
  const [busca, setBusca] = useState('')
  const [novaAberta, setNovaAberta] = useState(false)
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState('')
  
  // Form nova fatura
  const [escolaId, setEscolaId] = useState('')
  const [descricao, setDescricao] = useState('Mensalidade ARXUM')
  const [valor, setValor] = useState('')
  const [vencimento, setVencimento] = useState('')

  // Checkout
  const [faturaPagando, setFaturaPagando] = useState<Faturamento | null>(null)
  const [metodo, setMetodo] = useState<'pix' | 'credit_card' | 'boleto'>('pix')
  const [resultado, setResultado] = useState<any>(null)
  const [copiou, setCopiou] = useState(false)

  // Cartão (MP SDK)
  const [mpInstance, setMpInstance] = useState<any>(null)
  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [cardExp, setCardExp] = useState('')
  const [cardCvv, setCardCvv] = useState('')

  useEffect(() => {
    if (window.MercadoPago && process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY) {
      const mp = new window.MercadoPago(process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY, { locale: 'pt-BR' })
      setMpInstance(mp)
    }
  }, [])

  async function handleCriarFatura() {
    if (!escolaId || !valor || !vencimento) return setErro('Preencha todos os campos.')
    setProcessando(true)
    setErro('')
    const valorCentavos = Math.round(parseFloat(valor.replace(',', '.')) * 100)
    const r = await criarFaturamento({ escola_id: escolaId, descricao, valor_centavos: valorCentavos, vencimento, periodo_referencia: 'Mensal', observacoes: '' })
    setProcessando(false)
    if (!r.success) return setErro(r.error || 'Erro.')
    setNovaAberta(false)
    window.location.reload()
  }

  async function handleGerarPagamento(fatura: Faturamento) {
    setFaturaPagando(fatura)
    setResultado(null)
    setErro('')
  }

  async function processarPagamento() {
    if (!faturaPagando) return
    setProcessando(true)
    setErro('')
    
    let cardToken = undefined
    if (metodo === 'credit_card') {
      if (!mpInstance) return setErro('SDK do Mercado Pago não carregado.')
      try {
        const tokenRes = await mpInstance.createCardToken({
          cardNumber: cardNumber.replace(/\D/g, ''),
          cardholderName: cardName,
          cardExpirationMonth: cardExp.split('/')[0],
          cardExpirationYear: '20' + cardExp.split('/')[1],
          securityCode: cardCvv,
          identificationType: 'CNPJ',
          identificationNumber: '00000000000000'
        })
        cardToken = tokenRes.id
      } catch (e: any) {
        setProcessando(false)
        return setErro('Erro nos dados do cartão: ' + (e[0]?.message || e.message))
      }
    }

    const r = await gerarPagamentoArxum(faturaPagando.id, metodo, cardToken)
    setProcessando(false)
    
    if (!r.success) return setErro(r.error || 'Erro ao gerar pagamento.')
    setResultado(r.data)
  }

  function copiarPix() {
    if (!resultado?.point_of_interaction?.transaction_data?.qr_code) return
    navigator.clipboard.writeText(resultado.point_of_interaction.transaction_data.qr_code)
    setCopiou(true)
    setTimeout(() => setCopiou(false), 2000)
  }

  return (
    <AdminShell mode="super" active="Financeiro">
      <Script src="https://sdk.mercadopago.com/js/v2" strategy="lazyOnload" />
      
      <main className="px-5 py-8 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading eyebrow="ARXUM Admin" title="Financeiro SaaS" description="Cobranças e recebimentos das escolas." />
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
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase text-[#6b7d86]">Escola</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase text-[#6b7d86]">Valor</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase text-[#6b7d86]">Vencimento</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase text-[#6b7d86]">Status</th>
                  <th className="px-5 py-3 text-right text-[10px] font-bold uppercase text-[#6b7d86]">Ações</th>
                </tr>
              </thead>
              <tbody>
                {faturas.map(f => (
                  <tr key={f.id} className="border-b border-[#f0f4f5]">
                    <td className="px-5 py-3.5 text-sm font-semibold text-[#243942]">{f.escola_nome}</td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-[#243942]">R$ {(f.valor_centavos / 100).toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-sm text-[#82939a]">{new Date(f.vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${f.status === 'pago' ? 'bg-[#d1fae5] text-[#065f46]' : f.status === 'vencido' ? 'bg-[#fee2e2] text-[#991b1b]' : 'bg-[#fef3c7] text-[#92400e]'}`}>
                        {f.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {f.status !== 'pago' && (
                        <button onClick={() => handleGerarPagamento(f)} className="text-xs bg-[#0d9488] text-white px-4 py-1.5 rounded-lg font-semibold hover:bg-[#0f766e]">
                          Cobrar
                        </button>
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
          <div className="bg-white p-6 rounded-xl max-w-lg w-full relative">
            <button onClick={() => { setFaturaPagando(null); setResultado(null); }} className="absolute right-4 top-4 text-gray-500"><X /></button>
            <h3 className="font-bold text-lg mb-1">Cobrança: {faturaPagando.escola_nome}</h3>
            <p className="text-sm text-gray-500 mb-4">Valor: R$ {(faturaPagando.valor_centavos / 100).toFixed(2)}</p>

            {!resultado ? (
              <div className="space-y-4">
                <div className="flex border rounded-lg overflow-hidden">
                  <button onClick={() => setMetodo('pix')} className={`flex-1 py-2 text-sm font-semibold flex items-center justify-center gap-1 ${metodo === 'pix' ? 'bg-[#0d9488] text-white' : 'bg-gray-50 text-gray-600'}`}><QrCode className="size-4"/> PIX</button>
                  <button onClick={() => setMetodo('credit_card')} className={`flex-1 py-2 text-sm font-semibold flex items-center justify-center gap-1 ${metodo === 'credit_card' ? 'bg-[#0d9488] text-white' : 'bg-gray-50 text-gray-600'}`}><CreditCard className="size-4"/> Cartão</button>
                  <button onClick={() => setMetodo('boleto')} className={`flex-1 py-2 text-sm font-semibold flex items-center justify-center gap-1 ${metodo === 'boleto' ? 'bg-[#0d9488] text-white' : 'bg-gray-50 text-gray-600'}`}><Barcode className="size-4"/> Boleto</button>
                </div>

                {metodo === 'credit_card' && (
                  <div className="space-y-2">
                    <input type="text" placeholder="Número do Cartão" value={cardNumber} onChange={e => setCardNumber(e.target.value)} className="w-full border p-2 rounded" />
                    <input type="text" placeholder="Nome impresso no cartão" value={cardName} onChange={e => setCardName(e.target.value)} className="w-full border p-2 rounded" />
                    <div className="flex gap-2">
                      <input type="text" placeholder="MM/AA" value={cardExp} onChange={e => setCardExp(e.target.value)} className="w-full border p-2 rounded" />
                      <input type="text" placeholder="CVV" value={cardCvv} onChange={e => setCardCvv(e.target.value)} className="w-full border p-2 rounded" />
                    </div>
                  </div>
                )}

                {erro && <p className="text-red-500 text-sm">{erro}</p>}

                <button onClick={processarPagamento} disabled={processando} className="w-full bg-[#0d9488] text-white py-3 rounded-lg font-bold flex justify-center">
                  {processando ? <Loader2 className="animate-spin" /> : metodo === 'pix' ? 'Gerar PIX' : metodo === 'boleto' ? 'Gerar Boleto' : 'Pagar com Cartão'}
                </button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                {resultado.status === 'approved' && <div className="bg-green-100 text-green-700 p-3 rounded-lg font-bold">Pagamento Aprovado!</div>}
                
                {metodo === 'pix' && resultado.point_of_interaction?.transaction_data?.qr_code_base64 && (
                  <>
                    <img src={`data:image/jpeg;base64,${resultado.point_of_interaction.transaction_data.qr_code_base64}`} className="mx-auto size-48 border rounded-lg" />
                    <div className="flex gap-2">
                      <input readOnly value={resultado.point_of_interaction.transaction_data.qr_code} className="flex-1 border p-2 text-xs truncate bg-gray-50 rounded" />
                      <button onClick={copiarPix} className="bg-gray-100 p-2 rounded hover:bg-gray-200">{copiou ? <Check /> : <Copy />}</button>
                    </div>
                  </>
                )}

                {metodo === 'boleto' && resultado.transaction_details?.external_resource_url && (
                  <a href={resultado.transaction_details.external_resource_url} target="_blank" rel="noreferrer" className="block w-full bg-gray-800 text-white py-2 rounded text-center font-bold">
                    Abrir Boleto
                  </a>
                )}
                
                <button onClick={() => { setFaturaPagando(null); setResultado(null); window.location.reload(); }} className="w-full border py-2 rounded font-bold">Fechar</button>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminShell>
  )
}
