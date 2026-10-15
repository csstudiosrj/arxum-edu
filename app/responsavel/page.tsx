import { getMinhasInscricoes } from './actions'
import { ResponsavelClient } from './responsavel-client'

export const dynamic = 'force-dynamic'

export default async function ResponsavelPage() {
  const inscricoes = await getMinhasInscricoes()
  return <ResponsavelClient inscricoes={inscricoes} />
}