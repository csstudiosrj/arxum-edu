import { getConfig } from './actions'
import { NotificacoesClient } from './notificacoes-client'

export const dynamic = 'force-dynamic'

export default async function NotificacoesPage() {
  const config = await getConfig()
  return <NotificacoesClient config={config} />
}