import { redirect } from 'next/navigation'
import { getProfessorDoUsuario } from '@/lib/auth/professor-atual'
import { getEscolaPorId } from '@/lib/auth/escola-atual'
import { marcaDaEscola } from '@/lib/auth/marca'
import { ProfessorShell } from '../../../professor-shell'
import { getDadosCaderno, getAlunosComEmail } from './actions'
import { CadernoGridClient } from './caderno-grid-client'

export const dynamic = 'force-dynamic'

export default async function CadernoGridPage({
  params,
  searchParams
}: {
  params: { turmaId: string; disciplina: string }
  searchParams: { periodo?: string }
}) {
  const prof = await getProfessorDoUsuario()
  if (!prof) redirect('/login')

  const disciplina = decodeURIComponent(params.disciplina)
  const periodo = searchParams.periodo || '1_bimestre'

  const [dados, alunosEmail, escola] = await Promise.all([
    getDadosCaderno(params.turmaId, disciplina, periodo),
    getAlunosComEmail(params.turmaId),
    getEscolaPorId(prof.escola_id),
  ])

  if (!dados) redirect('/professor/caderno')

  const marca = escola ? marcaDaEscola(escola) : null

  return (
    <ProfessorShell
      professorNome={prof.nome}
      professorDisciplinas={prof.disciplinas || []}
      escolaNome={prof.escola_nome}
      escolaSlug={prof.escola_slug}
      marca={marca}
    >
      <CadernoGridClient 
        turmaId={params.turmaId}
        disciplina={disciplina}
        periodoAtual={periodo}
        dados={dados} 
        emails={Object.fromEntries(alunosEmail.map(a => [a.id, a.responsavel_email]))}
      />
    </ProfessorShell>
  )
}