import { getMinhasInscricoes, getMeusComunicados } from './actions'
import { ResponsavelClient } from './responsavel-client'

export const dynamic = 'force-dynamic'

export default async function ResponsavelPage() {
  const [inscricoes, comunicados] = await Promise.all([
    getMinhasInscricoes(),
    getMeusComunicados(),
  ])

  return <ResponsavelClient inscricoes={inscricoes} comunicados={comunicados} />
}