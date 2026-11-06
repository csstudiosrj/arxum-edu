import { redirect } from 'next/navigation'
import { getAlunoDoUsuario } from '@/lib/auth/aluno-atual'
import { getEscolaPorId } from '@/lib/auth/escola-atual'
import { marcaDaEscola } from '@/lib/auth/marca'
import { getMinhasAtividades } from './actions'
import { AlunoShell } from '../aluno-shell'
import { AtividadesAlunoClient } from './atividades-client'

export const dynamic = 'force-dynamic'

export default async function AtividadesAlunoPage() {
  const aluno = await getAlunoDoUsuario()
  if (!aluno) redirect('/login')

  const [atividades, escola] = await Promise.all([
    getMinhasAtividades(),
    getEscolaPorId(aluno.escola_id),
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
      <AtividadesAlunoClient atividades={atividades} />
    </AlunoShell>
  )
}
