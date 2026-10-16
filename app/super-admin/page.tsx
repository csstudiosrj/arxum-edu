import { getMetricasSaaS } from './actions'
import { SuperAdminClient } from './super-admin-client'

export const dynamic = 'force-dynamic'

export default async function SuperAdminPage() {
  const metricas = await getMetricasSaaS()
  return <SuperAdminClient metricas={metricas} />
}