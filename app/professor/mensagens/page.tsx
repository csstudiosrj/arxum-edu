import { redirect } from 'next/navigation'
import { getProfessorDoUsuario } from '@/lib/auth/professor-atual'
import { getEscolaPorId } from '@/lib/auth/escola-atual'
import { marcaDaEscola } from '@/lib/auth/marca'
import { ProfessorShell } from '../professor-shell'
import { getConversasProfessor } from './actions'
import { ProfessorMensagensClient } from './mensagens-client'

export const dynamic = 'force-dynamic'

export default async function ProfessorMensagensPage() {
  const prof = await getProfessorDoUsuario()
  if (!prof) redirect('/login')

  const [conversas, escola] = await Promise.all([
    getConversasProfessor(),
    getEscolaPorId(prof.escola_id)
  ])

  const marca = escola ? marcaDaEscola(escola) : null

  return (
    <ProfessorShell
      professorNome={prof.nome}
      professorDisciplinas={prof.disciplinas || []}
      escolaNome={prof.escola_nome || escola?.nome || 'Escola'}
      escolaSlug={prof.escola_slug || escola?.slug || ''}
      marca={marca}
    >
      <ProfessorMensagensClient conversasIniciais={conversas} />
    </ProfessorShell>
  )
}