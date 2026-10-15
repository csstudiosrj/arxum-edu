import { getComunicados } from './actions'
import { ComunicacaoClient } from './comunicacao-client'

export const dynamic = 'force-dynamic'

export default async function ComunicacaoPage() {
  const comunicados = await getComunicados()
  return <ComunicacaoClient comunicados={comunicados} />
}