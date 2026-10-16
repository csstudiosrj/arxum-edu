import { getEscolaDaRequisicao } from '@/lib/auth/escola-atual'
import { MatriculaClient } from './matricula-client'

export const dynamic = 'force-dynamic'

export default async function MatriculaPage() {
  const escola = await getEscolaDaRequisicao()
  const escolaNome = escola?.nome || 'Escola'

  return <MatriculaClient escolaNome={escolaNome} />
}