'use client'

import { useState } from 'react'
import { Search, Mail, Phone, Users, Inbox, Eye } from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import type { Aluno } from './actions'

function iniciais(nome: string): string {
  const partes = nome.trim().split(' ')
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

function formatarData(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR')
  } catch {
    return '—'
  }
}

export function AlunosClient({ alunos }: { alunos: Aluno[] }) {
  const [busca, setBusca] = useState('')

  const filtrados = alunos.filter((a) => {
    const termo = busca.toLowerCase()
    return (
      busca === '' ||
      a.nome.toLowerCase().includes(termo) ||
      a.responsavel_nome.toLowerCase().includes(termo) ||
      (a.serie || '').toLowerCase().includes(termo)
    )
  })

  const ativos = alunos.filter((a) => a.status === 'ativo').length

  return (
    <AdminShell mode="school" active="Alunos">
      <main className="px-5 py-8 lg:px-8">
        <SectionHeading
          eyebrow="Secretaria"
          title="Alunos"
          description="Gerencie os alunos matriculados na escola."
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Panel className="flex items-center gap-4 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#ccfbf1] text-[#0d9488]">
              <Users className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Alunos ativos</p>
              <p className="text-2xl font-bold tracking-[-.03em] text-[#12232b]">{ativos}</p>
            </div>
          </Panel>
          <Panel className="flex items-center gap-4 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#dbeafe] text-[#3b82f6]">
              <Users className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Total cadastrado</p>
              <p className="text-2xl font-bold tracking-[-.03em] text-[#12232b]">{alunos.length}</p>
            </div>
          </Panel>
          <Panel className="flex items-center gap-4 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#fef3c7] text-[#92400e]">
              <Users className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Turmas</p>
              <p className="text-2xl font-bold tracking-[-.03em] text-[#12232b]">{new Set(alunos.map((a) => a.serie)).size}</p>
            </div>
          </Panel>
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

          {alunos.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <div className="grid size-14 place-items-center rounded-full bg-[#ccfbf1] text-[#0d9488]">
                <Inbox className="size-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-[#12232b]">Nenhum aluno cadastrado ainda</h3>
              <p className="mt-1 max-w-sm text-sm text-[#82939a]">
                Quando uma matrícula for efetivada, o aluno aparecerá automaticamente aqui.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#e5ecee] bg-[#fafcfc]">
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Aluno</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Série / Turma</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Turno</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Responsável</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Status</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Matriculado em</th>
                    <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-sm text-[#82939a]">
                        Nenhum aluno encontrado com esses filtros.
                      </td>
                    </tr>
                  ) : (
                    filtrados.map((a) => (
                      <tr key={a.id} className="border-b border-[#f0f4f5] transition hover:bg-[#fafcfc]">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="grid size-9 place-items-center rounded-full bg-[#ccfbf1] text-xs font-bold text-[#0f766e]">
                              {iniciais(a.nome)}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-[#243942]">{a.nome}</div>
                              <div className="text-xs text-[#82939a]">{a.responsavel_email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-[#4d626c]">{a.serie || '—'}</td>
                        <td className="px-5 py-3.5 text-sm text-[#4d626c]">{a.turno || '—'}</td>
                        <td className="px-5 py-3.5 text-sm text-[#4d626c]">
                          <div>{a.responsavel_nome}</div>
                          <div className="text-xs text-[#82939a]">{a.responsavel_telefone || '—'}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            a.status === 'ativo' ? 'bg-[#d1fae5] text-[#065f46]' : 'bg-[#e5ecee] text-[#5e7a94]'
                          }`}>
                            {a.status === 'ativo' ? 'Ativo' : a.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-[#82939a]">{formatarData(a.criado_em)}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex justify-end gap-1">
                            <button className="rounded-lg p-1.5 text-[#6b7d86] hover:bg-[#e5ecee]" title="Ver detalhes">
                              <Eye className="size-4" />
                            </button>
                            <a href={`mailto:${a.responsavel_email}`} className="rounded-lg p-1.5 text-[#6b7d86] hover:bg-[#e5ecee]" title="Enviar e-mail">
                              <Mail className="size-4" />
                            </a>
                            {a.responsavel_telefone && (
                              <a href={`tel:${a.responsavel_telefone}`} className="rounded-lg p-1.5 text-[#6b7d86] hover:bg-[#e5ecee]" title="Ligar">
                                <Phone className="size-4" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </main>
    </AdminShell>
  )
}