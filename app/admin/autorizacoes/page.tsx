import { getAutorizacoes } from './actions'
import { AutorizacoesClient } from './autorizacoes-client'

export const dynamic = 'force-dynamic'

export default async function AutorizacoesPage() {
  const autorizacoes = await getAutorizacoes()
  return <AutorizacoesClient autorizacoes={autorizacoes} />
}