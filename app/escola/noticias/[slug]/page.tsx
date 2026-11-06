import { notFound } from 'next/navigation'
import { getEscolaDaRequisicao } from '@/lib/auth/escola-atual'
import { getConteudoHomePublico } from '@/lib/cms/actions'
import { marcaDaEscola } from '@/lib/auth/marca'
import { NoticiaClient } from './noticia-client'

export const dynamic = 'force-dynamic'

export default async function NoticiaPage({ params }: { params: { slug: string } }) {
  const escola = await getEscolaDaRequisicao()
  if (!escola) notFound()

  const conteudo = await getConteudoHomePublico()
  const marca = marcaDaEscola(escola)

  const noticia = conteudo.blocos.noticias.itens.find(
    (n) => n.slug === params.slug || n.id === params.slug
  )

  if (!noticia) notFound()

  return (
    <NoticiaClient
      escolaNome={escola.nome}
      slug={escola.slug}
      fontePar={escola.fonte_par}
      noticia={noticia}
      cor={marca.corPrimaria}
      logoUrl={marca.logoUrl}
    />
  )
}