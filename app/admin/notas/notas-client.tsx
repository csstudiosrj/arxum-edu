'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Search, BookOpen, Settings, Info, CheckCircle2, AlertCircle, 
  X, TrendingUp, User
} from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import { type Nota } from './actions'

const PERIODOS: Record<string, string> = {
  '1_bimestre': '1º Bimestre', '2_bimestre': '2º Bimestre', '3_bimestre': '3º Bimestre', '4_bimestre': '4º Bimestre',
  '1_semestre': '1º Semestre', '2_semestre': '2º Semestre',
}

export function NotasClient({
  notas,
  alunos,
  configAvaliacao,
}: {
  notas: Nota[]
  alunos: any[]
  configAvaliacao: { escala: string; recuperacao: string }
}) {
  const router = useRouter()
  const [busca, setBusca] = useState('')
  const [filtroPeriodo, setFiltroPeriodo] = useState('todos')
  const [detalheAberto, setDetalheAberto] = useState<Nota | null>(null)

  const filtradas = notas.filter(n => {
    const matchPeriodo = filtroPeriodo === 'todos' || n.periodo === filtroPeriodo
    const termo = busca.toLowerCase()
    const matchBusca = n.aluno_nome.toLowerCase().includes(termo) || n.disciplina.toLowerCase().includes(termo)
    return matchPeriodo && matchBusca
  })

  const getCorNota = (nota: number | null) => {
    if (nota === null) return 'text-[#82939a] bg-[#f0f4f5]'
    if (nota >= 7) return 'text-[#065f46] bg-[#d1fae5]'
    if (nota >= 5) return 'text-[#92400e] bg-[#fef3c7]'
    return 'text-[#991b1b] bg-[#fee2e2]'
  }

  return (
    <AdminShell mode="school" active="Notas">
      <main className="px-5 py-8 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mb-8">
          <SectionHeading
            eyebrow="Secretaria"
            title="Diário Oficial"
            description="Notas finais enviadas pelos professores. Clique para ver os detalhes do cálculo."
          />
          <Link
            href="/admin/configuracoes/avaliacao"
            className="inline-flex items-center gap-2 rounded-lg border border-[#b8c9ce] bg-white px-4 py-2 text-sm font-semibold text-[#30454e] transition hover:border-[var(--cor-primaria)]"
          >
            <Settings className="size-4" /> Configurar Avaliação
          </Link>
        </div>

        {/* Aviso sobre a regra atual */}
        <div className="mb-6 rounded-lg bg-[#fafcfc] border border-[#e5ecee] p-4 flex items-start gap-3">
          <Info className="size-5 text-[var(--cor-primaria)] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[#243942]">Regra atual da escola: <span className="text-[var(--cor-primaria)] uppercase">{configAvaliacao.escala}</span></p>
            <p className="text-xs text-[#82939a] mt-1">
              Recuperação: {configAvaliacao.recuperacao === 'substitutiva' ? 'A maior nota substitui a menor' : 'A média final é feita entre bimestre e recuperação'}.
            </p>
          </div>
        </div>

        <Panel>
          <div className="border-b border-[#e5ecee] px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setFiltroPeriodo('todos')} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${filtroPeriodo === 'todos' ? 'bg-[var(--cor-primaria)] text-white' : 'text-[#6b7d86] hover:bg-[#f1f5f6]'}`}>Todos</button>
              {Object.entries(PERIODOS).map(([k, v]) => (
                <button key={k} onClick={() => setFiltroPeriodo(k)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${filtroPeriodo === k ? 'bg-[var(--cor-primaria)] text-white' : 'text-[#6b7d86] hover:bg-[#f1f5f6]'}`}>{v}</button>
              ))}
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 lg:w-64">
              <Search className="size-4 text-[#9aaab0]" />
              <input type="text" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar aluno ou disciplina" className="w-full bg-transparent text-sm outline-none placeholder:text-[#a0afb4]" />
            </div>
          </div>

          {filtradas.length === 0 ? (
            <div className="p-12 text-center text-sm text-[#82939a] flex flex-col items-center">
              <BookOpen size={32} className="text-[#a0afb4] mb-3" />
              Nenhuma nota lançada no diário oficial ainda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#e5ecee] bg-[#fafcfc]">
                    <th className="p-4 text-xs font-bold text-[#6b7d86] uppercase tracking-wider">Aluno</th>
                    <th className="p-4 text-xs font-bold text-[#6b7d86] uppercase tracking-wider">Disciplina / Período</th>
                    <th className="p-4 text-xs font-bold text-[#6b7d86] uppercase tracking-wider text-center">Média Calculada</th>
                    <th className="p-4 text-xs font-bold text-[#6b7d86] uppercase tracking-wider text-center">Ajuste</th>
                    <th className="p-4 text-xs font-bold text-[#6b7d86] uppercase tracking-wider text-center">Nota Final</th>
                    <th className="p-4 text-xs font-bold text-[#6b7d86] uppercase tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f4f5]">
                  {filtradas.map(n => (
                    <tr key={n.id} className="hover:bg-[#fafcfc] transition">
                      <td className="p-4 text-sm font-semibold text-[#243942]">{n.aluno_nome}</td>
                      <td className="p-4 text-sm text-[#536871]">
                        {n.disciplina} <span className="text-[10px] text-[#82939a] ml-1 bg-[#f0f4f5] px-1.5 py-0.5 rounded">{PERIODOS[n.periodo] || n.periodo}</span>
                      </td>
                      <td className="p-4 text-center text-sm font-semibold text-[#536871]">
                        {n.nota !== null ? n.nota.toFixed(1) : '—'}
                      </td>
                      <td className="p-4 text-center text-sm font-semibold" style={{ color: (n.ajuste_manual || 0) !== 0 ? 'var(--cor-primaria)' : '#82939a' }}>
                        {(n.ajuste_manual || 0) > 0 ? `+${n.ajuste_manual}` : n.ajuste_manual === 0 ? '0.0' : n.ajuste_manual || '—'}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center justify-center rounded-lg px-3 py-1 text-sm font-bold ${getCorNota(n.nota_final)}`}>
                          {n.nota_final !== null ? n.nota_final.toFixed(1) : '—'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => setDetalheAberto(n)} className="rounded-lg border border-[#b8c9ce] bg-white px-3 py-1.5 text-xs font-semibold hover:border-[var(--cor-primaria)]">
                          Detalhes
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </main>

      {/* MODAL DETALHES DA NOTA */}
      {detalheAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#e5ecee] bg-[#fafcfc] px-5 py-4">
              <div>
                <h3 className="font-bold text-[#12232b]">Detalhes da Nota</h3>
                <p className="text-xs text-[#82939a]">{detalheAberto.aluno_nome} · {detalheAberto.disciplina}</p>
              </div>
              <button onClick={() => setDetalheAberto(null)} className="text-[#82939a] hover:text-[#12232b]"><X size={20}/></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-[#fafcfc] border border-[#e5ecee] p-3">
                <span className="text-xs font-bold text-[#536871] uppercase">Média Calculada (Notas Parciais)</span>
                <span className="text-lg font-bold text-[#243942]">{detalheAberto.nota?.toFixed(1) || '—'}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-[#f0fdfa] border border-[#ccfbf1] p-3">
                <span className="text-xs font-bold text-[#0f766e] uppercase">Ajuste Manual</span>
                <span className="text-lg font-bold text-[#0f766e]">
                  {(detalheAberto.ajuste_manual || 0) > 0 ? `+${detalheAberto.ajuste_manual}` : detalheAberto.ajuste_manual === 0 ? '0.0' : detalheAberto.ajuste_manual || '—'}
                </span>
              </div>
              {detalheAberto.justificativa_ajuste && (
                <div>
                  <p className="text-xs font-bold text-[#536871] uppercase mb-1">Justificativa do Ajuste</p>
                  <p className="text-sm text-[#243942] bg-[#fafcfc] p-3 rounded border border-[#e5ecee]">{detalheAberto.justificativa_ajuste}</p>
                </div>
              )}
              <div className="flex items-center justify-between rounded-lg bg-[#fef3c7] border border-[#fde68a] p-3 mt-4">
                <span className="text-xs font-bold text-[#92400e] uppercase">Nota Final (Boletim)</span>
                <span className="text-2xl font-bold text-[#92400e]">{detalheAberto.nota_final?.toFixed(1) || '—'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  )
}