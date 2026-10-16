import { getMinhasInscricoes, getMeusComunicados, getMinhasFaturas, getMeusEventos, getMinhasAutorizacoes, getMeuBoletim, getMeusAlbuns, getMinhasOcorrencias } from './actions'
import { ResponsavelClient } from './responsavel-client'

export const dynamic = 'force-dynamic'

export default async function ResponsavelPage() {
  const [inscricoes, comunicados, faturas, eventos, autorizacoes, boletins, albuns, ocorrencias] = await Promise.all([
    getMinhasInscricoes(),
    getMeusComunicados(),
    getMinhasFaturas(),
    getMeusEventos(),
    getMinhasAutorizacoes(),
    getMeuBoletim(),
    getMeusAlbuns(),
    getMinhasOcorrencias(),
  ])

  return <ResponsavelClient
    inscricoes={inscricoes}
    comunicados={comunicados}
    faturas={faturas}
    eventos={eventos}
    autorizacoes={autorizacoes}
    boletins={boletins}
    albuns={albuns}
    ocorrencias={ocorrencias}
  />
}