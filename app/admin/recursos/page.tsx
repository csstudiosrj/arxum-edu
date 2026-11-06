import { getConfiguracaoRecursos } from './actions'
import { RecursosClient } from './recursos-client'

export const dynamic = 'force-dynamic'

export default async function RecursosPage() {
  const { config, seriesDisponiveis } = await getConfiguracaoRecursos()

  return <RecursosClient configInicial={config} seriesDisponiveis={seriesDisponiveis} />
}