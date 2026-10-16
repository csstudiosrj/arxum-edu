import { redirect } from 'next/navigation'
import { getProfessorDoUsuario } from '@/lib/auth/professor-atual'
import { getEscolaPorId } from '@/lib/auth/escola-atual'
import { marcaDaEscola } from '@/lib/auth/marca'
import { getAlunosDoProfessor, getNotasDoProfessor } from '../actions'
import { ProfessorShell } from '../professor-shell'
import { NotasProfessorClient } from './notas-client'

export const dynamic = 'force-dynamic'

export default async function NotasProfessorPage() {
  const prof = await getProfessorDoUsuario()
  if (!prof) redirect('/login')

  const [alunos, notas, escola] = await Promise.all([
    getAlunosDoProfessor(),
    getNotasDoProfessor(),
    getEscolaPorId(prof.escola_id),
  ])

  const marca = escola ? marcaDaEscola(escola) : null

  return (
    <ProfessorShell
      professorNome={prof.nome}
      professorDisciplinas={prof.disciplinas || []}
      escolaNome={prof.escola_nome}
      escolaSlug={prof.escola_slug}
      marca={marca}
    >
      <NotasProfessorClient
        alunos={alunos}
        notas={notas}
        disciplinasSugeridas={prof.disciplinas || []}
      />
    </ProfessorShell>
  )
}