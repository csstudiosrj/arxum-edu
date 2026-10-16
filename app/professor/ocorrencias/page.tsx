import { redirect } from 'next/navigation'
import { getProfessorDoUsuario } from '@/lib/auth/professor-atual'
import { getEscolaPorId } from '@/lib/auth/escola-atual'
import { marcaDaEscola } from '@/lib/auth/marca'
import { getAlunosDoProfessor, getOcorrenciasDoProfessor } from '../actions'
import { ProfessorShell } from '../professor-shell'
import { OcorrenciasProfessorClient } from './ocorrencias-client'

export const dynamic = 'force-dynamic'

export default async function OcorrenciasProfessorPage() {
  const prof = await getProfessorDoUsuario()
  if (!prof) redirect('/login')

  const [alunos, ocorrencias, escola] = await Promise.all([
    getAlunosDoProfessor(),
    getOcorrenciasDoProfessor(),
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
      <OcorrenciasProfessorClient alunos={alunos} ocorrencias={ocorrencias} professorNome={prof.nome} />
    </ProfessorShell>
  )
}