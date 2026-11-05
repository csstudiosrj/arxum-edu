import { getMetricasFinanceiras, getEscolasFinanceiro } from '../actions'
import { FinanceiroClient } from './financeiro-client'

export const dynamic = 'force-dynamic'

export default async function SuperAdminFinanceiroPage() {
  const metricas = await getMetricasFinanceiras()
  const escolas = await getEscolasFinanceiro()

  return <FinanceiroClient metricas={metricas} escolas={escolas} />
}
