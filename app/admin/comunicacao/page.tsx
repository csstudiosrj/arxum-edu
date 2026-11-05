import { getComunicados, getFiltrosComunicacao } from './actions'
import { ComunicacaoClient } from './comunicacao-client'

export const dynamic = 'force-dynamic'

export default async function ComunicacaoPage() {
  const [comunicados, filtros] = await Promise.all([
    getComunicados(),
    getFiltrosComunicacao()
  ])
  
  return <ComunicacaoClient comunicados={comunicados} filtros={filtros} />
}
