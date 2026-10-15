'use client'

import { useState } from 'react'
import { Search, Eye, Mail, Phone, Users } from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'

const alunos = [
  { nome: 'Lucas Oliveira', serie: '9º Ano A', turno: 'Manhã', responsavel: 'Mariana Oliveira', telefone: '(21) 98765-4321', email: 'mariana@email.com', status: 'Ativo', iniciais: 'LO' },
  { nome: 'Sofia Almeida', serie: '4º Ano B', turno: 'Tarde', responsavel: 'Carlos Almeida', telefone: '(21) 99123-4567', email: 'carlos@email.com', status: 'Ativo', iniciais: 'SA' },
  { nome: 'Pedro Santos', serie: '1º Ano EM', turno: 'Manhã', responsavel: 'Juliana Santos', telefone: '(21) 99876-1234', email: 'juliana@email.com', status: 'Ativo', iniciais: 'PS' },
  { nome: 'Isabela Costa', serie: 'Educação Infantil', turno: 'Integral', responsavel: 'Roberto Costa', telefone: '(21) 98765-9876', email: 'roberto@email.com', status: 'Ativo', iniciais: 'IC' },
  { nome: 'Rafael Lima', serie: '6º Ano C', turno: 'Manhã', responsavel: 'Patrícia Lima', telefone: '(21) 99012-3456', email: 'patricia@email.com', status: 'Ativo', iniciais: 'RL' },
  { nome: 'Helena Ferreira', serie: '2º Ano EM', turno: 'Manhã', responsavel: 'André Ferreira', telefone: '(21) 98567-8901', email: 'andre@email.com', status: 'Ativo', iniciais: 'HF' },
  { nome: 'Beatriz Rocha', serie: '3º Ano B', turno: 'Tarde', responsavel: 'Sandra Rocha', telefone: '(21) 99234-5678', email: 'sandra@email.com', status: 'Ativo', iniciais: 'BR' },
  { nome: 'Gabriel Martins', serie: '7º Ano A', turno: 'Manhã', responsavel: 'Felipe Martins', telefone: '(21) 98765-1234', email: 'felipe@email.com', status: 'Transferido', iniciais: 'GM' },
]

export default function AlunosPage() {
  const [busca, setBusca] = useState('')

  const filtrados = alunos.filter(
    (a) =>
      busca === '' ||
      a.nome.toLowerCase().includes(busca.toLowerCase()) ||
      a.responsavel.toLowerCase().includes(busca.toLowerCase()) ||
      a.serie.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <AdminShell mode="school" active="Alunos">
      <main className="px-5 py-8 lg:px-8">
        <SectionHeading
          eyebrow="Secretaria"
          title="Alunos"
          description="Gerencie os alunos matriculados na escola."
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Alunos ativos', value: alunos.filter((a) => a.status === 'Ativo').length, icon: Users },
            { label: 'Turmas', value: 24, icon: Users },
            { label: 'Novos este mês', value: 12, icon: Users },
          ].map((m) => (
            <Panel key={m.label} className="flex items-center gap-4 p-5">
              <div className="grid size-10 place-items-center rounded-lg bg-[#ccfbf1] text-[#0d9488]">
                <m.icon className="size-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">
                  {m.label}
                </p>
                <p className="text-2xl font-bold tracking-[-.03em] text-[#12232b]">{m.value}</p>
              </div>
            </Panel>
          ))}
        </div>

        <Panel className="mt-8">
          <div className="border-b border-[#e5ecee] px-5 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <h2 className="text-base font-bold text-[#12232b]">Todos os alunos</h2>
              <div className="flex items-center gap-2 rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 lg:w-72">
                <Search className="size-4 text-[#9aaab0]" />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por nome, série ou responsável"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-[#a0afb4]"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e5ecee] bg-[#fafcfc]">
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Aluno</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Série / Turma</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Turno</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Responsável</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Status</th>
                  <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((a) => (
                  <tr key={a.nome} className="border-b border-[#f0f4f5] transition hover:bg-[#fafcfc]">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="grid size-9 place-items-center rounded-full bg-[#ccfbf1] text-xs font-bold text-[#0f766e]">
                          {a.iniciais}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-[#243942]">{a.nome}</div>
                          <div className="text-xs text-[#82939a]">{a.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-[#4d626c]">{a.serie}</td>
                    <td className="px-5 py-3.5 text-sm text-[#4d626c]">{a.turno}</td>
                    <td className="px-5 py-3.5 text-sm text-[#4d626c]">
                      <div>{a.responsavel}</div>
                      <div className="text-xs text-[#82939a]">{a.telefone}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          a.status === 'Ativo' ? 'bg-[#d1fae5] text-[#065f46]' : 'bg-[#e5ecee] text-[#5e7a94]'
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1">
                        <button className="rounded-lg p-1.5 text-[#6b7d86] hover:bg-[#e5ecee]" title="Ver detalhes">
                          <Eye className="size-4" />
                        </button>
                        <button className="rounded-lg p-1.5 text-[#6b7d86] hover:bg-[#e5ecee]" title="Enviar e-mail">
                          <Mail className="size-4" />
                        </button>
                        <button className="rounded-lg p-1.5 text-[#6b7d86] hover:bg-[#e5ecee]" title="Ligar">
                          <Phone className="size-4" />
                        </button>
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