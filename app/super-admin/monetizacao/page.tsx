import { getConfiguracoesMonetizacao } from './actions'
import { MonetizacaoClient } from './monetizacao-client'

export const dynamic = 'force-dynamic'

export default async function MonetizacaoPage() {
  const config = await getConfiguracoesMonetizacao()
  return <MonetizacaoClient configInicial={config} />
}
