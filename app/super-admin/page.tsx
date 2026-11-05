import Link from 'next/link'
import { Building2, Users, DollarSign, Headphones, ArrowRight, TrendingUp } from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import { getMetricasSaaS } from './actions'

export const dynamic = 'force-dynamic'

export default async function SuperAdminPage() {
  const metricas = await getMetricasSaaS()

  const formatarMoeda = (centavos: number) => (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

  return (
    <AdminShell mode="super" active="Visão geral">
      <main className="px-5 py-8 lg:px-8">
        <SectionHeading
          eyebrow="ARXUM Admin"
          title="Painel ARXUM"
          description="Visão consolidada de todas as escolas clientes da plataforma."
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Panel className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="grid size-9 place-items-center rounded-lg bg-[#ccfbf1] text-[#0d9488]"><Building2 className="size-5" /></div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Escolas ativas</p>
            </div>
            <p className="text-3xl font-bold tracking-[-.03em] text-[#0d9488]">{metricas.escolasAtivas}</p>
            <p className="mt-1 text-xs text-[#82939a]">+{metricas.novosEsteMes} este mês</p>
          </Panel>
          <Panel className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="grid size-9 place-items-center rounded-lg bg-[#d1fae5] text-[#065f46]"><DollarSign className="size-5" /></div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">MRR</p>
            </div>
            <p className="text-3xl font-bold tracking-[-.03em] text-[#065f46]">{formatarMoeda(metricas.mrrCentavos)}</p>
            <p className="mt-1 text-xs text-[#82939a]">Receita recorrente mensal</p>
          </Panel>
          <Panel className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="grid size-9 place-items-center rounded-lg bg-[#dbeafe] text-[#1e40af]"><Users className="size-5" /></div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Alunos na base</p>
            </div>
            <p className="text-3xl font-bold tracking-[-.03em] text-[#1e40af]">{metricas.alunosTotal}</p>
            <p className="mt-1 text-xs text-[#82939a]">Todas as escolas</p>
          </Panel>
          <Panel className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="grid size-9 place-items-center rounded-lg bg-[#fef3c7] text-[#92400e]"><Headphones className="size-5" /></div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Tickets abertos</p>
            </div>
            <p className="text-3xl font-bold tracking-[-.03em] text-[#92400e]">{metricas.ticketsAbertos}</p>
            <p className="mt-1 text-xs text-[#82939a]">{metricas.ticketsUrgentes} urgentes</p>
          </Panel>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Panel>
            <div className="flex items-center justify-between border-b border-[#e5ecee] px-5 py-4">
              <h2 className="text-base font-bold text-[#12232b] flex items-center gap-2"><Building2 className="size-4 text-[#0d9488]"/> Escolas recentes</h2>
              <Link href="/super-admin/escolas" className="text-xs font-semibold text-[#0d9488] hover:underline flex items-center gap-1">
                Ver todas <ArrowRight className="size-3" />
              </Link>
            </div>
            <div className="divide-y divide-[#f0f4f5]">
              {metricas.escolasRecentes.map((escola) => (
                <Link 
                  key={escola.id} 
                  href={`/super-admin/escolas?escolaId=${escola.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-[#fafcfc] transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid size-8 place-items-center rounded-lg bg-[#f0f4f5] text-[#536871]"><Building2 className="size-4" /></div>
                    <div>
                      <p className="text-sm font-semibold text-[#243942]">{escola.nome}</p>
                      <p className="text-xs text-[#82939a]">{escola.slug} · {escola.alunos} alunos</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold bg-[#ccfbf1] text-[#0f766e] px-2 py-1 rounded-md">{escola.plano}</span>
                </Link>
              ))}
              {metricas.escolasRecentes.length === 0 && (
                <p className="px-5 py-8 text-center text-sm text-[#82939a]">Nenhuma escola cadastrada ainda.</p>
              )}
            </div>
          </Panel>

          <Panel>
            <div className="border-b border-[#e5ecee] px-5 py-4">
              <h2 className="text-base font-bold text-[#12232b] flex items-center gap-2"><TrendingUp className="size-4 text-[#0d9488]"/> Distribuição por plano</h2>
              <p className="text-xs text-[#82939a] mt-1">Escolas em cada plano</p>
            </div>
            <div className="p-5 space-y-6">
              {metricas.distribuicaoPlanos.map((dist) => (
                <div key={dist.plano}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-semibold text-[#30454e] capitalize">{dist.plano}</span>
                    <span className="text-[#6b7d86]">{dist.total} escolas · {formatarMoeda(dist.mrrCentavos)}</span>
                  </div>
                  <div className="h-2 w-full bg-[#e5ecee] rounded-full overflow-hidden">
                    <div className="h-full bg-[#0d9488]" style={{ width: `${(dist.total / metricas.escolasTotal) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="m-5 mt-0 p-4 rounded-xl bg-[#f0fdfa] border border-[#ccfbf1]">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#0f766e]">Receita Recorrente</p>
              <p className="text-2xl font-bold text-[#0f766e] mt-1">{formatarMoeda(metricas.mrrCentavos)}</p>
              <p className="text-xs text-[#0f766e]/80 mt-0.5">{formatarMoeda(metricas.mrrCentavos * 12)} por ano</p>
            </div>
          </Panel>
        </div>
      </main>
    </AdminShell>
  )
}
