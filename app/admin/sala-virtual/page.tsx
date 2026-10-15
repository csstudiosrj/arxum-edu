import { getModulos } from './actions'
import { SalaVirtualAdminClient } from './sala-virtual-client'

export const dynamic = 'force-dynamic'

export default async function SalaVirtualAdminPage() {
  const modulos = await getModulos()
  return <SalaVirtualAdminClient modulos={modulos} />
}