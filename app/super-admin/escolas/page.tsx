import { getTodasEscolas } from '../actions'
import { EscolasClient } from './escolas-client'

export const dynamic = 'force-dynamic'

export default async function EscolasPage() {
  const escolas = await getTodasEscolas()
  return <EscolasClient escolas={escolas} />
}