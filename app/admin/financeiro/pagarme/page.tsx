import { getDadosPagarme } from './actions'
import { PagarmeClient } from './pagarme-client'
import { getEscolaDoUsuario } from '@/lib/auth/escola-atual'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function PagarmePage() {
  const escola = await getEscolaDoUsuario()
  if (!escola) redirect('/login')

  const dados = await getDadosPagarme()

  return <PagarmeClient escola={escola} dados={dados} />
}