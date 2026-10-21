import { notFound } from 'next/navigation'
import { getEscolaDaRequisicao } from '@/lib/auth/escola-atual'
import { marcaDaEscola } from '@/lib/auth/marca'
import { getModulosComProgresso } from './actions'
import { SalaVirtualClient } from './sala-virtual-client'

export const dynamic = 'force-dynamic'

export default async function SalaVirtualPage() {
  const escola = await getEscolaDaRequisicao()
  if (!escola) notFound()

  const modulos = await getModulosComProgresso()
  const marca = marcaDaEscola(escola)

  return <SalaVirtualClient modulos={modulos} cor={marca.usaBranding ? marca.corPrimaria : undefined} />
}