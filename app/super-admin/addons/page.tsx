import { getAddonsAdmin } from './actions'
import { AddonsClient } from './addons-client'

export const dynamic = 'force-dynamic'

export default async function AddonsPage() {
  const addons = await getAddonsAdmin()
  return <AddonsClient addons={addons} />
}