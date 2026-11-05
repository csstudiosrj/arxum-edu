'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Search, CircleDollarSign, Clock, CheckCircle2, AlertCircle, FileText, X, Loader2, CreditCard, QrCode, ExternalLink, Mail, Copy, Check } from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import { criarFatura, excluirFatura, gerarPixAdmin, enviarCobrancaEmail, type Fatura } from './actions'

const statusStyles: Record<string, string> = {
  pago: 'bg-[#d1fae5] text-[#065f46]',
  em_aberto: 'bg-[#fef3c7] text-[#92400e]',
  vencido: 'bg-[#fee2e2] text-[#991b1b]',
  cancelado: 'bg-[#e5ecee] text-[#5e7a94]',
}

const statusLabels: Record<string, string> = {
  pago: 'Pago',
  em_aberto: 'Em aberto',
  vencido: 'Vencido',
  cancelado: 'Cancelado',
}

function formatarMoeda(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarData(iso: string): string {
  try { return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR') } catch { return '—' }
}

export function FinanceiroClient({ faturas, alunos }: { faturas: Fatura[], alunos: any[] }) {
  const router = useRouter()
  const [filtro, setFiltro] = useState('todas')
  const [busca, setBusca] = useState('')
  const [novaFaturaAberta, setNovaFaturaAberta] = useState(false)
  const [detalheFatura, setDetalheFatura] = useState<Fatura | null>(null)
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState('')

  // Estados para geração de PIX e envio de e-mail
  const [gerandoPix, setGerandoPix] = useState(false)
  const [copiouPix, setCopiouPix] = useState(false)
  const [enviandoEmail, setEnviandoEmail] = useState(false)
  const [sucessoEmail, setSucessoEmail] = useState('')

  const [alunoIdx, setAlunoIdx] = useState('')
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [vencimento, setVencimento] = useState('')

  const filtradas = faturas.filter((f) => {
    const matchFiltro = filtro === 'todas' || f.status === filtro
    const termo = busca.toLowerCase()
    const matchBusca = busca === '' || f.aluno_nome.toLowerCase().includes(termo) || f.responsavel_email.toLowerCase().includes(termo)
    return matchFiltro && matchBusca
  })

  const totalRecebido = faturas.filter(f => f.status === 'pago').reduce((acc, f) => acc + f.valor_centavos, 0)
  const totalEmAberto = faturas.filter(f => f.status === 'em_aberto').reduce((acc, f) => acc + f.valor_centavos, 0)
  const totalVencido = faturas.filter(f => f.status === 'vencido').reduce((acc, f) => acc + f.valor_centavos, 0)

  function limpar() {
    setAlunoIdx('')
    setDescricao('')
    setValor('')
    setVencimento('')
    setErro('')
  }

  async function handleCriar() {
    if (!alunoIdx) return setErro('Selecione o aluno.')
    if (!descricao.trim()) return setErro('Informe a descrição.')
    
    const valorCentavos = Math.round(parseFloat(valor.replace(',', '.')) * 100)
    if (isNaN(valorCentavos) || valorCentavos <= 0) return setErro('Valor inválido.')
    if (!vencimento) return setErro('Informe o vencimento.')

    const aluno = alunos[parseInt(alunoIdx)]
    if (!aluno) return setErro('Aluno inválido.')

    setProcessando(true)
    setErro('')
    const r = await criarFatura({
      aluno_id: aluno.id,
      aluno_nome: aluno.nome,
      responsavel_email: aluno.responsavel_email,
      descricao,
      valor_centavos: valorCentavos,
      vencimento,
    })
    setProcessando(false)

    if (!r.success) return setErro(r.error || 'Erro ao criar fatura.')

    limpar()
    setNovaFaturaAberta(false)
    router.refresh()
  }

  async function handleGerarPix(faturaId: string) {
    setGerandoPix(true)
    const r = await gerarPixAdmin(faturaId)
    setGerandoPix(false)
    
    if (r.success && r.pix) {
      // Atualiza o modal localmente
      setDetalheFatura(prev => prev ? { ...prev, pix_copia_cola: r.pix.copiaCola, pix_qr_imagem: r.pix.qr } : null)
      router.refresh()
    } else {
      alert(r.error)
    }
  }

  async function handleEnviarCobranca(faturaId: string) {
    setEnviandoEmail(true)
    setSucessoEmail('')
    const r = await enviarCobrancaEmail(faturaId)
    setEnviandoEmail(false)
    
    if (r.success) {
      setSucessoEmail('E-mail de cobrança enviado com sucesso!')
      setTimeout(() => setSucessoEmail(''), 3000)
    } else {
      alert(r.error)
    }
  }

  return (
    <AdminShell mode="school" active="Financeiro">
      <main className="px-5 py-8 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Financeiro"
            title="Gestão financeira"
            description="Gerencie faturas e acompanhe a inadimplência da escola."
          />
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/configuracoes"
              className="inline-flex items-center gap-2 rounded-lg border border-[#b8c9ce] bg-white px-4 py-2 text-sm font-semibold text-[#30454e] transition hover:border-[var(--cor-primaria,#0d9488)]"
            >
              <CreditCard className="size-4" /> Gateway de Recebimento
            </Link>
            <button
              onClick={() => { limpar(); setNovaFaturaAberta(true) }}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:brightness-90"
              style={{ backgroundColor: 'var(--cor-primaria, #0d9488)' }}
            >
              <Plus className="size-4" /> Nova fatura
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Panel className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="grid size-8 place-items-center rounded-lg bg-[#d1fae5] text-[#065f46]"><CheckCircle2 className="size-4" /></div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Recebido</p>
            </div>
            <p className="text-2xl font-bold tracking-[-.03em] text-[#065f46]">{formatarMoeda(totalRecebido)}</p>
          </Panel>
          <Panel className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="grid size-8 place-items-center rounded-lg bg-[#fef3c7] text-[#92400e]"><Clock className="size-4" /></div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Em aberto</p>
            </div>
            <p className="text-2xl font-bold tracking-[-.03em] text-[#92400e]">{formatarMoeda(totalEmAberto)}</p>
          </Panel>
          <Panel className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="grid size-8 place-items-center rounded-lg bg-[#fee2e2] text-[#991b1b]"><AlertCircle className="size-4" /></div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Vencido</p>
            </div>
            <p className="text-2xl font-bold tracking-[-.03em] text-[#991b1b]">{formatarMoeda(totalVencido)}</p>
          </Panel>
          <Panel className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="grid size-8 place-items-center rounded-lg bg-[#e5ecee] text-[#5e7a94]"><CircleDollarSign className="size-4" /></div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Total de faturas</p>
            </div>
            <p className="text-2xl font-bold tracking-[-.03em] text-[#12232b]">{faturas.length}</p>
          </Panel>
        </div>

        <Panel className="mt-8">
          <div className="border-b border-[#e5ecee] px-5 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setFiltro('todas')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${filtro === 'todas' ? '' : 'text-[#6b7d86] hover:bg-[#f1f5f6]'}`}
                  style={filtro === 'todas' ? {
                    backgroundColor: 'color-mix(in srgb, var(--cor-primaria, #0d9488) 15%, white)',
                    color: 'var(--cor-primaria, #0d9488)',
                  } : undefined}
                >
                  Todas
                </button>
                {Object.entries(statusLabels).map(([k, l]) => {
                  const ativo = filtro === k
                  return (
                    <button
                      key={k}
                      onClick={() => setFiltro(k)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${ativo ? '' : 'text-[#6b7d86] hover:bg-[#f1f5f6]'}`}
                      style={ativo ? {
                        backgroundColor: 'color-mix(in srgb, var(--cor-primaria, #0d9488) 15%, white)',
                        color: 'var(--cor-primaria, #0d9488)',
                      } : undefined}
                    >
                      {l}
                    </button>
                  )
                })}
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 lg:w-64">
                <Search className="size-4 text-[#9aaab0]" />
                <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar aluno ou e-mail" className="w-full bg-transparent text-sm outline-none placeholder:text-[#a0afb4]" />
              </div>
            </div>
          </div>

          {filtradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <div
                className="grid size-14 place-items-center rounded-full"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--cor-primaria, #0d9488) 15%, white)',
                  color: 'var(--cor-primaria, #0d9488)',
                }}
              >
                <CircleDollarSign className="size-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-[#12232b]">Nenhuma fatura encontrada</h3>
              <p className="mt-1 max-w-sm text-sm text-[#82939a]">Gere a primeira cobrança e ela aparecerá aqui.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#e5ecee] bg-[#fafcfc]">
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Aluno</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Descrição</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Valor</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Vencimento</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Status</th>
                    <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map((f) => (
                    <tr key={f.id} className="border-b border-[#f0f4f5] transition hover:bg-[#fafcfc]">
                      <td className="px-5 py-3.5 text-sm font-semibold text-[#243942]">
                        <div>{f.aluno_nome}</div>
                        <div className="text-xs font-normal text-[#82939a]">{f.responsavel_email}</div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-[#4d626c]">{f.descricao}</td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-[#243942]">{formatarMoeda(f.valor_centavos)}</td>
                      <td className="px-5 py-3.5 text-sm text-[#82939a]">{formatarData(f.vencimento)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyles[f.status]}`}>
                          {statusLabels[f.status]}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setDetalheFatura(f)}
                          className="rounded-lg border border-[#b8c9ce] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#30454e] hover:border-[var(--cor-primaria,#0d9488)]"
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </main>

      {/* MODAL NOVA FATURA */}
      {novaFaturaAberta && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => !processando && setNovaFaturaAberta(false)} />
          <aside className="relative z-10 flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-[#e5ecee] px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-[#12232b]">Nova fatura</h2>
                <p className="mt-0.5 text-xs text-[#82939a]">Gerar cobrança para o responsável</p>
              </div>
              <button onClick={() => setNovaFaturaAberta(false)} disabled={processando} className="rounded-lg p-2 text-[#6b7d86] hover:bg-[#f1f5f6] disabled:opacity-50"><X className="size-5" /></button>
            </header>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Aluno</label>
                  <select value={alunoIdx} onChange={(e) => setAlunoIdx(e.target.value)} className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none focus:border-[var(--cor-primaria,#0d9488)]">
                    <option value="">Selecione o aluno</option>
                    {alunos.map((a, i) => <option key={a.nome} value={String(i)}>{a.nome} ({a.responsavel_email})</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Descrição da cobrança</label>
                  <input type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Mensalidade Outubro" className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[var(--cor-primaria,#0d9488)]" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Valor (R$)</label>
                    <input type="text" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[var(--cor-primaria,#0d9488)]" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Vencimento</label>
                    <input type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none focus:border-[var(--cor-primaria,#0d9488)]" />
                  </div>
                </div>
                {erro && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-600">{erro}</p>}
              </div>
            </div>
            <footer className="flex items-center justify-end gap-2 border-t border-[#e5ecee] bg-[#fafcfc] px-6 py-4">
              <button onClick={() => setNovaFaturaAberta(false)} disabled={processando} className="rounded-lg border border-[#b8c9ce] bg-white px-4 py-2 text-sm font-semibold text-[#30454e] disabled:opacity-50">Cancelar</button>
              <button
                onClick={handleCriar}
                disabled={processando}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:brightness-90 disabled:opacity-50"
                style={{ backgroundColor: 'var(--cor-primaria, #0d9488)' }}
              >
                {processando ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
                {processando ? 'Criando...' : 'Criar fatura'}
              </button>
            </footer>
          </aside>
        </div>
      )}

      {/* MODAL DETALHE FATURA (ATUALIZADO) */}
      {detalheFatura && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDetalheFatura(null)} />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-[#12232b]">Fatura de {detalheFatura.aluno_nome}</h2>
                <p className="text-xs text-[#82939a]">Ref: {detalheFatura.descricao}</p>
              </div>
              <button onClick={() => setDetalheFatura(null)} className="rounded-lg p-2 text-[#6b7d86] hover:bg-[#f1f5f6]"><X className="size-5" /></button>
            </div>

            <div className="overflow-y-auto pr-2 flex-1">
              <div className="rounded-xl border border-[#e5ecee] bg-[#fafcfc] p-4 mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-semibold text-[#243942]">{formatarMoeda(detalheFatura.valor_centavos)}</p>
                    <p className="text-xs text-[#82939a] mt-1">Vencimento: {formatarData(detalheFatura.vencimento)}</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyles[detalheFatura.status]}`}>
                    {statusLabels[detalheFatura.status]}
                  </span>
                </div>
              </div>

              {/* AÇÕES DE COBRANÇA */}
              {detalheFatura.status !== 'pago' && (
                <div className="space-y-4 mb-4">
                  
                  {!detalheFatura.pix_copia_cola && (
                    <button 
                      onClick={() => handleGerarPix(detalheFatura.id)} 
                      disabled={gerandoPix}
                      className="w-full bg-white border border-[#d5e0e3] text-[#30454e] py-3 rounded-lg font-bold flex justify-center items-center gap-2 hover:border-[#0d9488] transition disabled:opacity-50"
                    >
                      {gerandoPix ? <Loader2 className="size-5 animate-spin" /> : <QrCode className="size-5" />}
                      {gerandoPix ? 'Gerando PIX...' : 'Gerar PIX / Boleto'}
                    </button>
                  )}

                  {detalheFatura.pix_copia_cola && (
                    <div className="bg-[#f0fdfa] border border-[#ccfbf1] p-4 rounded-xl text-center">
                      <p className="text-xs font-bold text-[#0f766e] uppercase tracking-wider mb-2">PIX Copia e Cola</p>
                      <div className="flex gap-2">
                        <input readOnly value={detalheFatura.pix_copia_cola} className="w-full border border-[#ccfbf1] bg-white p-2 text-xs truncate rounded text-gray-500 outline-none" />
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(detalheFatura.pix_copia_cola || '')
                            setCopiouPix(true)
                            setTimeout(() => setCopiouPix(false), 2000)
                          }} 
                          className="bg-[#0d9488] text-white px-3 py-2 rounded hover:bg-[#0f766e] font-bold text-sm shrink-0"
                        >
                          {copiouPix ? <Check className="size-4" /> : <Copy className="size-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {detalheFatura.boleto_url && (
                    <a href={detalheFatura.boleto_url} target="_blank" rel="noopener noreferrer" className="w-full bg-white border border-[#d5e0e3] text-[#30454e] py-3 rounded-lg font-bold flex justify-center items-center gap-2 hover:border-[#0d9488] transition">
                      <ExternalLink className="size-5" /> Abrir Boleto
                    </a>
                  )}

                  <div className="border-t border-[#e5ecee] pt-4 mt-4">
                    <button 
                      onClick={() => handleEnviarCobranca(detalheFatura.id)} 
                      disabled={enviandoEmail || !!sucessoEmail}
                      className="w-full py-3 rounded-lg font-bold flex justify-center items-center gap-2 transition disabled:opacity-50"
                      style={{ backgroundColor: 'var(--cor-primaria, #0d9488)', color: 'white' }}
                    >
                      {enviandoEmail ? <Loader2 className="size-5 animate-spin" /> : <Mail className="size-5" />}
                      {enviandoEmail ? 'Enviando...' : 'Enviar Cobrança por E-mail'}
                    </button>
                    {sucessoEmail && (
                      <p className="text-xs text-green-600 text-center mt-2 flex items-center justify-center gap-1">
                        <CheckCircle2 className="size-3" /> {sucessoEmail}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[#e5ecee] flex justify-end shrink-0 mt-4">
              <button onClick={() => { if(confirm('Excluir esta fatura?')) excluirFatura(detalheFatura.id).then(() => { setDetalheFatura(null); router.refresh() }) }} className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1">
                Excluir Fatura
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  )
}
