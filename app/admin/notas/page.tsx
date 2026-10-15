import { getNotas, getAlunosAtivos } from './actions'
import { NotasClient } from './notas-client'

export const dynamic = 'force-dynamic'

export default async function NotasPage() {
  const [notas, alunos] = await Promise.all([getNotas(), getAlunosAtivos()])
  return <NotasClient notas={notas} alunos={alunos} />
}