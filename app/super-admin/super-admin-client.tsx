'use client'

import Link from 'next/link'
import { Building2, TrendingUp, Users, Headphones, AlertCircle, BarChart3, ArrowRight, DollarSign } from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import type { MetricasSaaS } from './actions'

const planoLabels: Record<string, string> = { semente: 'Semente', raiz: 'Raiz', copa: 'Copa', rede: 'Rede' }
const planoCores: Record<string, string> = { semente: '#5e7a94', raiz: '#0d9488', copa: '#3b82f6', rede: '#7c3aed' }
const prioridadeStyles: Record<string, string> = { baixa: 'bg-[#e5ecee] text-[#5e7a94]', normal: 'bg-[#dbeafe] text-[#1e40af]', alta: 'bg-[#fef3c7] text-[#92400e]', urgente: 'bg-[#fee2e2] text-[#991b1b]' }
const prioridadeLabel: Record<string, string> = { baixa: 'Baixa', normal: 'Normal', alta: 'Alta', urgente: 'Urgente' }
const statusStyles: Record<string, string> = { aberto: 'bg-[#fef3c7] text-[#92400e]', em_andamento: 'bg-[#dbeafe] text-[#1e40af]', resolvido: 'bg-[#d1fae5] text-[#065f46]', fechado: 'bg-[#e5ecee] text-[#5e7a94]' }
const statusLabel: Record<string, string> = { aberto: 'Aberto', em_andamento: 'Em andamento', resolvido: 'Resolvido', fechado: 'Fechado' }

function formatarMoeda(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}
function formatarData(iso: string): string {
  try { return new Date(iso).toLocaleDateString('pt-BR') } catch { return '—' }
}

