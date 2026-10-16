import { redirect } from 'next/navigation'
import { getProfessorDoUsuario } from '@/lib/auth/professor-atual'
import { getEscolaPorId } from '@/lib/auth/escola-atual'
import { marcaDaEscola } from '@/lib/auth/marca'
import { getAlunosDoProfessor, getNotasDoProfessor, getOcorrenciasDoProfessor } from './actions'
import { ProfessorShell } from './professor-shell'
import { ProfessorDashboard } from './professor-dashboard'

export const dynamic = 'force-dynamic'

export default async function ProfessorPage() {
  const prof = await getProfessorDoUsuario()
  if (!prof) redirect('/login')

  const [alunos, notas, ocorrencias, escola] = await Promise.all([
    getAlunosDoProfessor(),
    getNotasDoProfessor(),
    getOcorrenciasDoProfessor(),
    getEscolaPorId(prof.escola_id),
  ])

  const marca = escola ? marcaDaEscola(escola) : null
  const minhasOcorrencias = ocorrencias.filter((o) => o.autor_nome === prof.nome)

  return (
    <ProfessorShell
      professorNome={prof.nome}
      professorDisciplinas={prof.disciplinas || []}
      escolaNome={prof.escola_nome}
      escolaSlug={prof.escola_slug}
      marca={marca}
    >
      <ProfessorDashboard
        professorNome={prof.nome}
        disciplinas={prof.disciplinas || []}
        totalAlunos={alunos.length}
        totalNotas={notas.length}
        minhasOcorrencias={minhasOcorrencias.length}
        notasRecentes={notas.slice(0, 5)}
        alunosRecentes={alunos.slice(0, 5)}
      />
    </ProfessorShell>
  )
}