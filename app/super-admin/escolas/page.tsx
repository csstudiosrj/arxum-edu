import { getTodasEscolas, getPlanos } from '../actions'
import { getTemplates } from '../comunicacao/actions'
import { EscolasClient } from './escolas-client'

export const dynamic = 'force-dynamic'

export default async function EscolasPage() {
  const [escolas, planos, templates] = await Promise.all([
    getTodasEscolas(), 
    getPlanos(),
    getTemplates()
  ])
  
  return <EscolasClient escolas={escolas} planos={planos} templates={templates} />
}
