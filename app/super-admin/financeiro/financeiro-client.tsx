'use client'

import { useState, useEffect } from 'react'
import { 
  TrendingUp, DollarSign, WalletCards, AlertCircle, ArrowRight, 
  RefreshCw, Loader2, CheckCircle2, ShieldCheck, X, Link as LinkIcon, 
  CalendarClock, FileText
} from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import { type MetricasFinanceiras, type EscolaFinanceiro } from '../actions'
import { 
  getResumoTaxasPendentes, gerarFaturaTaxas, type ResumoTaxaEscola,
  getFaturasPorEscola, getInfoAssinaturaEscola, 
  gerarAssinaturaRecorrente, cancelarAssinaturaRecorrente,
  sincronizarPagamentoManual, gerarCobrancaCheckout, getDadosCobrancaEscola
} from './actions'

export function FinanceiroClient({ metricas, escolas }: { metricas: MetricasFinanceiras, escolas: EscolaFinanceiro[] }) {
  const [abaAtiva, setAbaAtiva] = useState<'dashboard' | 'taxas'>('dashboard')
  const [filtroHealth, setFiltroHealth] = useState<'todas' | 'bom' | 'atencao' | 'risco'>('todas')
  
  // Drawer da Escola
  const [escolaDetalhe, setEscolaDetalhe] = useState<EscolaFinanceiro | null>(null)
  const [faturas, setFaturas] = useState<any[]>([])
  const [carregandoExtrato, setCarregandoExtrato] = useState(false)
  const [assinaturaInfo, setAssinaturaInfo] = useState<{mercadopago_preapproval_id: string | null, status_assinatura: string} | null>(null)
  const [processandoAssinatura, setProcessandoAssinatura] = useState(false)
  const [linkAssinatura, setLinkAssinatura] = useState<string | null>(null)
  const [erroDrawer, setErroDrawer] = useState('')

  // Taxas Pendentes
  const [resumoTaxas, setResumoTaxas] = useState<ResumoTaxaEscola[]>([])
  const [carregandoTaxas, setCarregandoTaxas] = useState(false)
  const [gerandoFaturaId, setGerandoFaturaId] = useState<string | null>(null)

  // Cobrança Manual (Backup)
  const [modalCobrancaAberto, setModalCobrancaAberto] = useState(false)
  const [escolaIdCobranca, setEscolaIdCobranca] = useState('')
  const [descricaoCobranca, setDescricaoCobranca] = useState('Cobrança Avulsa ARXUM')
  const [valorBaseCobranca, setValorBaseCobranca] = useState(0)
  const [linkGerado, setLinkGerado] = useState<string | null>(null)
  const [processandoCobranca, setProcessandoCobranca] = useState(false)

  const formatarDinheiro = (centavos: number) => (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  useEffect(() => {
    if (abaAtiva === 'taxas' && resumoTaxas.length === 0) {
      carregarTaxas()
    }
  }, [abaAtiva])

  useEffect(() => {
    if (escolaDetalhe) {
      setCarregandoExtrato(true)
      setErroDrawer('')
      Promise.all([
        getFaturasPorEscola(escolaDetalhe.id),
        getInfoAssinaturaEscola(escolaDetalhe.id)
      ]).then(([faturasData, assinaturaData]) => {
        setFaturas(faturasData)
        setAssinaturaInfo(assinaturaData)
        setCarregandoExtrato(false)
      })
    }
  }, [escolaDetalhe])

  async function carregarTaxas() {
    setCarregandoTaxas(true)
    const dados = await getResumoTaxasPendentes()
    setResumoTaxas(dados)
    setCarregandoTaxas(false)
  }

  async function handleGerarFaturaTaxas(escolaId: string) {
    if (!confirm('Deseja agrupar todas as taxas pendentes e gerar uma fatura para esta escola?')) return
    setGerandoFaturaId(escolaId)
    const r = await gerarFaturaTaxas(escolaId)
    setGerandoFaturaId(null)
    if (r.success) {
      alert('Fatura gerada com sucesso!')
      carregarTaxas()
      window.location.reload()
    } else {
      alert(r.error)
    }
  }

  async function handleGerarAssinatura() {
    if (!escolaDetalhe) return
    setProcessandoAssinatura(true)
    setErroDrawer('')
    const r = await gerarAssinaturaRecorrente(escolaDetalhe.id)
    setProcessandoAssinatura(false)
    
    if (r.success && r.link) {
      setLinkAssinatura(r.link)
      const info = await getInfoAssinaturaEscola(escolaDetalhe.id)
      setAssinaturaInfo(info)
    } else {
      setErroDrawer(r.error || 'Erro ao gerar assinatura.')
    }
  }

  async function handleCancelarAssinatura() {
    if (!escolaDetalhe || !assinaturaInfo?.mercadopago_preapproval_id) return
    if (!confirm('Tem certeza que deseja cancelar a assinatura recorrente desta escola?')) return
    
    setProcessandoAssinatura(true)
    setErroDrawer('')
    const r = await cancelarAssinaturaRecorrente(escolaDetalhe.id, assinaturaInfo.mercadopago_preapproval_id)
    setProcessandoAssinatura(false)
    
    if (r.success) {
      const info = await getInfoAssinaturaEscola(escolaDetalhe.id)
      setAssinaturaInfo(info)
    } else {
      setErroDrawer(r.error || 'Erro ao cancelar assinatura.')
    }
  }

  async function handleSincronizar(faturaId: string) {
    if (!confirm('Sincronizar pagamento manualmente?')) return
    const r = await sincronizarPagamentoManual(faturaId)
    if (r.success) window.location.reload()
    else alert(r.error)
  }

  async function handleCobrancaManual() {
    if (!escolaIdCobranca) return alert('Selecione a escola.')
    setProcessandoCobranca(true)
    
    // Se não tiver valor base, busca automático (fallback)
    let valorFinal = valorBaseCobranca
    if (valorFinal === 0) {
      const rDados = await getDadosCobrancaEscola(escolaIdCobranca)
      if (rDados.success) valorFinal = rDados.valorBaseCentavos || 0
    }

    if (valorFinal === 0) {
      setProcessandoCobranca(false)
      return alert('Não foi possível calcular o valor base. Informe o valor manualmente.')
    }

    const r = await gerarCobrancaCheckout(escolaIdCobranca, 0, [], descricaoCobranca, new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }))
    setProcessandoCobranca(false)

    if (r.success && r.link) {
      setLinkGerado(r.link)
      navigator.clipboard.writeText(r.link)
    } else {
      alert(r.error || 'Erro ao gerar cobrança.')
    }
  }

  const escolasFiltradas = escolas.filter(e => filtroHealth === 'todas' || e.health_score === filtroHealth)

  return (
    <AdminShell mode="super" active="Financeiro">
      <main className="px-5 py-8 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading eyebrow="ARXUM Admin" title="Inteligência Financeira" description="Acompanhe o MRR, a saúde das escolas e as taxas de intermediação." />
          <button onClick={() => setModalCobrancaAberto(true)} className="text-xs font-semibold text-[#82939a] hover:text-[#12232b] underline underline-offset-4">
            Cobrança Avulsa (Backup)
          </button>
        </div>

        <div className="mt-8 flex gap-1 border-b border-[#e5ecee]">
          <button onClick={() => setAbaAtiva('dashboard')} className={`px-4 py-3 text-sm font-semibold border-b-2 transition ${abaAtiva === 'dashboard' ? 'border-[#0d9488] text-[#0d9488]' : 'border-transparent text-[#6b7d86] hover:text-[#12232b]'}`}>Visão Geral</button>
          <button onClick={() => setAbaAtiva('taxas')} className={`px-4 py-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${abaAtiva === 'taxas' ? 'border-[#0d9488] text-[#0d9488]' : 'border-transparent text-[#6b7d86] hover:text-[#12232b]'}`}>
            <FileText className="size-4" /> Taxas e Repasses (Lojas)
          </button>
        </div>

        {abaAtiva === 'dashboard' && (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Panel 
                onClick={() => setFiltroHealth('todas')}
                className={`p-5 cursor-pointer transition ${filtroHealth === 'todas' ? 'ring-2 ring-[#0d9488] border-transparent' : ''}`}
              >
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
                  <p className="text-xs font-semibold uppercase text-[#6b7d86]">Faturas em Aberto</p>
                </div>
                <p className="text-2xl font-bold text-[#92400e]">{formatarDinheiro(metricas.totalEmAberto)}</p>
              </Panel>
              
              <Panel 
                onClick={() => setFiltroHealth('risco')}
                className={`p-5 cursor-pointer transition hover:border-[#991b1b] ${filtroHealth === 'risco' ? 'ring-2 ring-[#991b1b] border-transparent' : ''}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="grid size-8 place-items-center rounded-lg bg-[#fee2e2] text-[#991b1b]"><AlertCircle className="size-4" /></div>
                  <p className="text-xs font-semibold uppercase text-[#6b7d86]">Escolas em Risco</p>
                </div>
                <p className="text-2xl font-bold text-[#991b1b]">{escolas.filter(e => e.health_score === 'risco').length}</p>
              </Panel>
            </div>

            <Panel className="mt-8">
              <div className="border-b border-[#e5ecee] px-5 py-4 flex justify-between items-center">
                 <h2 className="text-base font-bold text-[#12232b]">Saúde Financeira das Escolas</h2>
                 {filtroHealth !== 'todas' && (
                   <button onClick={() => setFiltroHealth('todas')} className="text-xs text-[#0d9488] hover:underline font-semibold flex items-center gap-1"><X size={12}/> Limpar filtro</button>
                 )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#e5ecee] bg-[#fafcfc]">
                      <th className="px-5 py-3 text-left text-[10px] font-bold uppercase text-[#6b7d86]">Escola</th>
                      <th className="px-5 py-3 text-left text-[10px] font-bold uppercase text-[#6b7d86]">Assinatura</th>
                      <th className="px-5 py-3 text-left text-[10px] font-bold uppercase text-[#6b7d86]">LTV (Gerado)</th>
                      <th className="px-5 py-3 text-left text-[10px] font-bold uppercase text-[#6b7d86]">Atraso Médio</th>
                      <th className="px-5 py-3 text-left text-[10px] font-bold uppercase text-[#6b7d86]">Health Score</th>
                      <th className="px-5 py-3 text-right text-[10px] font-bold uppercase text-[#6b7d86]">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {escolasFiltradas.map(e => (
                      <tr key={e.id} className="border-b border-[#f0f4f5] hover:bg-[#fafcfc] transition">
                        <td className="px-5 py-3.5 text-sm font-semibold text-[#243942]">{e.nome}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${e.status_assinatura === 'ativa' ? 'bg-[#d1fae5] text-[#065f46]' : e.status_assinatura === 'trial' ? 'bg-[#dbeafe] text-[#1e40af]' : 'bg-[#fee2e2] text-[#991b1b]'}`}>
                            {e.status_assinatura === 'ativa' ? <CheckCircle2 size={12}/> : e.status_assinatura === 'trial' ? <CalendarClock size={12}/> : <AlertCircle size={12}/>}
                            {e.status_assinatura.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-sm font-semibold text-[#0d9488]">{formatarDinheiro(e.ltvCentavos)}</td>
                        <td className="px-5 py-3.5 text-sm text-[#82939a]">{e.media_dias_atraso} dias</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${e.health_score === 'bom' ? 'bg-[#d1fae5] text-[#065f46]' : e.health_score === 'atencao' ? 'bg-[#fef3c7] text-[#92400e]' : 'bg-[#fee2e2] text-[#991b1b]'}`}>
                            {e.health_score === 'bom' ? 'Em dia' : e.health_score === 'atencao' ? 'Atenção' : 'Risco'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right flex justify-end gap-2">
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
          </>
        )}

        {abaAtiva === 'taxas' && (
          <Panel className="mt-6">
            <div className="border-b border-[#e5ecee] px-5 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-[#12232b]">Taxas Pendentes de Faturamento</h2>
                <p className="text-xs text-[#82939a] mt-0.5">Valores acumulados da Loja e Add-ons por escola.</p>
              </div>
              <button onClick={carregarTaxas} disabled={carregandoTaxas} className="p-2 border border-[#d5e0e3] rounded-lg text-gray-500 hover:text-[#0d9488] hover:border-[#0d9488]">
                <RefreshCw className={`size-4 ${carregandoTaxas ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {carregandoTaxas ? (
              <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin text-[#0d9488]" /></div>
            ) : resumoTaxas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="grid size-14 place-items-center rounded-full bg-[#ccfbf1] text-[#0d9488] mb-3"><FileText className="size-6" /></div>
                <h3 className="text-base font-bold text-[#12232b]">Nenhuma taxa pendente</h3>
                <p className="mt-1 text-sm text-[#82939a]">As taxas de loja e add-ons aparecerão aqui quando forem geradas.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#e5ecee] bg-[#fafcfc]">
                      <th className="px-5 py-3 text-left text-[10px] font-bold uppercase text-[#6b7d86]">Escola</th>
                      <th className="px-5 py-3 text-left text-[10px] font-bold uppercase text-[#6b7d86]">Taxas (Loja)</th>
                      <th className="px-5 py-3 text-left text-[10px] font-bold uppercase text-[#6b7d86]">Add-ons</th>
                      <th className="px-5 py-3 text-left text-[10px] font-bold uppercase text-[#6b7d86]">Total a Faturar</th>
                      <th className="px-5 py-3 text-right text-[10px] font-bold uppercase text-[#6b7d86]">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumoTaxas.map(r => (
                      <tr key={r.escola_id} className="border-b border-[#f0f4f5] hover:bg-[#fafcfc]">
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-semibold text-[#243942]">{r.escola_nome}</p>
                          <p className="text-[10px] text-[#82939a]">{r.quantidade_alunos} alunos ativos</p>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-[#4d626c]">{formatarDinheiro(r.total_taxas_pendentes_centavos)}</td>
                        <td className="px-5 py-3.5 text-sm text-[#4d626c]">{formatarDinheiro(r.total_addons_centavos)}</td>
                        <td className="px-5 py-3.5 text-sm font-bold text-[#0d9488]">{formatarDinheiro(r.valor_fatura_centavos)}</td>
                        <td className="px-5 py-3.5 text-right">
                          <button 
                            onClick={() => handleGerarFaturaTaxas(r.escola_id)} 
                            disabled={gerandoFaturaId === r.escola_id}
                            className="text-xs bg-[#0d9488] text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-[#0f766e] disabled:opacity-50 flex items-center gap-1 ml-auto"
                          >
                            {gerandoFaturaId === r.escola_id ? <Loader2 className="size-3 animate-spin" /> : <FileText className="size-3" />}
                            Gerar Fatura
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

      {/* DRAWER EXTRATO DA ESCOLA */}
      {escolaDetalhe && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <aside className="bg-white w-full max-w-2xl h-full p-6 relative shadow-2xl flex flex-col">
            <button onClick={() => setEscolaDetalhe(null)} className="absolute right-4 top-4 text-gray-500 hover:text-gray-800"><X /></button>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-[#12232b]">{escolaDetalhe.nome}</h2>
              <p className="text-sm text-gray-500">Extrato e inteligência financeira</p>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="bg-gray-50 p-4 rounded-lg mb-6 flex gap-6">
                <div><p className="text-xs text-gray-500 uppercase font-bold">Total Pago (LTV)</p><p className="text-xl font-bold text-green-600">{formatarDinheiro(escolaDetalhe.ltvCentavos)}</p></div>
                <div><p className="text-xs text-gray-500 uppercase font-bold">Faturas em Atraso</p><p className="text-xl font-bold text-red-600">{escolaDetalhe.faturas_vencidas}</p></div>
                <div><p className="text-xs text-gray-500 uppercase font-bold">Média Atraso</p><p className="text-xl font-bold text-yellow-600">{escolaDetalhe.media_dias_atraso} dias</p></div>
              </div>

              <div className="bg-white border border-[#e5ecee] rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-[#12232b] flex items-center gap-2"><CalendarClock className="size-4 text-[#0d9488]" /> Assinatura Recorrente</h3>
                    <p className="text-xs text-gray-500 mt-1">Cobrança automática mensal via Mercado Pago.</p>
                  </div>
                  {assinaturaInfo?.mercadopago_preapproval_id ? (
                    <div className="text-right">
                      <span className="inline-block bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full mb-2">ATIVA</span>
                      <button onClick={handleCancelarAssinatura} disabled={processandoAssinatura} className="block text-xs text-red-600 font-semibold hover:underline ml-auto">
                        {processandoAssinatura ? 'Cancelando...' : 'Cancelar Assinatura'}
                      </button>
                    </div>
                  ) : (
                    <button onClick={handleGerarAssinatura} disabled={processandoAssinatura} className="bg-[#0d9488] text-white text-xs px-3 py-1.5 rounded-lg font-semibold hover:bg-[#0f766e] flex items-center gap-2">
                      {processandoAssinatura ? <Loader2 className="size-3 animate-spin" /> : <LinkIcon className="size-3" />} Ativar Assinatura
                    </button>
                  )}
                </div>
                {erroDrawer && <p className="text-red-500 text-xs mt-2">{erroDrawer}</p>}
              </div>
              
              <h3 className="font-bold mb-3 text-[#12232b]">Histórico de Faturas</h3>
              {carregandoExtrato ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-[#0d9488]" /></div>
              ) : faturas.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">Nenhuma fatura encontrada para esta escola.</p>
              ) : (
                <div className="space-y-3">
                  {faturas.map(f => (
                    <div key={f.id} className="border border-[#e5ecee] p-4 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm text-[#243942]">{f.descricao}</p>
                        <p className="text-xs text-gray-500">Vencimento: {new Date(f.vencimento).toLocaleDateString('pt-BR')} | Ref: {f.periodo_referencia}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#0d9488]">{formatarDinheiro(f.valor_centavos)}</p>
                        <div className="flex items-center gap-2 justify-end mt-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${f.status === 'pago' ? 'bg-green-100 text-green-700' : f.status === 'vencido' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {f.status}
                          </span>
                          {f.status !== 'pago' && (
                            <button onClick={() => handleSincronizar(f.id)} className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 font-semibold">
                              <RefreshCw className="size-3" /> Sincronizar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* MODAL COBRANÇA MANUAL (BACKUP) */}
      {modalCobrancaAberto && !linkGerado && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <aside className="bg-white w-full max-w-md h-full p-6 relative shadow-2xl overflow-y-auto">
            <button onClick={() => setModalCobrancaAberto(false)} className="absolute right-4 top-4 text-gray-500 hover:text-gray-800"><X /></button>
            <h2 className="text-xl font-bold mb-1">Cobrança Avulsa</h2>
            <p className="text-sm text-gray-500 mb-6">Use esta tela APENAS se o Mercado Pago falhar.</p>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold mb-1 block">Escola</label>
                <select value={escolaIdCobranca} onChange={e => setEscolaIdCobranca(e.target.value)} className="w-full border p-2 rounded outline-none focus:border-[#0d9488]">
                  <option value="">Selecione a escola...</option>
                  {escolas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold mb-1 block">Descrição</label>
                <input type="text" value={descricaoCobranca} onChange={e => setDescricaoCobranca(e.target.value)} className="w-full border p-2 rounded outline-none focus:border-[#0d9488]" />
              </div>

              <button onClick={handleCobrancaManual} disabled={processandoCobranca || !escolaIdCobranca} className="w-full bg-[#0d9488] text-white py-3 rounded-lg font-bold flex justify-center hover:bg-[#0f766e] mt-4 disabled:opacity-50">
                {processandoCobranca ? <Loader2 className="animate-spin" /> : 'Gerar Link no Mercado Pago'}
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* MODAL LINK GERADO */}
      {linkGerado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white p-6 rounded-xl max-w-md w-full relative text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-green-100 text-green-600 mb-4"><CheckCircle2 className="size-6" /></div>
            <h3 className="font-bold text-lg mb-2">Link de Pagamento Pronto!</h3>
            <p className="text-sm text-gray-500 mb-4">Copie o link e envie para a escola.</p>
            <div className="flex gap-2">
              <input readOnly value={linkGerado} className="flex-1 border p-2 text-xs truncate bg-gray-50 rounded text-gray-500" />
              <button onClick={() => navigator.clipboard.writeText(linkGerado)} className="bg-[#0d9488] text-white px-3 py-2 rounded hover:bg-[#0f766e] font-bold text-sm">Copiar</button>
            </div>
            <button onClick={() => { setLinkGerado(null); setModalCobrancaAberto(false); }} className="mt-6 w-full border py-2 rounded font-bold text-gray-700 hover:bg-gray-50">Fechar</button>
          </div>
        </div>
      )}
    </AdminShell>
  )
}