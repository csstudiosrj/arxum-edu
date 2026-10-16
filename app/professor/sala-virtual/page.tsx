import { redirect } from 'next/navigation'
import { getProfessorDoUsuario } from '@/lib/auth/professor-atual'
import { getEscolaPorId } from '@/lib/auth/escola-atual'
import { marcaDaEscola } from '@/lib/auth/marca'
import { getModulosDoProfessor } from './actions'
import { ProfessorShell } from '../professor-shell'
import { SalaVirtualProfessorClient } from './sala-virtual-client'

export const dynamic = 'force-dynamic'

export default async function ProfessorSalaVirtualPage() {
  const prof = await getProfessorDoUsuario()
  if (!prof) redirect('/login')

  const [modulos, escola] = await Promise.all([
    getModulosDoProfessor(),
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
      <SalaVirtualProfessorClient
        modulos={modulos}
        disciplinasProfessor={prof.disciplinas || []}
      />
    </ProfessorShell>
  )
}