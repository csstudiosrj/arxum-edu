import { getModulosComProgresso } from './actions'
import { SalaVirtualClient } from './sala-virtual-client'

export const dynamic = 'force-dynamic'

export default async function SalaVirtualPage() {
  const modulos = await getModulosComProgresso()
  return <SalaVirtualClient modulos={modulos} />
}