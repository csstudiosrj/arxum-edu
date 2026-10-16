'use client'

import Link from 'next/link'
import {
  Building2, TrendingUp, Users, Headphones, AlertCircle, DollarSign,
  CheckCircle2, XCircle, Activity, BarChart3, ArrowUpRight, Clock, Percent,
} from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import type { MetricasSaaS } from '../actions'

const planoLabels: Record<string, string> = {
  semente: 'Semente',
  raiz: 'Raiz',
  copa: 'Copa',
  rede: 'Rede',
}

const planoCores: Record<string, string> = {
  semente: '#5e7a94',
  raiz: '#0d9488',
  copa: '#3b82f6',
  rede: '#7c3aed',
}

const prioridadeStyles: Record<string, string> = {
  baixa: 'bg-[#e5ecee] text-[#5e7a94]',
  normal: 'bg-[#dbeafe] text-[#1e40af]',
  alta: 'bg-[#fef3c7] text-[#92400e]',
  urgente: 'bg-[#fee2e2] text-[#991b1b]',
}

const prioridadeLabel: Record<string, string> = {
  baixa: 'Baixa',
  normal: 'Normal',
  alta: 'Alta',
  urgente: 'Urgente',
}

const statusStyles: Record<string, string> = {
  aberto: 'bg-[#fef3c7] text-[#92400e]',
  em_andamento: 'bg-[#dbeafe] text-[#1e40af]',
  resolvido: 'bg-[#d1fae5] text-[#065f46]',
  fechado: 'bg-[#e5ecee] text-[#5e7a94]',
}

const statusLabel: Record<string, string> = {
  aberto: 'Aberto',
  em_andamento: 'Em andamento',
  resolvido: 'Resolvido',
  fechado: 'Fechado',
}

function formatarMoeda(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  })
}

function formatarMoedaPrecisa(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatarNumero(n: number): string {
  return n.toLocaleString('pt-BR')
}

function formatarData(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR')
  } catch {
    return '—'
  }
}

