import { getInscricoes } from './actions'
import { MatriculasClient } from './matriculas-client'

export const dynamic = 'force-dynamic'

export default async function MatriculasPage() {
  const inscricoes = await getInscricoes()
  return <MatriculasClient inscricoes={inscricoes} />
}