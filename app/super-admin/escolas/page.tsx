import { getTodasEscolas } from '../actions'
import { getPlanos } from '../actions'
import { EscolasClient } from './escolas-client'

export const dynamic = 'force-dynamic'

export default async function EscolasPage() {
  const [escolas, planos] = await Promise.all([getTodasEscolas(), getPlanos()])
  return <EscolasClient escolas={escolas} planos={planos} />
}