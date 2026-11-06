import { getMeusTickets } from './actions'
import { SuporteEscolaClient } from './suporte-client'

export const dynamic = 'force-dynamic'

export default async function SuporteEscolaPage() {
  const tickets = await getMeusTickets()
  return <SuporteEscolaClient ticketsIniciais={tickets} />
}