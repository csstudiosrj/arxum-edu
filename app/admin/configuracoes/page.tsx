import { getDadosEscola } from './actions'
import { ConfiguracoesClient } from './configuracoes-client'

export const dynamic = 'force-dynamic'

export default async function ConfiguracoesPage() {
  const escola = await getDadosEscola()
  return <ConfiguracoesClient escola={escola} />
}