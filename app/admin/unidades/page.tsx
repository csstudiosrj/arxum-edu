import { getUnidades } from './actions'
import { getDadosEscola } from '../configuracoes/actions'
import { UnidadesClient } from './unidades-client'

export const dynamic = 'force-dynamic'

export default async function UnidadesPage() {
  const [unidades, escola] = await Promise.all([
    getUnidades(),
    getDadosEscola(),
  ])

  return <UnidadesClient unidades={unidades} escola={escola} />
}