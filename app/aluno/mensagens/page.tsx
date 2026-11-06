import { redirect } from 'next/navigation'
import { getAlunoDoUsuario } from '@/lib/auth/aluno-atual'
import { getEscolaPorId } from '@/lib/auth/escola-atual'
import { marcaDaEscola } from '@/lib/auth/marca'
import { AlunoShell } from '../aluno-shell'
import { getConversasAluno } from './actions'
import { AlunoMensagensClient } from './mensagens-client'

export const dynamic = 'force-dynamic'

export default async function AlunoMensagensPage() {
  const aluno = await getAlunoDoUsuario()
  if (!aluno) redirect('/login')

  const [conversas, escola] = await Promise.all([
    getConversasAluno(),
    getEscolaPorId(aluno.escola_id)
  ])

  const marca = escola ? marcaDaEscola(escola) : null

  return (
    <AlunoShell
      alunoNome={aluno.nome}
      alunoSerie={aluno.serie || 'Sem série'}
      escolaNome={aluno.escola_nome}
      escolaSlug={aluno.escola_slug}
      marca={marca}
    >
      <AlunoMensagensClient conversasIniciais={conversas} />
    </AlunoShell>
  )
}