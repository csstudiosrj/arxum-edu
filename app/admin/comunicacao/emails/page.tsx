import { getOpcoesDisparo } from './actions'
import { EmailsClient } from './emails-client'

export const dynamic = 'force-dynamic'

export default async function EmailsPage() {
  const opcoes = await getOpcoesDisparo()
  return <EmailsClient turmas={opcoes.turmas} />
}