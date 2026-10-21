import { redirect } from 'next/navigation'
import { getAlunoDoUsuario } from '@/lib/auth/aluno-atual'
import { getEscolaPorId } from '@/lib/auth/escola-atual'
import { marcaDaEscola } from '@/lib/auth/marca'
import { getMinhasNotas } from '../actions'
import { AlunoShell } from '../aluno-shell'

export const dynamic = 'force-dynamic'

const periodosLabel: Record<string, string> = {
  '1_bimestre': '1º Bim', '2_bimestre': '2º Bim', '3_bimestre': '3º Bim', '4_bimestre': '4º Bim',
  '1_semestre': '1º Sem', '2_semestre': '2º Sem',
}

// ── SEMÂNTICO: nota por faixa ───────────────────────────────────────
function corNota(nota: number | null): string {
  if (nota === null) return 'text-[#82939a]'
  if (nota >= 7) return 'text-[#065f46]'
  if (nota >= 5) return 'text-[#92400e]'
  return 'text-[#991b1b]'
}

export default async function BoletimAlunoPage() {
  const aluno = await getAlunoDoUsuario()
  if (!aluno) redirect('/login')

  const [notas, escola] = await Promise.all([
    getMinhasNotas(),
    getEscolaPorId(aluno.escola_id),
  ])

  const marca = escola ? marcaDaEscola(escola) : null
  const notasValidas = notas.filter((n) => n.nota !== null)
  const media = notasValidas.length > 0 ? notasValidas.reduce((s, n) => s + (n.nota || 0), 0) / notasValidas.length : null
  const totalFaltas = notas.reduce((s, n) => s + n.faltas, 0)
  const porDisciplina: Record<string, typeof notas> = {}
  notas.forEach((n) => {
    if (!porDisciplina[n.disciplina]) porDisciplina[n.disciplina] = []
    porDisciplina[n.disciplina].push(n)
  })

  return (
    <AlunoShell alunoNome={aluno.nome} alunoSerie={aluno.serie || 'Sem série'} escolaNome={aluno.escola_nome} escolaSlug={aluno.escola_slug} marca={marca}>
      <main className="px-5 py-8 lg:px-8">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[.18em]" style={{ color: 'var(--cor-primaria, #0d9488)' }}>Pedagógico</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-.03em] text-[#12232b]">Meu boletim</h1>
          <p className="mt-2 text-sm text-[#71838b]">Suas notas e faltas por disciplina e período.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-[#dce5e8] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Média geral</p>
            <p className={`mt-1 text-3xl font-bold tracking-[-.03em] ${corNota(media)}`}>{media !== null ? media.toFixed(1) : '—'}</p>
            <p className="mt-1 text-xs text-[#82939a]">{notasValidas.length} avaliações</p>
          </div>
          <div className="rounded-xl border border-[#dce5e8] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Disciplinas</p>
            <p className="mt-1 text-3xl font-bold tracking-[-.03em] text-[#243942]">{Object.keys(porDisciplina).length}</p>
            <p className="mt-1 text-xs text-[#82939a]">avaliadas</p>
          </div>
          <div className="rounded-xl border border-[#dce5e8] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Total de faltas</p>
            <p className={`mt-1 text-3xl font-bold tracking-[-.03em] ${totalFaltas > 10 ? 'text-[#991b1b]' : 'text-[#243942]'}`}>{totalFaltas}</p>
            <p className="mt-1 text-xs text-[#82939a]">no período</p>
          </div>
        </div>

        {notas.length === 0 ? (
          <div className="mt-8 rounded-xl border border-[#dce5e8] bg-white p-12 text-center">
            <p className="text-sm text-[#82939a]">Nenhuma nota lançada ainda.</p>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {Object.entries(porDisciplina).map(([disciplina, lista]) => {
              const notasValid = lista.filter((n) => n.nota !== null)
              const mediaDisc = notasValid.length > 0 ? notasValid.reduce((s, n) => s + (n.nota || 0), 0) / notasValid.length : null
              return (
                <div key={disciplina} className="overflow-hidden rounded-xl border border-[#dce5e8] bg-white">
                  <div className="flex items-center justify-between border-b border-[#e5ecee] bg-[#fafcfc] px-5 py-3">
                    <h2 className="text-base font-bold text-[#12232b]">{disciplina}</h2>
                    <span className={`font-syne text-xl font-bold ${corNota(mediaDisc)}`}>{mediaDisc !== null ? mediaDisc.toFixed(1) : '—'}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#e5ecee]">
                          <th className="px-5 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Período</th>
                          <th className="px-5 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Nota</th>
                          <th className="px-5 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Faltas</th>
                          <th className="px-5 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Observação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lista.map((n, i) => (
                          <tr key={i} className="border-b border-[#f0f4f5] last:border-0">
                            <td className="px-5 py-3 text-sm text-[#243942]">{periodosLabel[n.periodo] || n.periodo}</td>
                            <td className={`px-5 py-3 text-center font-syne text-base font-bold ${corNota(n.nota)}`}>{n.nota !== null ? n.nota.toFixed(1) : '—'}</td>
                            <td className="px-5 py-3 text-center text-sm text-[#243942]">{n.faltas}</td>
                            <td className="px-5 py-3 text-xs text-[#82939a]">{n.observacao || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </AlunoShell>
  )
}