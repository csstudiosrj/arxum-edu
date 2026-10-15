import { getAlunos } from './actions'
import { AlunosClient } from './alunos-client'

export const dynamic = 'force-dynamic'

export default async function AlunosPage() {
  const alunos = await getAlunos()
  return <AlunosClient alunos={alunos} />
}