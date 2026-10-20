import { notFound } from 'next/navigation'
import { getEscolaDaRequisicao } from '@/lib/auth/escola-atual'
import { getConteudoPaginasPublico } from '@/lib/cms/actions'
import { marcaDaEscola } from '@/lib/auth/marca'
import { EstruturaClient } from './estrutura-client'

export const dynamic = 'force-dynamic'

export default async function EstruturaPage() {
  const escola = await getEscolaDaRequisicao()
  if (!escola) notFound()

  const paginas = await getConteudoPaginasPublico()
  const marca = marcaDaEscola(escola)

  return (
    <EstruturaClient
      escolaNome={escola.nome}
      slug={escola.slug}
      fontePar={escola.fonte_par}
      pagina={paginas.estrutura}
      cor={marca.corPrimaria}
      logoUrl={marca.logoUrl}
    />
  )
}