import { redirect } from 'next/navigation'
import { getMeusFilhos, getMinhasInscricoes, getMeusComunicados, getMinhasFaturas, getMeusEventos, getMinhasAutorizacoes, getMeuBoletim, getMeusAlbuns, getMinhasOcorrencias } from './actions'
import { getAlunoDoUsuario } from '@/lib/auth/aluno-atual'
import { getEscolaPorId } from '@/lib/auth/escola-atual'
import { marcaDaEscola } from '@/lib/auth/marca'
import { ResponsavelClient } from './responsavel-client'

export const dynamic = 'force-dynamic'

export default async function ResponsavelPage() {
  const aluno = await getAlunoDoUsuario()
  if (!aluno) redirect('/login')

  const escola = await getEscolaPorId(aluno.escola_id)
  
  const [inscricoes, comunicados, faturas, eventos, autorizacoes, boletins, albuns, ocorrencias, filhos] = await Promise.all([
    getMinhasInscricoes(),
    getMeusComunicados(),
    getMinhasFaturas(),
    getMeusEventos(),
    getMinhasAutorizacoes(),
    getMeuBoletim(),
    getMeusAlbuns(),
    getMinhasOcorrencias(),
    getMeusFilhos(),
  ])

  const marca = escola ? marcaDaEscola(escola) : null

  return (
    <ResponsavelClient
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
      escolaSlug={escola?.slug || aluno.escola_slug || ''}
    />
  )
}