import { getMinhasInscricoes, getMeusComunicados, getMinhasFaturas, getMeusEventos } from './actions'
import { ResponsavelClient } from './responsavel-client'

export const dynamic = 'force-dynamic'

export default async function ResponsavelPage() {
  const [inscricoes, comunicados, faturas, eventos] = await Promise.all([
    getMinhasInscricoes(),
    getMeusComunicados(),
    getMinhasFaturas(),
    getMeusEventos(),
  ])

  return <ResponsavelClient inscricoes={inscricoes} comunicados={comunicados} faturas={faturas} eventos={eventos} />
}