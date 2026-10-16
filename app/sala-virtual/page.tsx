import { notFound } from 'next/navigation'
import { getEscolaDaRequisicao } from '@/lib/auth/escola-atual'
import { getModulosComProgresso } from './actions'
import { SalaVirtualClient } from './sala-virtual-client'

export const dynamic = 'force-dynamic'

export default async function SalaVirtualPage() {
  const escola = await getEscolaDaRequisicao()
  if (!escola) notFound()

  const modulos = await getModulosComProgresso()
  return <SalaVirtualClient modulos={modulos} />
}