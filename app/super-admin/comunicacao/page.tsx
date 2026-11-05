import { getTemplates, getEscolasParaComunicacao } from './actions'
import { ComunicacaoClient } from './comunicacao-client'

export const dynamic = 'force-dynamic'

export default async function ComunicacaoPage() {
  const [templates, escolas] = await Promise.all([
    getTemplates(),
    getEscolasParaComunicacao()
  ])
  return <ComunicacaoClient templates={templates} escolas={escolas} />
}
