import { getConfigAvaliacao } from './actions'
import { AvaliacaoConfigClient } from './avaliacao-client'

export const dynamic = 'force-dynamic'

export default async function AvaliacaoConfigPage() {
  const config = await getConfigAvaliacao()
  return <AvaliacaoConfigClient configInicial={config} />
}