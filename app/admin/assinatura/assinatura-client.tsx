'use client'

import { useState } from 'react'
import { CreditCard, CheckCircle2, Clock, AlertCircle, Download, ExternalLink, Loader2, Sparkles, ShieldCheck, CalendarClock } from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import { gerarPagamentoArxum, type FaturaArxum } from './actions'

function formatarMoeda(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarData(iso: string | null): string {
  if (!iso) return '—'
  try { return new Date(iso + (iso.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('pt-BR') } catch { return '—' }
}

const statusStyles: Record<string, string> = {
  pago: 'bg-[#d1fae5] text-[#065f46]',
  em_aberto: 'bg-[#fef3c7] text-[#92400e]',
  vencido: 'bg-[#fee2e2] text-[#991b1b]',
  cancelado: 'bg-[#e5ecee] text-[#5e7a94]',
}

const statusLabels: Record<string, string> = {
  pago: 'Pago', em_aberto: 'Em aberto', vencido: 'Vencido', cancelado: 'Cancelado',
}

export function AssinaturaClient({ 
  faturas, planoAtual, addonsAtivos, statusAssinatura, mercadopagoPreapprovalId
}: { 
  faturas: FaturaArxum[], 
  planoAtual: string,
  addonsAtivos: any[],
  statusAssinatura: string,
  mercadopagoPreapprovalId: string | null
}) {
  const [processando, setProcessando] = useState<string | null>(null)

  async function handlePagar(faturaId: string) {
    setProcessando(faturaId)
    const r = await gerarPagamentoArxum(faturaId)
    setProcessando(null)

    if (r.success && r.link) {
      window.location.href = r.link
    } else {
      alert(r.error || 'Erro ao gerar pagamento.')
    }
  }

  const faturasPendentes = faturas.filter(f => f.status === 'em_aberto' || f.status === 'vencido')
  const faturasPagas = faturas.filter(f => f.status === 'pago')

  return (
    <AdminShell mode="school" active="Minha Assinatura">
      <main className="px-5 py-8 lg:px-8">
        <SectionHeading
          eyebrow="Financeiro"
          title="Minha Assinatura ARXUM"
          description="Acompanhe seu plano, add-ons e faturas da plataforma."
        />

        {/* Resumo do Plano Atual */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Panel className="p-6 bg-gradient-to-br from-[#173b4a] to-[#0d2833] text-white border-none relative overflow-hidden">
            <div className="absolute -right-10 -top-10 size-40 rounded-full bg-[#0d9488] opacity-20 blur-3xl"></div>
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#8aa0ad]">Seu Plano Atual</p>
                <h2 className="text-2xl font-bold mt-1 capitalize">{planoAtual}</h2>
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold">
                  {statusAssinatura === 'ativa' ? <><CheckCircle2 size={12} className="text-[#0d9488]"/> Assinatura Ativa</> : 
                   statusAssinatura === 'trial' ? <><CalendarClock size={12} className="text-blue-400"/> Período de Teste</> : 
                   <><AlertCircle size={12} className="text-red-400"/> Pagamento Pendente</>}
                </div>
              </div>
              <div className="grid size-10 place-items-center rounded-lg bg-white/10"><Sparkles size={20} className="text-[#0d9488]"/></div>
            </div>
            {mercadopagoPreapprovalId ? (
              <p className="mt-4 text-xs text-[#8aa0ad] relative z-10">Sua cobrança é automática via Mercado Pago. Não é necessário pagar manualmente.</p>
            ) : (
              <p className="mt-4 text-xs text-[#8aa0ad] relative z-10">Sua cobrança é gerada todo mês. Você receberá a fatura para pagamento.</p>
            )}
          </Panel>

          <Panel className="p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-[#6b7d86]">Add-ons Ativos</p>
            {addonsAtivos.length === 0 ? (
              <p className="mt-4 text-sm text-[#82939a]">Nenhum add-on ativo no momento.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {addonsAtivos.map(a => (
                  <div key={a.slug} className="flex items-center justify-between rounded-lg border border-[#e5ecee] bg-[#fafcfc] p-3">
                    <span className="text-sm font-semibold text-[#243942]">{a.nome}</span>
                    <span className="text-xs font-bold text-[#0d9488]">{formatarMoeda(a.preco_centavos)}/mês</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        {/* Faturas Pendentes */}
        <h3 className="mt-10 text-lg font-bold text-[#12232b] mb-4">Faturas em Aberto</h3>
        
        {faturasPendentes.length === 0 ? (
          <div className="rounded-xl border border-[#d1fae5] bg-[#d1fae5]/30 p-8 text-center flex flex-col items-center">
            <ShieldCheck className="size-10 text-[#065f46] mb-3" />
            <p className="text-base font-bold text-[#065f46]">Tudo em dia!</p>
            <p className="text-sm text-[#065f46]/80 mt-1">Você não possui nenhuma fatura pendente com a ARXUM.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {faturasPendentes.map(f => (
              <Panel key={f.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-2 border-[#fef3c7]">
                <div className="flex items-start gap-4">
                  <div className={`grid size-10 shrink-0 place-items-center rounded-lg ${f.status === 'vencido' ? 'bg-[#fee2e2] text-[#991b1b]' : 'bg-[#fef3c7] text-[#92400e]'}`}>
                    {f.status === 'vencido' ? <AlertCircle size={20}/> : <Clock size={20}/>}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#12232b]">{f.descricao}</p>
                    <p className="text-xs text-[#82939a] mt-1">Vencimento: <strong className={f.status === 'vencido' ? 'text-red-600' : ''}>{formatarData(f.vencimento)}</strong></p>
                    <p className="text-lg font-bold text-[#12232b] mt-2">{formatarMoeda(f.valor_centavos)}</p>
                  </div>
                </div>
                <button
                  onClick={() => handlePagar(f.id)}
                  disabled={processando === f.id}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-bold text-white transition hover:brightness-90 disabled:opacity-50"
                  style={{ backgroundColor: 'var(--cor-primaria, #0d9488)' }}
                >
                  {processando === f.id ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
                  {processando === f.id ? 'Gerando...' : 'Pagar Fatura'}
                </button>
              </Panel>
            ))}
          </div>
        )}

        {/* Histórico de Faturas */}
        {faturasPagas.length > 0 && (
          <>
            <h3 className="mt-10 text-lg font-bold text-[#12232b] mb-4">Histórico de Pagamentos</h3>
            <Panel>
              <div className="divide-y divide-[#f0f4f5]">
                {faturasPagas.map(f => (
                  <div key={f.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="grid size-8 place-items-center rounded-full bg-[#d1fae5] text-[#065f46]"><CheckCircle2 size={16}/></div>
                      <div>
                        <p className="text-sm font-semibold text-[#243942]">{f.descricao}</p>
                        <p className="text-xs text-[#82939a]">Pago em {formatarData(f.pago_em)}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-[#536871]">{formatarMoeda(f.valor_centavos)}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </>
        )}

        <div className="mt-8 rounded-xl border border-[#e5ecee] bg-[#fafcfc] p-5 flex items-start gap-3">
          <ShieldCheck className="size-5 text-[#0d9488] shrink-0 mt-0.5" />
          <p className="text-xs leading-6 text-[#82939a]">
            Os pagamentos são processados com segurança pelo Mercado Pago. Ao clicar em "Pagar Fatura", você será redirecionado para o ambiente seguro do gateway.
          </p>
        </div>
      </main>
    </AdminShell>
  )
}