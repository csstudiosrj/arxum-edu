import { getTermosEscola } from './actions'
import { getAlunosParaOcorrencia } from '../ocorrencias/actions'
import { TermosClient } from './termos-client'

export const dynamic = 'force-dynamic'

export default async function TermosPage() {
  const [termos, alunos] = await Promise.all([
    getTermosEscola(),
    getAlunosParaOcorrencia()
  ])

  return <TermosClient termosIniciais={termos} alunos={alunos} />
}