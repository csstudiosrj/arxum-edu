import { getTickets, getEscolasParaFatura } from '../actions'
import { SuporteClient } from './suporte-client'

export const dynamic = 'force-dynamic'

export default async function SuportePage() {
  const [tickets, escolas] = await Promise.all([getTickets(), getEscolasParaFatura()])
  return <SuporteClient tickets={tickets} escolas={escolas} />
}