import { getPlanos } from '../actions'
import { PlanosClient } from './planos-client'

export const dynamic = 'force-dynamic'

export default async function PlanosPage() {
  const planos = await getPlanos()
  return <PlanosClient planos={planos} />
}