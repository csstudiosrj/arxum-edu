import { notFound } from 'next/navigation'
import { getEscolaDaRequisicao } from '@/lib/auth/escola-atual'
import { getConteudoHomePublico } from '@/lib/cms/actions'
import { marcaDaEscola } from '@/lib/auth/marca'
import { NoticiasClient } from './noticias-client'

export const dynamic = 'force-dynamic'

export default async function NoticiasPage() {
  const escola = await getEscolaDaRequisicao()
  if (!escola) notFound()

  const conteudo = await getConteudoHomePublico()
  const marca = marcaDaEscola(escola)

  return (
    <NoticiasClient
      escolaNome={escola.nome}
      slug={escola.slug}
      fontePar={escola.fonte_par}
      blocoNoticias={conteudo.blocos.noticias}
      cor={marca.corPrimaria}
      logoUrl={marca.logoUrl}
    />
  )
}