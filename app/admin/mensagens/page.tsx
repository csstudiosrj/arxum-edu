import { getMensagens } from '@/lib/cms/actions'
import { getConversasEscola, getAlunosParaNovaConversa } from './chat-actions'
import { MensagensClient } from './mensagens-client'

export const dynamic = 'force-dynamic'

export default async function MensagensPage() {
  const [mensagens, conversas, alunos] = await Promise.all([
    getMensagens(),
    getConversasEscola(),
    getAlunosParaNovaConversa()
  ])

  return <MensagensClient mensagens={mensagens} conversasIniciais={conversas} alunos={alunos} />
}
