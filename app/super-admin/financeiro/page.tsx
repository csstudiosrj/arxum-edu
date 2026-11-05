import { getFaturamento, getEscolasParaFatura } from '../actions'
import { FinanceiroClient } from './financeiro-client'

export const dynamic = 'force-dynamic'

export default async function SuperAdminFinanceiroPage() {
  const faturas = await getFaturamento()
  const escolas = await getEscolasParaFatura()

  return <FinanceiroClient faturas={faturas} escolas={escolas} />
}
