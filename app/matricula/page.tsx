import { notFound } from 'next/navigation'
import { getEscolaDaRequisicao } from '@/lib/auth/escola-atual'
import { marcaDaEscola } from '@/lib/auth/marca'
import { MatriculaClient } from './matricula-client'

export const dynamic = 'force-dynamic'

export default async function MatriculaPage() {
  const escola = await getEscolaDaRequisicao()
  if (!escola) notFound()
  const marca = marcaDaEscola(escola)
  return (
    <MatriculaClient
      escolaNome={escola.nome}
      slug={escola.slug}
      cor={marca.corPrimaria}
      logoUrl={marca.logoUrl}
    />
  )
}