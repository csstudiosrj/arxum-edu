import { getMinhasInscricoes, getMeusComunicados, getMinhasFaturas, getMeusEventos, getMinhasAutorizacoes, getMeuBoletim } from './actions'
import { ResponsavelClient } from './responsavel-client'

export const dynamic = 'force-dynamic'

export default async function ResponsavelPage() {
  const [inscricoes, comunicados, faturas, eventos, autorizacoes, boletins] = await Promise.all([
    getMinhasInscricoes(),
    getMeusComunicados(),
    getMinhasFaturas(),
    getMeusEventos(),
    getMinhasAutorizacoes(),
    getMeuBoletim(),
  ])

  return <ResponsavelClient
    inscricoes={inscricoes}
    comunicados={comunicados}
    faturas={faturas}
    eventos={eventos}
    autorizacoes={autorizacoes}
    boletins={boletins}
  />
}