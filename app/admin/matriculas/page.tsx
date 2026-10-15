'use client'

import { useState } from 'react'
import { Search, Eye, Check, X } from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'

const inscricoes = [
  { id: '#2026-0847', aluno: 'Lucas Oliveira', serie: '9º Ano A', responsavel: 'Mariana Oliveira', telefone: '(21) 98765-4321', status: 'Aprovado', data: '12/10/2026' },
  { id: '#2026-0846', aluno: 'Sofia Almeida', serie: '4º Ano B', responsavel: 'Carlos Almeida', telefone: '(21) 99123-4567', status: 'Em análise', data: '11/10/2026' },
  { id: '#2026-0845', aluno: 'Pedro Santos', serie: '1º Ano EM', responsavel: 'Juliana Santos', telefone: '(21) 99876-1234', status: 'Matriculado', data: '10/10/2026' },
  { id: '#2026-0844', aluno: 'Isabela Costa', serie: 'Educação Infantil', responsavel: 'Roberto Costa', telefone: '(21) 98765-9876', status: 'Entrevista', data: '09/10/2026' },
  { id: '#2026-0843', aluno: 'Rafael Lima', serie: '6º Ano C', responsavel: 'Patrícia Lima', telefone: '(21) 99012-3456', status: 'Inscrito', data: '08/10/2026' },
  { id: '#2026-0842', aluno: 'Helena Ferreira', serie: '2º Ano EM', responsavel: 'André Ferreira', telefone: '(21) 98567-8901', status: 'Aprovado', data: '07/10/2026' },
  { id: '#2026-0841', aluno: 'Beatriz Rocha', serie: '3º Ano B', responsavel: 'Sandra Rocha', telefone: '(21) 99234-5678', status: 'Em análise', data: '06/10/2026' },
  { id: '#2026-0840', aluno: 'Gabriel Martins', serie: '7º Ano A', responsavel: 'Felipe Martins', telefone: '(21) 98765-1234', status: 'Cancelado', data: '05/10/2026' },
]

const statusStyles: Record<string, string> = {
  'Inscrito': 'bg-[#e5ecee] text-[#5e7a94]',
  'Em análise': 'bg-[#fef3c7] text-[#92400e]',
  'Entrevista': 'bg-[#dbeafe] text-[#1e40af]',
  'Aprovado': 'bg-[#ccfbf1] text-[#0f766e]',
  'Matriculado': 'bg-[#d1fae5] text-[#065f46]',
  'Cancelado': 'bg-[#fee2e2] text-[#991b1b]',
}

const filtros = ['Todas', 'Inscrito', 'Em análise', 'Entrevista', 'Aprovado', 'Matriculado', 'Cancelado']

export default function MatriculasPage() {
  const [filtro, setFiltro] = useState('Todas')
  const [busca, setBusca] = useState('')

  const filtradas = inscricoes.filter((i) => {
    const matchFiltro = filtro === 'Todas' || i.status === filtro
    const matchBusca =
      busca === '' ||
      i.aluno.toLowerCase().includes(busca.toLowerCase()) ||
      i.responsavel.toLowerCase().includes(busca.toLowerCase()) ||
      i.id.toLowerCase().includes(busca.toLowerCase())
    return matchFiltro && matchBusca
  })

  const contadores = {
    total: inscricoes.length,
    pendentes: inscricoes.filter((i) => ['Inscrito', 'Em análise', 'Entrevista'].includes(i.status)).length,
    aprovadas: inscricoes.filter((i) => i.status === 'Aprovado').length,
    matriculadas: inscricoes.filter((i) => i.status === 'Matriculado').length,
  }

  return (
    <AdminShell mode="school" active="Matrículas">
      <main className="px-5 py-8 lg:px-8">
        <SectionHeading
          eyebrow="Secretaria"
          title="Matrículas"
          description="Acompanhe as inscrições recebidas e aprove conforme as políticas internas da escola."
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total de inscrições', value: contadores.total, color: '#0d9488' },
            { label: 'Aguardando análise', value: contadores.pendentes, color: '#d97706' },
            { label: 'Aprovadas', value: contadores.aprovadas, color: '#0f766e' },
            { label: 'Efetivadas', value: contadores.matriculadas, color: '#065f46' },
          ].map((m) => (
            <Panel key={m.label} className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">
                {m.label}
              </p>
              <p className="mt-2 text-3xl font-bold tracking-[-.03em]" style={{ color: m.color }}>
                {m.value}
              </p>
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
              <div className="flex items-center gap-2 rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 lg:w-72">
                <Search className="size-4 text-[#9aaab0]" />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar aluno, responsável ou protocolo"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-[#a0afb4]"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e5ecee] bg-[#fafcfc]">
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Protocolo</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Aluno</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Série</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Responsável</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Status</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Data</th>
                  <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-sm text-[#82939a]">
                      Nenhuma inscrição encontrada.
                    </td>
                  </tr>
                ) : (
                  filtradas.map((m) => (
                    <tr key={m.id} className="border-b border-[#f0f4f5] transition hover:bg-[#fafcfc]">
                      <td className="px-5 py-3.5 font-mono text-xs text-[#536871]">{m.id}</td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-[#243942]">{m.aluno}</td>
                      <td className="px-5 py-3.5 text-sm text-[#4d626c]">{m.serie}</td>
                      <td className="px-5 py-3.5 text-sm text-[#4d626c]">
                        <div>{m.responsavel}</div>
                        <div className="text-xs text-[#82939a]">{m.telefone}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyles[m.status]}`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-[#82939a]">{m.data}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-1">
                          <button className="rounded-lg p-1.5 text-[#6b7d86] hover:bg-[#e5ecee]" title="Ver detalhes">
                            <Eye className="size-4" />
                          </button>
                          {['Inscrito', 'Em análise', 'Entrevista'].includes(m.status) && (
                            <>
                              <button className="rounded-lg p-1.5 text-[#0d9488] hover:bg-[#ccfbf1]" title="Aprovar">
                                <Check className="size-4" />
                              </button>
                              <button className="rounded-lg p-1.5 text-[#dc2626] hover:bg-[#fee2e2]" title="Reprovar">
                                <X className="size-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </main>
    </AdminShell>
  )
}