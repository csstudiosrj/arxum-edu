import { getDadosEscola } from '../configuracoes/actions'
import { getAddonsDaEscola } from './actions'
import { PersonalizacaoClient } from './personalizacao-client'

export const dynamic = 'force-dynamic'

export default async function PersonalizacaoPage() {
  const [escola, addons] = await Promise.all([
    getDadosEscola(),
    getAddonsDaEscola(),
  ])

  return <PersonalizacaoClient escola={escola} addons={addons} />
}