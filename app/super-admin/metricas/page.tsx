import { getMetricasSaaS } from '../actions'
import { MetricasClient } from './metricas-client'

export const dynamic = 'force-dynamic'

export default async function MetricasPage() {
  const metricas = await getMetricasSaaS()
  return <MetricasClient metricas={metricas} />
}