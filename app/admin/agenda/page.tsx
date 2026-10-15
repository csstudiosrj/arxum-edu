import { getEventos } from './actions'
import { AgendaClient } from './agenda-client'

export const dynamic = 'force-dynamic'

export default async function AgendaPage() {
  const eventos = await getEventos()
  return <AgendaClient eventos={eventos} />
}