import { getMinhasFaturasArxum } from './actions'
import { AssinaturaClient } from './assinatura-client'
import { getDadosEscola } from '../configuracoes/actions'
import { getAddonsDaEscola } from '../addons/actions'

export const dynamic = 'force-dynamic'

export default async function AssinaturaPage() {
  const [faturas, escola, addonsData] = await Promise.all([
    getMinhasFaturasArxum(),
    getDadosEscola(),
    getAddonsDaEscola()
  ])

  const addonsAtivos = addonsData.addons.filter(a => a.ativo)

  return (
    <AssinaturaClient 
      faturas={faturas} 
      planoAtual={escola?.plano || 'semente'} 
      addonsAtivos={addonsAtivos}
    />
  )
}