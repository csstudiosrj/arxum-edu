import { notFound } from 'next/navigation'
import { getEscolaDaRequisicao } from '@/lib/auth/escola-atual'
import { EscolaClient } from './escola-client'

export const dynamic = 'force-dynamic'

export default async function EscolaPage() {
  const escola = await getEscolaDaRequisicao()
  if (!escola) notFound()

  return <EscolaClient escolaNome={escola.nome} slug={escola.slug} />
}