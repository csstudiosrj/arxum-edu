import { redirect } from 'next/navigation'
import { getProfessorDoUsuario } from '@/lib/auth/professor-atual'
import { getAlunosDoProfessor, getOcorrenciasDoProfessor } from '../actions'
import { ProfessorShell } from '../professor-shell'
import { OcorrenciasProfessorClient } from './ocorrencias-client'

export const dynamic = 'force-dynamic'

export default async function OcorrenciasProfessorPage() {
  const prof = await getProfessorDoUsuario()
  if (!prof) redirect('/login')

  const [alunos, ocorrencias] = await Promise.all([
    getAlunosDoProfessor(),
    getOcorrenciasDoProfessor(),
  ])

  return (
    <ProfessorShell
      professorNome={prof.nome}
      professorDisciplinas={prof.disciplinas || []}
      escolaNome={prof.escola_nome}
      escolaSlug={prof.escola_slug}
    >
      <OcorrenciasProfessorClient alunos={alunos} ocorrencias={ocorrencias} professorNome={prof.nome} />
    </ProfessorShell>
  )
}