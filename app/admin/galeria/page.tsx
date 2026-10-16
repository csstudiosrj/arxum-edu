import { getAlbuns } from './actions'
import { GaleriaClient } from './galeria-client'

export const dynamic = 'force-dynamic'

export default async function GaleriaPage() {
  const albuns = await getAlbuns()
  return <GaleriaClient albuns={albuns} />
}