export function MetricasClient({ metricas }: { metricas: MetricasSaaS }) {
  const {
    escolasAtivas, escolasTrial, escolasSuspensas, escolasTotal,
    mrrCentavos, alunosTotal, distribuicaoPlanos, escolasRecentes,
    ticketsAbertos, ticketsUrgentes, ticketsRecentes, novosEsteMes,
  } = metricas

  const arrCentavos = mrrCentavos * 12
  const arpuCentavos = escolasAtivas > 0 ? Math.round(mrrCentavos / escolasAtivas) : 0
  const mediaAlunosPorEscola = escolasTotal > 0 ? Math.round(alunosTotal / escolasTotal) : 0
  const taxaConversao = escolasTotal > 0 ? Math.round((escolasAtivas / escolasTotal) * 100) : 0
  const pctAtivas = escolasTotal > 0 ? Math.round((escolasAtivas / escolasTotal) * 100) : 0
  const pctTrial = escolasTotal > 0 ? Math.round((escolasTrial / escolasTotal) * 100) : 0
  const pctSuspensas = escolasTotal > 0 ? Math.round((escolasSuspensas / escolasTotal) * 100) : 0

  const maxPlano = Math.max(...distribuicaoPlanos.map((p) => p.total), 1)

  const escolasOrdenadasPorAlunos = [...escolasRecentes]
    .sort((a, b) => b.alunos - a.alunos)
    .slice(0, 5)

  const ticketsCriticos = ticketsRecentes
    .filter((t) => t.prioridade === 'urgente' || t.prioridade === 'alta')
    .slice(0, 5)

  const temDados = escolasTotal > 0

  return (
    <AdminShell mode="super" active="Métricas">
      <main className="px-5 py-8 lg:px-8">
        <SectionHeading
          eyebrow="ARXUM Admin"
          title="Métricas da plataforma"
          description="Indicadores de crescimento, receita, base de alunos e saúde operacional do SaaS."
        />

        {/* KPIs principais */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Panel className="p-5">
            <div className="flex items-start justify-between">
              <div className="grid size-10 place-items-center rounded-lg bg-[#ccfbf1] text-[#0d9488]">
                <Building2 className="size-5" />
              </div>
              <span className="rounded-full bg-[#ccfbf1] px-2 py-0.5 text-[10px] font-bold text-[#0f766e]">
                {pctAtivas}% do total
              </span>
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Escolas ativas</p>
            <p className="mt-1 text-3xl font-bold tracking-[-.03em] text-[#0d9488]">{escolasAtivas}</p>
            <p className="mt-1 text-xs text-[#82939a]">
              {escolasTotal} na base · {novosEsteMes} novas este mês
            </p>
          </Panel>

          <Panel className="p-5">
            <div className="flex items-start justify-between">
              <div className="grid size-10 place-items-center rounded-lg bg-[#d1fae5] text-[#065f46]">
                <DollarSign className="size-5" />
              </div>
              <span className="rounded-full bg-[#d1fae5] px-2 py-0.5 text-[10px] font-bold text-[#065f46]">
                ARR {formatarMoeda(arrCentavos)}
              </span>
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">MRR</p>
            <p className="mt-1 text-3xl font-bold tracking-[-.03em] text-[#065f46]">{formatarMoeda(mrrCentavos)}</p>
            <p className="mt-1 text-xs text-[#82939a]">
              ARPU {formatarMoedaPrecisa(arpuCentavos)}
            </p>
          </Panel>

          <Panel className="p-5">
            <div className="flex items-start justify-between">
              <div className="grid size-10 place-items-center rounded-lg bg-[#dbeafe] text-[#3b82f6]">
                <Users className="size-5" />
              </div>
              <span className="rounded-full bg-[#dbeafe] px-2 py-0.5 text-[10px] font-bold text-[#1e40af]">
                {mediaAlunosPorEscola}/escola
              </span>
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Alunos na base</p>
            <p className="mt-1 text-3xl font-bold tracking-[-.03em] text-[#3b82f6]">{formatarNumero(alunosTotal)}</p>
            <p className="mt-1 text-xs text-[#82939a]">Todas as escolas clientes</p>
          </Panel>

          <Panel className="p-5">
            <div className="flex items-start justify-between">
              <div className="grid size-10 place-items-center rounded-lg bg-[#fef3c7] text-[#92400e]">
                <Headphones className="size-5" />
              </div>
              {ticketsUrgentes > 0 && (
                <span className="rounded-full bg-[#fee2e2] px-2 py-0.5 text-[10px] font-bold text-[#991b1b]">
                  {ticketsUrgentes} urgentes
                </span>
              )}
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Tickets abertos</p>
            <p className="mt-1 text-3xl font-bold tracking-[-.03em] text-[#92400e]">{ticketsAbertos}</p>
            <p className="mt-1 text-xs text-[#82939a]">Suporte em andamento</p>
          </Panel>
        </div>

        {/* KPIs secundários */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Panel className="flex items-center gap-4 p-4">
            <div className="grid size-9 place-items-center rounded-lg bg-[#dbeafe] text-[#3b82f6]">
              <Activity className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6b7d86]">Em trial</p>
              <p className="text-xl font-bold tracking-[-.02em] text-[#12232b]">{escolasTrial}</p>
            </div>
            <span className="text-[11px] font-semibold text-[#82939a]">{pctTrial}%</span>
          </Panel>

          <Panel className="flex items-center gap-4 p-4">
            <div className="grid size-9 place-items-center rounded-lg bg-[#fee2e2] text-[#991b1b]">
              <XCircle className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6b7d86]">Suspensas</p>
              <p className="text-xl font-bold tracking-[-.02em] text-[#12232b]">{escolasSuspensas}</p>
            </div>
            <span className="text-[11px] font-semibold text-[#82939a]">{pctSuspensas}%</span>
          </Panel>

          <Panel className="flex items-center gap-4 p-4">
            <div className="grid size-9 place-items-center rounded-lg bg-[#ccfbf1] text-[#0f766e]">
              <TrendingUp className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6b7d86]">Novas este mês</p>
              <p className="text-xl font-bold tracking-[-.02em] text-[#12232b]">{novosEsteMes}</p>
            </div>
          </Panel>

          <Panel className="flex items-center gap-4 p-4">
            <div className="grid size-9 place-items-center rounded-lg bg-[#ede9fe] text-[#5b21b6]">
              <Percent className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6b7d86]">Conversão trial → ativa</p>
              <p className="text-xl font-bold tracking-[-.02em] text-[#12232b]">{taxaConversao}%</p>
            </div>
          </Panel>
        </div>

        {/* Distribuição + saúde da base */}
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
          <Panel>
            <div className="flex items-center justify-between border-b border-[#e5ecee] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="grid size-9 place-items-center rounded-lg bg-[#dbeafe] text-[#3b82f6]">
                  <BarChart3 className="size-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#12232b]">Distribuição por plano</h2>
                  <p className="text-xs text-[#82939a]">Escolas, MRR e ticket médio por plano</p>
                </div>
              </div>
            </div>

            {distribuicaoPlanos.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <p className="text-sm text-[#82939a]">Nenhum plano com escolas atribuídas ainda.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#f0f4f5]">
                {distribuicaoPlanos.map((p) => {
                  const cor = planoCores[p.plano] || '#6b7d86'
                  const pct = Math.round((p.total / maxPlano) * 100)
                  const ticketMedio = p.total > 0 ? Math.round(p.mrrCentavos / p.total) : 0
                  const pctBase = escolasTotal > 0 ? Math.round((p.total / escolasTotal) * 100) : 0

                  return (
                    <div key={p.plano} className="px-5 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="size-2.5 rounded-full" style={{ backgroundColor: cor }} />
                          <span className="text-sm font-bold text-[#12232b]">
                            {planoLabels[p.plano] || p.plano}
                          </span>
                          <span className="text-xs text-[#82939a]">{pctBase}% da base</span>
                        </div>
                        <span className="text-sm font-bold" style={{ color: cor }}>
                          {p.total} {p.total === 1 ? 'escola' : 'escolas'}
                        </span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#f0f4f5]">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: cor }} />
                      </div>
                      <div className="mt-2.5 grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-[#82939a]">MRR do plano: </span>
                          <span className="font-semibold text-[#243942]">{formatarMoeda(p.mrrCentavos)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[#82939a]">Ticket médio: </span>
                          <span className="font-semibold text-[#243942]">{formatarMoeda(ticketMedio)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Panel>

          <Panel className="p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-lg bg-[#d1fae5] text-[#065f46]">
                <CheckCircle2 className="size-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#12232b]">Saúde da base</h2>
                <p className="text-xs text-[#82939a]">Status de assinatura das escolas</p>
              </div>
            </div>

            {!temDados ? (
              <p className="py-8 text-center text-sm text-[#82939a]">Sem dados ainda.</p>
            ) : (
              <>
                <div className="space-y-4">
                  <LinhaSaude
                    label="Ativas"
                    valor={escolasAtivas}
                    total={escolasTotal}
                    cor="#0d9488"
                  />
                  <LinhaSaude
                    label="Trial"
                    valor={escolasTrial}
                    total={escolasTotal}
                    cor="#3b82f6"
                  />
                  <LinhaSaude
                    label="Suspensas/canceladas"
                    valor={escolasSuspensas}
                    total={escolasTotal}
                    cor="#dc2626"
                  />
                </div>

                <div className="mt-6 rounded-lg border border-[#d1fae5] bg-[#d1fae5]/30 p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="text-[#065f46]" size={16} />
                    <p className="text-xs font-bold uppercase tracking-wider text-[#065f46]">
                      Receita projetada
                    </p>
                  </div>
                  <p className="mt-2 font-syne text-2xl font-bold text-[#065f46]">
                    {formatarMoeda(arrCentavos)}
                  </p>
                  <p className="mt-1 text-xs text-[#065f46]/70">
                    ARR com base no MRR atual de {escolasAtivas} escolas ativas
                  </p>
                </div>
              </>
            )}
          </Panel>
        </div>

        {/* Top escolas + tickets críticos */}
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Panel>
            <div className="flex items-center justify-between border-b border-[#e5ecee] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="grid size-9 place-items-center rounded-lg bg-[#ede9fe] text-[#5b21b6]">
                  <Users className="size-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#12232b]">Maiores escolas</h2>
                  <p className="text-xs text-[#82939a]">Por número de alunos na base</p>
                </div>
              </div>
              <Link
                href="/super-admin/escolas"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0d9488] hover:text-[#0f766e]"
              >
                Ver todas <ArrowUpRight className="size-3" />
              </Link>
            </div>

            {escolasOrdenadasPorAlunos.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <p className="text-sm text-[#82939a]">Nenhuma escola cadastrada ainda.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#f0f4f5]">
                {escolasOrdenadasPorAlunos.map((e, i) => (
                  <div key={e.id} className="flex items-center gap-4 px-5 py-4 transition hover:bg-[#fafcfc]">
                    <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#f0f4f5] text-xs font-bold text-[#536871]">
                      {i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold text-[#243942]">{e.nome}</h3>
                      <p className="mt-0.5 text-xs text-[#82939a]">{e.slug}</p>
                    </div>
                    <span
                      className="rounded-full px-2.5 py-1 text-[10px] font-bold"
                      style={{
                        backgroundColor: `${planoCores[e.plano]}15`,
                        color: planoCores[e.plano],
                      }}
                    >
                      {planoLabels[e.plano] || e.plano}
                    </span>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#243942]">{e.alunos}</p>
                      <p className="text-[10px] uppercase tracking-wider text-[#82939a]">alunos</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel>
            <div className="flex items-center justify-between border-b border-[#e5ecee] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="grid size-9 place-items-center rounded-lg bg-[#fee2e2] text-[#991b1b]">
                  <AlertCircle className="size-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#12232b]">Tickets críticos</h2>
                  <p className="text-xs text-[#82939a]">Prioridade alta ou urgente</p>
                </div>
              </div>
              <Link
                href="/super-admin/suporte"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0d9488] hover:text-[#0f766e]"
              >
                Ver todos <ArrowUpRight className="size-3" />
              </Link>
            </div>

            {ticketsCriticos.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <CheckCircle2 className="mx-auto text-[#a0afb4]" size={28} />
                <p className="mt-3 text-sm text-[#82939a]">Nenhum ticket crítico. Boa notícia.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#f0f4f5]">
                {ticketsCriticos.map((t) => (
                  <div key={t.id} className="flex items-start gap-4 px-5 py-4 transition hover:bg-[#fafcfc]">
                    <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#f0f4f5] text-[#536871]">
                      <Clock className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-[#243942]">{t.assunto}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${prioridadeStyles[t.prioridade]}`}>
                          {prioridadeLabel[t.prioridade]}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusStyles[t.status]}`}>
                          {statusLabel[t.status]}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#82939a]">
                        {t.escola_nome} · {formatarData(t.criado_em)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </main>
    </AdminShell>
  )
}

function LinhaSaude({
  label,
  valor,
  total,
  cor,
}: {
  label: string
  valor: number
  total: number
  cor: string
}) {
  const pct = total > 0 ? Math.round((valor / total) * 100) : 0
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-semibold text-[#243942]">{label}</span>
        <span className="text-[#82939a]">
          {valor} {valor === 1 ? 'escola' : 'escolas'} · {pct}%
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-[#f0f4f5]">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: cor }}
        />
      </div>
    </div>
  )
}