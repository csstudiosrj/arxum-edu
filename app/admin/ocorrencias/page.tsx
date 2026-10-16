import { getOcorrencias, getAlunosParaOcorrencia } from './actions'
import { OcorrenciasClient } from './ocorrencias-client'

export const dynamic = 'force-dynamic'

export default async function OcorrenciasPage() {
  const [ocorrencias, alunos] = await Promise.all([getOcorrencias(), getAlunosParaOcorrencia()])
  return <OcorrenciasClient ocorrencias={ocorrencias} alunos={alunos} />
}