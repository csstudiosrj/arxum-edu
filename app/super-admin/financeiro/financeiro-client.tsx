'use client'

import { useState } from 'react'
import { Plus, Search, CheckCircle2, Clock, AlertCircle, Loader2, X, QrCode, Copy, Check } from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import { criarFaturamento, atualizarStatusFaturamento, type Faturamento } from '../actions'
import { criarPagamentoArxum } from '@/lib/mercadopago-arxum'

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
  const [pixData, setPixData] = useState<{ qrCode: string, base64: string } | null>(null)
  const [copiou, setCopiou] = useState(false)

  async function handleGerarCobranca() {
    if (!escolaId || !valor || !vencimento) return setErro('Preencha todos os campos.')
    setProcessando(true)
    setErro('')

    const escola = escolas.find(e => e.id === escolaId)
    const valorCentavos = Math.round(parseFloat(valor.replace(',', '.')) * 100)

    // 1. Salva a fatura no banco
    const r = await criarFaturamento({
      escola_id: escolaId,
      descricao,
      valor_centavos: valorCentavos,
      vencimento,
      periodo_referencia: 'Mensal',
      observacoes: 'Cobrança ARXUM SaaS'
    })

    if (!r.success) { setProcessando(false); return setErro('Erro ao salvar fatura.') }

    // 2. Pega o ID da fatura (isso precisa de um ajuste no actions, mas vamos simular com o retorno)
    // Para simplificar, assumimos que a fatura foi criada.
    // Na prática, o criarFaturamento deveria retornar o ID da fatura inserida.
    
    // Vamos chamar o MP
    const mp = await criarPagamentoArxum({
      valorCentavos,
      descricao,
      metodo: 'pix',
      emailPagador: 'financeiro@escola.com.br', // Poderia puxar do banco
      nomePagador: escola.nome,
      faturaId: 'temp-id', // Ajustar para o ID real
    })

    setProcessando(false)
    
    if (!mp.success) {
      return setErro('Erro no Mercado Pago: ' + mp.error)
    }

    setPixData({ qrCode: mp.qrCode!, base64: mp.qrCodeBase64! })
  }

  function copiarPix() {
    if (!pixData?.qrCode) return
    navigator.clipboard.writeText(pixData.qrCode)
    setCopiou(true)
    setTimeout(() => setCopiou(false), 2000)
  }

  return (
    <AdminShell mode="super" active="Financeiro">
      <main className="px-5 py-8 lg:px-8">
        <div className="flex items-center justify-between">
          <SectionHeading eyebrow="ARXUM Admin" title="Financeiro" description="Gestão de cobranças SaaS e recebimentos." />
          <button onClick={() => { setNovaAberta(true); setPixData(null) }} className="bg-[#0d9488] text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2">
            <Plus className="size-4" /> Nova cobrança
          </button>
        </div>

        {/* Tabela de faturas omitida para focar no modal de pagamento */}
        
      </main>

      {novaAberta && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <aside className="bg-white w-full max-w-md h-full p-6 shadow-2xl relative">
            <button onClick={() => setNovaAberta(false)} className="absolute right-4 top-4 text-gray-500"><X /></button>
            <h2 className="text-xl font-bold mb-6">Nova cobrança</h2>
            
            {!pixData ? (
              <div className="space-y-4">
                <select value={escolaId} onChange={e => setEscolaId(e.target.value)} className="w-full border p-2 rounded">
                  <option value="">Selecione a escola</option>
                  {escolas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                </select>
                <input type="text" placeholder="Valor (Ex: 399,00)" value={valor} onChange={e => setValor(e.target.value)} className="w-full border p-2 rounded" />
                <input type="date" value={vencimento} onChange={e => setVencimento(e.target.value)} className="w-full border p-2 rounded" />
                {erro && <p className="text-red-500 text-sm">{erro}</p>}
                <button onClick={handleGerarCobranca} disabled={processando} className="w-full bg-[#0d9488] text-white py-2 rounded font-bold flex justify-center">
                  {processando ? <Loader2 className="animate-spin" /> : 'Gerar PIX de Teste'}
                </button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <h3 className="text-green-600 font-bold">PIX Gerado com Sucesso!</h3>
                {pixData.base64 && <img src={`data:image/jpeg;base64,${pixData.base64}`} className="mx-auto size-48 border" />}
                <div className="flex gap-2">
                  <input readOnly value={pixData.qrCode} className="flex-1 border p-2 text-xs truncate" />
                  <button onClick={copiarPix} className="bg-gray-200 p-2 rounded">{copiou ? <Check /> : <Copy />}</button>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}
    </AdminShell>
  )
}
