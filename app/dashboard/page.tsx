'use client'

import { Users, FileText, WalletCards, Bell, ArrowRight, TrendingUp, Plus, Send, Receipt, Video } from 'lucide-react'
import Link from 'next/link'
import { AdminShell, SectionHeading, Panel, ActionButton } from '@/components/admin-shell'

const metrics = [
  { label: 'Total de alunos', value: '342', change: '+12 este mês', icon: Users, color: '#0d9488' },
  { label: 'Matrículas pendentes', value: '18', change: '5 aguardando análise', icon: FileText, color: '#d97706' },
  { label: 'Faturas em aberto', value: '47', change: 'R$ 38.420,00', icon: WalletCards, color: '#3b82f6' },
  { label: 'Comunicados não lidos', value: '6', change: '3 urgentes', icon: Bell, color: '#dc2626' },
]

const matriculas = [
  { aluno: 'Lucas Oliveira', serie: '9º Ano A', responsavel: 'Mariana Oliveira', status: 'Aprovado', data: '12/10/2026' },
  { aluno: 'Sofia Almeida', serie: '4º Ano B', responsavel: 'Carlos Almeida', status: 'Em análise', data: '11/10/2026' },
  { aluno: 'Pedro Santos', serie: '1º Ano EM', responsavel: 'Juliana Santos', status: 'Matriculado', data: '10/10/2026' },
  { aluno: 'Isabela Costa', serie: 'Educação Infantil', responsavel: 'Roberto Costa', status: 'Entrevista', data: '09/10/2026' },
  { aluno: 'Rafael Lima', serie: '6º Ano C', responsavel: 'Patrícia Lima', status: 'Inscrito', data: '08/10/2026' },
  { aluno: 'Helena Ferreira', serie: '2º Ano EM', responsavel: 'André Ferreira', status: 'Aprovado', data: '07/10/2026' },
]

const statusStyles: Record<string, string> = {
  'Inscrito': 'bg-[#e5ecee] text-[#5e7a94]',
  'Em análise': 'bg-[#fef3c7] text-[#92400e]',
  'Entrevista': 'bg-[#dbeafe] text-[#1e40af]',
  'Aprovado': 'bg-[#ccfbf1] text-[#0f766e]',
  'Matriculado': 'bg-[#d1fae5] text-[#065f46]',
  'Cancelado': 'bg-[#fee2e2] text-[#991b1b]',
}

const atalhos = [
  { label: 'Nova matrícula', icon: Plus, href: '/matricula' },
  { label: 'Enviar comunicado', icon: Send, href: '#' },
  { label: 'Gerar fatura', icon: Receipt, href: '#' },
  { label: 'Publicar videoaula', icon: Video, href: '/eduflix' },
]

export default function DashboardPage() {
  return (
    <AdminShell mode="school" active="Visão geral">
      <main className="px-5 py-8 lg:px-8">
        <SectionHeading
          eyebrow="Colégio Horizonte"
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
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">
                {m.label}
              </p>
              <p className="mt-1 text-3xl font-bold tracking-[-.03em] text-[#12232b]">
                {m.value}
              </p>
              <p className="mt-1 text-xs text-[#82939a]">{m.change}</p>
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
              <span className="flex-1 text-sm font-semibold text-[#30454e] group-hover:text-[#0f766e]">
                {a.label}
              </span>
              <ArrowRight className="size-4 text-[#a0afb4] group-hover:text-[#0d9488]" />
            </Link>
          ))}
        </div>

        <Panel className="mt-8">
          <div className="flex items-center justify-between border-b border-[#e5ecee] px-5 py-4">
            <div>
              <h2 className="text-base font-bold text-[#12232b]">Matrículas recentes</h2>
              <p className="mt-0.5 text-xs text-[#82939a]">
                Últimas inscrições recebidas pela escola
              </p>
            </div>
            <ActionButton variant="secondary">Ver todas</ActionButton>
          </div>
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
                {matriculas.map((m, i) => (
                  <tr key={i} className="border-b border-[#f0f4f5] transition hover:bg-[#fafcfc]">
                    <td className="px-5 py-3.5 text-sm font-semibold text-[#243942]">{m.aluno}</td>
                    <td className="px-5 py-3.5 text-sm text-[#4d626c]">{m.serie}</td>
                    <td className="px-5 py-3.5 text-sm text-[#4d626c]">{m.responsavel}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyles[m.status]}`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-[#82939a]">{m.data}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </main>
    </AdminShell>
  )
}