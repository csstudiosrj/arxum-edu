import { notFound } from 'next/navigation'
import { getEscolaDaRequisicao } from '@/lib/auth/escola-atual'
import { getConteudoHomePublico } from '@/lib/cms/actions'
import { marcaDaEscola } from '@/lib/auth/marca'
import { EscolaClient } from './escola-client'

export const dynamic = 'force-dynamic'

export default async function EscolaPage() {
  const escola = await getEscolaDaRequisicao()
  if (!escola) notFound()

  const conteudo = await getConteudoHomePublico()
  const marca = marcaDaEscola(escola)

  return (
    <EscolaClient
      escolaNome={escola.nome}
      slug={escola.slug}
      fontePar={escola.fonte_par}
      conteudo={conteudo}
      cor={marca.corPrimaria}
      logoUrl={marca.logoUrl}
    />
  )
}