import { getConversasResponsavel } from './actions'
import { ResponsavelMensagensClient } from './mensagens-client'

export const dynamic = 'force-dynamic'

export default async function MensagensResponsavelPage() {
  const conversas = await getConversasResponsavel()
  return <ResponsavelMensagensClient conversasIniciais={conversas} />
}
