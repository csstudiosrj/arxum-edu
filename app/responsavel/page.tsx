import { getMinhasInscricoes, getMeusComunicados, getMinhasFaturas, getMeusEventos, getMinhasAutorizacoes, getMeuBoletim, getMeusAlbuns, getMinhasOcorrencias, getMeusFilhos } from './actions'
import { getEscolaDoUsuario } from '@/lib/auth/escola-atual'
import { marcaDaEscola } from '@/lib/auth/marca'
import { ResponsavelClient } from './responsavel-client'

export const dynamic = 'force-dynamic'

export default async function ResponsavelPage() {
  const [inscricoes, comunicados, faturas, eventos, autorizacoes, boletins, albuns, ocorrencias, filhos, escola] = await Promise.all([
    getMinhasInscricoes(),
    getMeusComunicados(),
    getMinhasFaturas(),
    getMeusEventos(),
    getMinhasAutorizacoes(),
    getMeuBoletim(),
    getMeusAlbuns(),
    getMinhasOcorrencias(),
    getMeusFilhos(),
    getEscolaDoUsuario(),
  ])

  const marca = escola ? marcaDaEscola(escola) : null

  return <ResponsavelClient
    inscricoes={inscricoes}
    comunicados={comunicados}
    faturas={faturas}
    eventos={eventos}
    autorizacoes={autorizacoes}
    boletins={boletins}
    albuns={albuns}
    ocorrencias={ocorrencias}
    filhos={filhos}
    marca={marca}
  />
}