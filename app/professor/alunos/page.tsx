import { redirect } from 'next/navigation'
import { getProfessorDoUsuario } from '@/lib/auth/professor-atual'
import { getEscolaPorId } from '@/lib/auth/escola-atual'
import { marcaDaEscola } from '@/lib/auth/marca'
import { getAlunosDoProfessor } from '../actions'
import { ProfessorShell } from '../professor-shell'
import { AlunosClient } from './alunos-client'

export const dynamic = 'force-dynamic'

export default async function AlunosProfessorPage() {
  const prof = await getProfessorDoUsuario()
  if (!prof) redirect('/login')

  const [dadosAlunos, escola] = await Promise.all([
    getAlunosDoProfessor(),
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
      <AlunosClient alunos={dadosAlunos.alunos} configRecursos={dadosAlunos.configRecursos} />
    </ProfessorShell>
  )
}