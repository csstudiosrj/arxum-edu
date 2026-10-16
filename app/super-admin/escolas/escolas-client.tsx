'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Building2, Users, FileText, DollarSign, Inbox } from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import { atualizarPlanoEscola, type EscolaSuper } from '../actions'

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

const planos = ['semente', 'raiz', 'copa', 'rede']

function formatarMoeda(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function formatarData(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR')
  } catch {
    return '—'
  }
}

export function EscolasClient({ escolas }: { escolas: EscolaSuper[] }) {
  const router = useRouter()
  const [busca, setBusca] = useState('')
  const [filtroPlano, setFiltroPlano] = useState('todos')
  const [salvando, setSalvando] = useState<string | null>(null)

  const filtradas = escolas.filter((e) => {
    const matchPlano = filtroPlano === 'todos' || e.plano === filtroPlano
    const termo = busca.toLowerCase()
    const matchBusca = busca === '' || e.nome.toLowerCase().includes(termo) || e.slug.toLowerCase().includes(termo)
    return matchPlano && matchBusca
  })

  async function handleMudarPlano(escolaId: string, plano: string) {
    setSalvando(escolaId)
    await atualizarPlanoEscola(escolaId, plano)
    setSalvando(null)
    router.refresh()
  }

  const totalAlunos = escolas.reduce((s, e) => s + e.alunos, 0)
  const mrrTotal = escolas.reduce((s, e) => s + e.mrrCentavos, 0)

  return (
    <AdminShell mode="super" active="Escolas">
      <main className="px-5 py-8 lg:px-8">
        <SectionHeading
          eyebrow="ARXUM Admin"
          title="Escolas"
          description="Todas as escolas clientes da plataforma."
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Panel className="flex items-center gap-4 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#ccfbf1] text-[#0d9488]">
              <Building2 className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Escolas</p>
              <p className="text-2xl font-bold tracking-[-.03em] text-[#0d9488]">{escolas.length}</p>
            </div>
          </Panel>
          <Panel className="flex items-center gap-4 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#dbeafe] text-[#3b82f6]">
              <Users className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Alunos totais</p>
              <p className="text-2xl font-bold tracking-[-.03em] text-[#3b82f6]">{totalAlunos.toLocaleString('pt-BR')}</p>
            </div>
          </Panel>
          <Panel className="flex items-center gap-4 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#d1fae5] text-[#065f46]">
              <DollarSign className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">MRR total</p>
              <p className="text-2xl font-bold tracking-[-.03em] text-[#065f46]">{formatarMoeda(mrrTotal)}</p>
            </div>
          </Panel>
        </div>

        <Panel className="mt-8">
          <div className="border-b border-[#e5ecee] px-5 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => setFiltroPlano('todos')} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${filtroPlano === 'todos' ? 'bg-[#ccfbf1] text-[#0f766e]' : 'text-[#6b7d86] hover:bg-[#f1f5f6]'}`}>Todas</button>
                {planos.map((p) => (
                  <button key={p} onClick={() => setFiltroPlano(p)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${filtroPlano === p ? 'bg-[#ccfbf1] text-[#0f766e]' : 'text-[#6b7d86] hover:bg-[#f1f5f6]'}`}>
                    {planoLabels[p]}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 lg:w-64">
                <Search className="size-4 text-[#9aaab0]" />
                <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar escola" className="w-full bg-transparent text-sm outline-none placeholder:text-[#a0afb4]" />
              </div>
            </div>
          </div>

          {escolas.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <div className="grid size-14 place-items-center rounded-full bg-[#ccfbf1] text-[#0d9488]">
                <Inbox className="size-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-[#12232b]">Nenhuma escola ainda</h3>
              <p className="mt-1 max-w-sm text-sm text-[#82939a]">Quando uma escola se cadastrar, ela aparecerá aqui.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#e5ecee] bg-[#fafcfc]">
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Escola</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Plano</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Alunos</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">MRR</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Cadastro</th>
                    <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-sm text-[#82939a]">Nenhuma escola encontrada.</td>
                    </tr>
                  ) : (
                    filtradas.map((e) => (
                      <tr key={e.id} className="border-b border-[#f0f4f5] transition hover:bg-[#fafcfc]">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="grid size-9 place-items-center rounded-lg bg-[#f0f4f5] text-[#536871]">
                              <Building2 className="size-4" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-[#243942]">{e.nome}</div>
                              <div className="text-xs text-[#82939a]">{e.slug}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <select
                            value={e.plano}
                            onChange={(ev) => handleMudarPlano(e.id, ev.target.value)}
                            disabled={salvando === e.id}
                            className="rounded-lg border px-2 py-1 text-xs font-semibold outline-none focus:border-[#0d9488] disabled:opacity-50"
                            style={{ backgroundColor: `${planoCores[e.plano]}15`, color: planoCores[e.plano], borderColor: `${planoCores[e.plano]}40` }}
                          >
                            {planos.map((p) => <option key={p} value={p}>{planoLabels[p]}</option>)}
                          </select>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-[#4d626c]">{e.alunos}</td>
                        <td className="px-5 py-3.5 text-sm font-semibold text-[#243942]">{formatarMoeda(e.mrrCentavos)}</td>
                        <td className="px-5 py-3.5 text-sm text-[#82939a]">{formatarData(e.criado_em)}</td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex justify-end gap-1">
                            <button className="rounded-lg p-1.5 text-[#6b7d86] hover:bg-[#e5ecee]" title="Ver alunos">
                              <Users className="size-4" />
                            </button>
                            <button className="rounded-lg p-1.5 text-[#6b7d86] hover:bg-[#e5ecee]" title="Ver faturas">
                              <FileText className="size-4" />
                            </button>
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