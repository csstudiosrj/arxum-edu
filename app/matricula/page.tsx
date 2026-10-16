import { notFound } from 'next/navigation'
import { getEscolaDaRequisicao } from '@/lib/auth/escola-atual'
import { MatriculaClient } from './matricula-client'

export const dynamic = 'force-dynamic'

export default async function MatriculaPage() {
  const escola = await getEscolaDaRequisicao()
  if (!escola) notFound()

  return <MatriculaClient escolaNome={escola.nome} />
}