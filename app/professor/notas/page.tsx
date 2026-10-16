import { redirect } from 'next/navigation'
import { getProfessorDoUsuario } from '@/lib/auth/professor-atual'
import { getAlunosDoProfessor, getNotasDoProfessor } from '../actions'
import { ProfessorShell } from '../professor-shell'
import { NotasProfessorClient } from './notas-client'

export const dynamic = 'force-dynamic'

export default async function NotasProfessorPage() {
  const prof = await getProfessorDoUsuario()
  if (!prof) redirect('/login')

  const [alunos, notas] = await Promise.all([
    getAlunosDoProfessor(),
    getNotasDoProfessor(),
  ])

  return (
    <ProfessorShell
      professorNome={prof.nome}
      professorDisciplinas={prof.disciplinas || []}
      escolaNome={prof.escola_nome}
      escolaSlug={prof.escola_slug}
    >
      <NotasProfessorClient
        alunos={alunos}
        notas={notas}
        disciplinasSugeridas={prof.disciplinas || []}
      />
    </ProfessorShell>
  )
}