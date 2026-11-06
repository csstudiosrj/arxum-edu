import { redirect } from 'next/navigation'
import { getAlunoDoUsuario } from '@/lib/auth/aluno-atual'
import { getEscolaPorId } from '@/lib/auth/escola-atual'
import { marcaDaEscola } from '@/lib/auth/marca'
import { getVideoaulasAluno } from '../actions'
import { AlunoShell } from '../aluno-shell'
import { EduflixClient } from './eduflix-client'

export const dynamic = 'force-dynamic'

export default async function EduflixAlunoPage() {
  const aluno = await getAlunoDoUsuario()
  if (!aluno) redirect('/login')

  const [videoaulas, escola] = await Promise.all([
    getVideoaulasAluno(),
    getEscolaPorId(aluno.escola_id),
  ])

  const marca = escola ? marcaDaEscola(escola) : null

  return (
    <AlunoShell alunoNome={aluno.nome} alunoSerie={aluno.serie || 'Sem série'} escolaNome={aluno.escola_nome} escolaSlug={aluno.escola_slug} marca={marca}>
      <EduflixClient videoaulas={videoaulas} />
    </AlunoShell>
  )
}