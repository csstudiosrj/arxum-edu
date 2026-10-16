import { redirect } from 'next/navigation'
import { getAlunoDoUsuario } from '@/lib/auth/aluno-atual'
import { getEscolaPorId } from '@/lib/auth/escola-atual'
import { marcaDaEscola } from '@/lib/auth/marca'
import {
  getMinhasNotas,
  getMeusEventosAluno,
  getMeusComunicadosAluno,
  getMinhasAulas,
} from './actions'
import { AlunoShell } from './aluno-shell'
import { AlunoDashboard } from './aluno-dashboard'

export const dynamic = 'force-dynamic'

export default async function AlunoPage() {
  const aluno = await getAlunoDoUsuario()
  if (!aluno) redirect('/login')

  const [notas, eventos, comunicados, aulas, escola] = await Promise.all([
    getMinhasNotas(),
    getMeusEventosAluno(),
    getMeusComunicadosAluno(),
    getMinhasAulas(),
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
      <AlunoDashboard
        alunoNome={aluno.nome}
        notas={notas}
        eventos={eventos}
        comunicados={comunicados}
        aulas={aulas}
      />
    </AlunoShell>
  )
}