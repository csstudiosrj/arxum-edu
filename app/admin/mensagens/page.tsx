import { getMensagens } from '@/lib/cms/actions'
import { MensagensClient } from './mensagens-client'

export const dynamic = 'force-dynamic'

export default async function MensagensPage() {
  const mensagens = await getMensagens()
  return <MensagensClient mensagens={mensagens} />
}