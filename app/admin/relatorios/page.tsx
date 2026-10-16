import { getRelatorioData } from './actions'
import { RelatoriosClient } from './relatorios-client'

export const dynamic = 'force-dynamic'

export default async function RelatoriosPage() {
  const data = await getRelatorioData()
  return <RelatoriosClient data={data} />
}