export function SuperAdminClient({ metricas }: { metricas: MetricasSaaS }) {
  const maxPlano = Math.max(...metricas.distribuicaoPlanos.map((p) => p.total), 1)

  return (
    <AdminShell mode="super" active="Visão geral">
      <main className="px-5 py-8 lg:px-8">
        <SectionHeading
          eyebrow="ARXUM Admin"
          title="Painel ARXUM"
          description="Visão consolidada de todas as escolas clientes da plataforma."
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/super-admin/escolas" className="block transition hover:-translate-y-1 hover:shadow-lg">
            <Panel className="p-5 h-full">
              <div className="grid size-10 place-items-center rounded-lg bg-[#ccfbf1] text-[#0d9488]"><Building2 className="size-5" /></div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Escolas ativas</p>
              <p className="mt-1 text-3xl font-bold tracking-[-.03em] text-[#0d9488]">{metricas.escolasTotal}</p>
              <p className="mt-1 text-xs text-[#82939a]">+{metricas.novosEsteMes} este mês</p>
            </Panel>
          </Link>

          <Link href="/super-admin/faturamento" className="block transition hover:-translate-y-1 hover:shadow-lg">
            <Panel className="p-5 h-full">
              <div className="grid size-10 place-items-center rounded-lg bg-[#d1fae5] text-[#065f46]"><DollarSign className="size-5" /></div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">MRR</p>
              <p className="mt-1 text-3xl font-bold tracking-[-.03em] text-[#065f46]">{formatarMoeda(metricas.mrrCentavos)}</p>
              <p className="mt-1 text-xs text-[#82939a]">Receita recorrente mensal</p>
            </Panel>
          </Link>

          <Link href="/super-admin/escolas" className="block transition hover:-translate-y-1 hover:shadow-lg">
            <Panel className="p-5 h-full">
              <div className="grid size-10 place-items-center rounded-lg bg-[#dbeafe] text-[#3b82f6]"><Users className="size-5" /></div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Alunos na base</p>
              <p className="mt-1 text-3xl font-bold tracking-[-.03em] text-[#3b82f6]">{metricas.alunosTotal.toLocaleString('pt-BR')}</p>
              <p className="mt-1 text-xs text-[#82939a]">Todas as escolas</p>
            </Panel>
          </Link>

          <Link href="/super-admin/suporte" className="block transition hover:-translate-y-1 hover:shadow-lg">
            <Panel className="p-5 h-full">
              <div className="grid size-10 place-items-center rounded-lg bg-[#fef3c7] text-[#92400e]"><Headphones className="size-5" /></div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Tickets abertos</p>
              <p className="mt-1 text-3xl font-bold tracking-[-.03em] text-[#92400e]">{metricas.ticketsAbertos}</p>
              <p className="mt-1 text-xs text-[#82939a]">{metricas.ticketsUrgentes} urgentes</p>
            </Panel>
          </Link>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
          <Panel>
            <div className="flex items-center justify-between border-b border-[#e5ecee] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="grid size-9 place-items-center rounded-lg bg-[#ccfbf1] text-[#0d9488]"><Building2 className="size-4" /></div>
                <h2 className="text-base font-bold text-[#12232b]">Escolas recentes</h2>
              </div>
              <Link href="/super-admin/escolas" className="inline-flex items-center gap-1 text-xs font-semibold text-[#0d9488] hover:text-[#0f766e]">Ver todas <ArrowRight className="size-3" /></Link>
            </div>
            {metricas.escolasRecentes.length === 0 ? (
              <div className="px-5 py-12 text-center"><p className="text-sm text-[#82939a]">Nenhuma escola cadastrada ainda.</p></div>
            ) : (
              <div className="divide-y divide-[#f0f4f5]">
                {metricas.escolasRecentes.map((e) => (
                  <Link key={e.id} href="/super-admin/escolas" className="flex items-center gap-4 px-5 py-4 transition hover:bg-[#fafcfc] block">
                    <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#f0f4f5] text-[#536871]"><Building2 className="size-5" /></div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-[#243942]">{e.nome}</h3>
                      <p className="mt-0.5 text-xs text-[#82939a]">{e.slug} · {e.alunos} alunos</p>
                    </div>
                    <span className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ backgroundColor: `${planoCores[e.plano]}15`, color: planoCores[e.plano] }}>{planoLabels[e.plano] || e.plano}</span>
                    <span className="hidden text-xs text-[#82939a] sm:block">{formatarData(e.criado_em)}</span>
                  </Link>
                ))}
              </div>
            )}
          </Panel>

          <Panel className="p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-lg bg-[#dbeafe] text-[#3b82f6]"><BarChart3 className="size-4" /></div>
              <div><h2 className="text-base font-bold text-[#12232b]">Distribuição por plano</h2><p className="text-xs text-[#82939a]">Escolas em cada plano</p></div>
            </div>
            {metricas.distribuicaoPlanos.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#82939a]">Sem dados ainda.</p>
            ) : (
              <div className="space-y-4">
                {metricas.distribuicaoPlanos.map((p) => {
                  const pct = Math.round((p.total / maxPlano) * 100)
                  const cor = planoCores[p.plano] || '#6b7d86'
                  return (
                    <div key={p.plano}>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#243942]">{planoLabels[p.plano] || p.plano}</span>
                        <span className="text-[#82939a]">{p.total} escolas · {formatarMoeda(p.mrrCentavos)}</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-[#f0f4f5]"><div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cor }} /></div>
                    </div>
                  )
                })}
              </div>
            )}
            <div className="mt-6 rounded-lg border border-[#d1fae5] bg-[#d1fae5]/30 p-4">
              <div className="flex items-center gap-2"><TrendingUp className="text-[#065f46]" size={16} /><p className="text-xs font-bold uppercase tracking-wider text-[#065f46]">Receita recorrente</p></div>
              <p className="mt-2 text-2xl font-bold text-[#065f46]">{formatarMoeda(metricas.mrrCentavos)}</p>
              <p className="mt-1 text-xs text-[#065f46]/70">{formatarMoeda(metricas.mrrCentavos * 12)} por ano</p>
            </div>
          </Panel>
        </div>
      </main>
    </AdminShell>
  )
}