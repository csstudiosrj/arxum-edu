'use client'

import { useState } from 'react'
import { Search, Download, Send, TrendingUp, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { AdminShell, SectionHeading, Panel, ActionButton } from '@/components/admin-shell'

const faturas = [
  { id: '#FAT-2026-1201', aluno: 'Lucas Oliveira', responsavel: 'Mariana Oliveira', descricao: 'Mensalidade Outubro', vencimento: '10/10/2026', valor: 'R$ 1.250,00', status: 'Pago' },
  { id: '#FAT-2026-1202', aluno: 'Sofia Almeida', responsavel: 'Carlos Almeida', descricao: 'Mensalidade Outubro', vencimento: '10/10/2026', valor: 'R$ 980,00', status: 'Pago' },
  { id: '#FAT-2026-1203', aluno: 'Pedro Santos', responsavel: 'Juliana Santos', descricao: 'Mensalidade Outubro', vencimento: '10/10/2026', valor: 'R$ 1.450,00', status: 'Em aberto' },
  { id: '#FAT-2026-1204', aluno: 'Isabela Costa', responsavel: 'Roberto Costa', descricao: 'Mensalidade Outubro', vencimento: '10/10/2026', valor: 'R$ 890,00', status: 'Vencido' },
  { id: '#FAT-2026-1205', aluno: 'Rafael Lima', responsavel: 'Patrícia Lima', descricao: 'Mensalidade Outubro', vencimento: '10/10/2026', valor: 'R$ 1.100,00', status: 'Pago' },
  { id: '#FAT-2026-1206', aluno: 'Helena Ferreira', responsavel: 'André Ferreira', descricao: 'Mensalidade Outubro', vencimento: '10/10/2026', valor: 'R$ 1.380,00', status: 'Em aberto' },
  { id: '#FAT-2026-1207', aluno: 'Beatriz Rocha', responsavel: 'Sandra Rocha', descricao: 'Mensalidade Outubro', vencimento: '10/10/2026', valor: 'R$ 920,00', status: 'Vencido' },
  { id: '#FAT-2026-1208', aluno: 'Gabriel Martins', responsavel: 'Felipe Martins', descricao: 'Mensalidade Outubro', vencimento: '10/10/2026', valor: 'R$ 1.180,00', status: 'Pago' },
]

const statusStyles: Record<string, string> = {
  'Pago': 'bg-[#d1fae5] text-[#065f46]',
  'Em aberto': 'bg-[#dbeafe] text-[#1e40af]',
  'Vencido': 'bg-[#fee2e2] text-[#991b1b]',
}

const filtros = ['Todas', 'Pago', 'Em aberto', 'Vencido']

export default function FinanceiroPage() {
  const [filtro, setFiltro] = useState('Todas')
  const [busca, setBusca] = useState('')

  const filtradas = faturas.filter((f) => {
    const matchFiltro = filtro === 'Todas' || f.status === filtro
    const matchBusca =
      busca === '' ||
      f.aluno.toLowerCase().includes(busca.toLowerCase()) ||
      f.responsavel.toLowerCase().includes(busca.toLowerCase()) ||
      f.id.toLowerCase().includes(busca.toLowerCase())
    return matchFiltro && matchBusca
  })

  return (
    <AdminShell mode="school" active="Financeiro">
      <main className="px-5 py-8 lg:px-8">
        <SectionHeading
          eyebrow="Financeiro"
          title="Gestão financeira"
          description="Acompanhe faturamento, inadimplência e repasses da escola."
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Receita do mês', value: 'R$ 428.340', icon: TrendingUp, color: '#0d9488', sub: '+8% vs. mês anterior' },
            { label: 'A receber', value: 'R$ 38.420', icon: Clock, color: '#3b82f6', sub: '47 faturas em aberto' },
            { label: 'Inadimplência', value: 'R$ 12.180', icon: AlertCircle, color: '#dc2626', sub: '3,1% do faturamento' },
            { label: 'Recebido', value: 'R$ 377.740', icon: CheckCircle2, color: '#065f46', sub: '88% das faturas' },
          ].map((m) => (
            <Panel key={m.label} className="p-5">
              <div className="flex items-start justify-between">
                <div className="grid size-10 place-items-center rounded-lg" style={{ backgroundColor: `${m.color}15`, color: m.color }}>
                  <m.icon className="size-5" />
                </div>
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">
                {m.label}
              </p>
              <p className="mt-1 text-2xl font-bold tracking-[-.03em]" style={{ color: m.color }}>
                {m.value}
              </p>
              <p className="mt-1 text-xs text-[#82939a]">{m.sub}</p>
            </Panel>
          ))}
        </div>

        <Panel className="mt-8">
          <div className="border-b border-[#e5ecee] px-5 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-1.5">
                {filtros.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFiltro(f)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      filtro === f ? 'bg-[#ccfbf1] text-[#0f766e]' : 'text-[#6b7d86] hover:bg-[#f1f5f6]'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 lg:w-64">
                  <Search className="size-4 text-[#9aaab0]" />
                  <input
                    type="text"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar fatura"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-[#a0afb4]"
                  />
                </div>
                <ActionButton variant="secondary">
                  <Download className="mr-1.5 inline size-4" />
                  Exportar
                </ActionButton>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e5ecee] bg-[#fafcfc]">
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Fatura</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Aluno</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Descrição</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Vencimento</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Valor</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Status</th>
                  <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map((f) => (
                  <tr key={f.id} className="border-b border-[#f0f4f5] transition hover:bg-[#fafcfc]">
                    <td className="px-5 py-3.5 font-mono text-xs text-[#536871]">{f.id}</td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-[#243942]">
                      <div>{f.aluno}</div>
                      <div className="text-xs font-normal text-[#82939a]">{f.responsavel}</div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-[#4d626c]">{f.descricao}</td>
                    <td className="px-5 py-3.5 text-sm text-[#4d626c]">{f.vencimento}</td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-[#243942]">{f.valor}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyles[f.status]}`}>
                        {f.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1">
                        <button className="rounded-lg p-1.5 text-[#6b7d86] hover:bg-[#e5ecee]" title="Baixar fatura">
                          <Download className="size-4" />
                        </button>
                        {f.status !== 'Pago' && (
                          <button className="rounded-lg p-1.5 text-[#0d9488] hover:bg-[#ccfbf1]" title="Enviar cobrança">
                            <Send className="size-4" />
                          </button>
                        )}
                      </div>
                    </td>
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