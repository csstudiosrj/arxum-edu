'use client'

import Link from 'next/link'
import { Users, FileText, WalletCards, Bell, ArrowRight, TrendingUp, Plus, Send, Receipt, Video, Inbox } from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import type { DashboardData } from './actions'

const statusStyles: Record<string, string> = {
  inscrito: 'bg-[#e5ecee] text-[#5e7a94]',
  em_analise: 'bg-[#fef3c7] text-[#92400e]',
  entrevista: 'bg-[#dbeafe] text-[#1e40af]',
  aprovado: 'bg-[#ccfbf1] text-[#0f766e]',
  matriculado: 'bg-[#d1fae5] text-[#065f46]',
  lista_espera: 'bg-[#fef3c7] text-[#92400e]',
  nao_aprovado: 'bg-[#fee2e2] text-[#991b1b]',
  cancelado: 'bg-[#e5ecee] text-[#5e7a94]',
}

const statusLabels: Record<string, string> = {
  inscrito: 'Inscrito',
  em_analise: 'Em análise',
  entrevista: 'Entrevista',
  aprovado: 'Aprovado',
  matriculado: 'Matriculado',
  lista_espera: 'Lista de espera',
  nao_aprovado: 'Não aprovado',
  cancelado: 'Cancelado',
}

const atalhos = [
  { label: 'Nova matrícula', icon: Plus, href: '/matricula' },
  { label: 'Enviar comunicado', icon: Send, href: '/admin/comunicacao' },
  { label: 'Gerar fatura', icon: Receipt, href: '/admin/financeiro' },
  { label: 'Publicar videoaula', icon: Video, href: '/admin/eduflix' },
]

function formatarData(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR')
  } catch {
    return '—'
  }
}

export function DashboardClient({ data }: { data: DashboardData }) {
  const metrics = [
    { label: 'Total de alunos', value: String(data.totalAlunos), sub: 'Alunos ativos', icon: Users, color: '#0d9488' },
    { label: 'Matrículas pendentes', value: String(data.matriculasPendentes), sub: 'Aguardando análise', icon: FileText, color: '#d97706' },
    { label: 'Faturas em aberto', value: String(data.faturasEmAberto), sub: 'A receber', icon: WalletCards, color: '#3b82f6' },
    { label: 'Comunicados não lidos', value: String(data.comunicadosNaoLidos), sub: 'Ativos na escola', icon: Bell, color: '#dc2626' },
  ]

  return (
    <AdminShell mode="school" active="Visão geral">
      <main className="px-5 py-8 lg:px-8">
        <SectionHeading
          eyebrow={data.escolaNome}
          title="Visão geral"
          description="Acompanhe os principais indicadores da sua escola."
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m) => (
            <Panel key={m.label} className="p-5">
              <div className="flex items-start justify-between">
                <div className="grid size-10 place-items-center rounded-lg" style={{ backgroundColor: `${m.color}15`, color: m.color }}>
                  <m.icon className="size-5" />
                </div>
                <TrendingUp className="size-4 text-[#a0afb4]" />
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">{m.label}</p>
              <p className="mt-1 text-3xl font-bold tracking-[-.03em] text-[#12232b]">{m.value}</p>
              <p className="mt-1 text-xs text-[#82939a]">{m.sub}</p>
            </Panel>
          ))}
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-4">
          {atalhos.map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className="group flex items-center gap-3 rounded-xl border border-[#dce5e8] bg-white px-4 py-3.5 transition hover:border-[#0d9488] hover:bg-[#f9fdfc]"
            >
              <div className="grid size-9 place-items-center rounded-lg bg-[#ccfbf1] text-[#0d9488]">
                <a.icon className="size-[18px]" />
              </div>
              <span className="flex-1 text-sm font-semibold text-[#30454e] group-hover:text-[#0f766e]">{a.label}</span>
              <ArrowRight className="size-4 text-[#a0afb4] group-hover:text-[#0d9488]" />
            </Link>
          ))}
        </div>

        <Panel className="mt-8">
          <div className="flex items-center justify-between border-b border-[#e5ecee] px-5 py-4">
            <div>
              <h2 className="text-base font-bold text-[#12232b]">Matrículas recentes</h2>
              <p className="mt-0.5 text-xs text-[#82939a]">Últimas inscrições recebidas pela escola</p>
            </div>
            <Link href="/admin/matriculas" className="rounded-lg border border-[#b8c9ce] bg-white px-3.5 py-2 text-sm font-semibold text-[#30454e] transition hover:border-[#0d9488] hover:text-[#0f766e]">
              Ver todas
            </Link>
          </div>

          {data.matriculasRecentes.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <div className="grid size-14 place-items-center rounded-full bg-[#ccfbf1] text-[#0d9488]">
                <Inbox className="size-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-[#12232b]">Nenhuma matrícula ainda</h3>
              <p className="mt-1 max-w-sm text-sm text-[#82939a]">
                Quando um responsável enviar uma matrícula, ela aparecerá aqui automaticamente.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#e5ecee] bg-[#fafcfc]">
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Aluno</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Série</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Responsável</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Status</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {data.matriculasRecentes.map((m) => (
                    <tr key={m.id} className="border-b border-[#f0f4f5] transition hover:bg-[#fafcfc]">
                      <td className="px-5 py-3.5 text-sm font-semibold text-[#243942]">{m.aluno_nome}</td>
                      <td className="px-5 py-3.5 text-sm text-[#4d626c]">{m.aluno_serie || '—'}</td>
                      <td className="px-5 py-3.5 text-sm text-[#4d626c]">{m.responsavel_nome}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyles[m.status] || statusStyles.inscrito}`}>
                          {statusLabels[m.status] || m.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-[#82939a]">{formatarData(m.criado_em)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </main>
    </AdminShell>
  )
}