import { redirect } from 'next/navigation'
import { getProfessorDoUsuario } from '@/lib/auth/professor-atual'
import { getEscolaPorId } from '@/lib/auth/escola-atual'
import { marcaDaEscola } from '@/lib/auth/marca'
import { getAtividadesDoProfessor } from './actions'
import { getModulosDoProfessor } from '../sala-virtual/actions'
import { ProfessorShell } from '../professor-shell'
import { AtividadesProfessorClient } from './atividades-client'

export const dynamic = 'force-dynamic'

export default async function AtividadesProfessorPage() {
  const prof = await getProfessorDoUsuario()
  if (!prof) redirect('/login')

  const [atividades, modulos, escola] = await Promise.all([
    getAtividadesDoProfessor(),
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
      <AtividadesProfessorClient 
        atividades={atividades} 
        modulos={modulos.map(m => ({ id: m.id, titulo: m.titulo, disciplina: m.disciplina }))} 
      />
    </ProfessorShell>
  )
}
