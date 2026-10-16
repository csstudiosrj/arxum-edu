import { notFound } from 'next/navigation'
import { getEscolaDaRequisicao } from '@/lib/auth/escola-atual'
import { getConteudoPaginasPublico } from '@/lib/cms/actions'
import { AEscolaClient } from './a-escola-client'

export const dynamic = 'force-dynamic'

export default async function AEscolaPage() {
  const escola = await getEscolaDaRequisicao()
  if (!escola) notFound()

  const paginas = await getConteudoPaginasPublico()

  return (
    <AEscolaClient
      escolaNome={escola.nome}
      slug={escola.slug}
      fontePar={escola.fonte_par}
      pagina={paginas.a_escola}
    />
  )
}