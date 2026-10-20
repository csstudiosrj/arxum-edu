import { redirect } from 'next/navigation'
import { getAlunoDoUsuario } from '@/lib/auth/aluno-atual'
import { getEscolaPorId } from '@/lib/auth/escola-atual'
import { marcaDaEscola } from '@/lib/auth/marca'
import { getAulaDetalhe } from '../../actions'
import { AlunoShell } from '../../aluno-shell'
import { AulaClient } from './aula-client'

export const dynamic = 'force-dynamic'

export default async function AulaDetalhePage({ params }: { params: { id: string } }) {
  const aluno = await getAlunoDoUsuario()
  if (!aluno) redirect('/login')

  const [aula, escola] = await Promise.all([
    getAulaDetalhe(params.id),
    getEscolaPorId(aluno.escola_id),
  ])

  if (!aula) redirect('/aluno/aulas')

  const marca = escola ? marcaDaEscola(escola) : null

  return (
    <AlunoShell
      alunoNome={aluno.nome}
      alunoSerie={aluno.serie || 'Sem série'}
      escolaNome={aluno.escola_nome}
      escolaSlug={aluno.escola_slug}
      marca={marca}
    >
      <AulaClient aula={aula} />
    </AlunoShell>
  )
}