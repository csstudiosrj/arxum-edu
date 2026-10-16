import { redirect } from 'next/navigation'
import { getProfessorDoUsuario } from '@/lib/auth/professor-atual'
import { getAlunosDoProfessor } from '../actions'
import { ProfessorShell } from '../professor-shell'

export const dynamic = 'force-dynamic'

export default async function AlunosProfessorPage() {
  const prof = await getProfessorDoUsuario()
  if (!prof) redirect('/login')

  const alunos = await getAlunosDoProfessor()

  return (
    <ProfessorShell
      professorNome={prof.nome}
      professorDisciplinas={prof.disciplinas || []}
      escolaNome={prof.escola_nome}
      escolaSlug={prof.escola_slug}
    >
      <main className="px-5 py-8 lg:px-8">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-[#0d9488]">Equipe</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-.03em] text-[#12232b]">Alunos</h1>
          <p className="mt-2 text-sm text-[#71838b]">Todos os alunos ativos da escola.</p>
        </div>

        {alunos.length === 0 ? (
          <div className="rounded-xl border border-[#dce5e8] bg-white p-12 text-center">
            <p className="text-sm text-[#82939a]">Nenhum aluno cadastrado.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {alunos.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-xl border border-[#dce5e8] bg-white p-4">
                <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[#ccfbf1] text-xs font-bold text-[#0f766e]">
                  {a.nome.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#243942]">{a.nome}</p>
                  <p className="mt-0.5 truncate text-xs text-[#82939a]">
                    {a.serie || '—'}{a.turno ? ` · ${a.turno}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </ProfessorShell>
  )
}