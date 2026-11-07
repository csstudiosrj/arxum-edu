import { redirect } from 'next/navigation'
import { getProfessorDoUsuario } from '@/lib/auth/professor-atual'
import { getEscolaPorId } from '@/lib/auth/escola-atual'
import { marcaDaEscola } from '@/lib/auth/marca'
import { ProfessorShell } from '../professor-shell'
import { getAlunosParaChamada } from './actions'
import { ChamadaClient } from './chamada-client'

export const dynamic = 'force-dynamic'

export default async function ChamadaPage() {
  const prof = await getProfessorDoUsuario()
  if (!prof) redirect('/login')

  const [alunos, escola] = await Promise.all([
    getAlunosParaChamada(),
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
      <ChamadaClient 
        alunos={alunos} 
        disciplinasSugeridas={prof.disciplinas || []} 
      />
    </ProfessorShell>
  )
}