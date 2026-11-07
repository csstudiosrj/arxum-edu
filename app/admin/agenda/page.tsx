import { getEventos } from './actions'
import { getEscolaDoUsuario } from '@/lib/auth/escola-atual'
import { AgendaClient } from './agenda-client'

export const dynamic = 'force-dynamic'

export default async function AgendaPage() {
  const [eventos, escola] = await Promise.all([
    getEventos(),
    getEscolaDoUsuario()
  ])
  
  return <AgendaClient eventos={eventos} slug={escola?.slug || ''} />
}