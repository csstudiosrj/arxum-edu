import { notFound } from 'next/navigation'
import { getEscolaDaRequisicao } from '@/lib/auth/escola-atual'
import { getConteudoPaginasPublico } from '@/lib/cms/actions'
import { marcaDaEscola } from '@/lib/auth/marca'
import { PaginaExtraClient } from './pagina-extra-client'

export const dynamic = 'force-dynamic'

export default async function PaginaExtraPage({ params }: { params: { slug: string } }) {
  const escola = await getEscolaDaRequisicao()
  if (!escola) notFound()

  const paginas = await getConteudoPaginasPublico()
  const marca = marcaDaEscola(escola)

  const pagina = paginas.paginas_extras?.find((p) => p.slug === params.slug)
  if (!pagina) notFound()

  return (
    <PaginaExtraClient
      escolaNome={escola.nome}
      slug={escola.slug}
      fontePar={escola.fonte_par}
      pagina={pagina}
      cor={marca.corPrimaria}
      logoUrl={marca.logoUrl}
    />
  )
}