import { getMinhasFaturasArxum } from './actions'
import { AssinaturaClient } from './assinatura-client'
import { getDadosEscola } from '../configuracoes/actions'
import { getAddonsDaEscola } from '../addons/actions'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export default async function AssinaturaPage() {
  const [faturas, escola, addonsData] = await Promise.all([
    getMinhasFaturasArxum(),
    getDadosEscola(),
    getAddonsDaEscola()
  ])

  const admin = createAdminClient()
  const { data: escolaInfo } = await admin
    .from('escolas')
    .select('status_assinatura, mercadopago_preapproval_id')
    .eq('id', escola?.id)
    .single()

  const addonsAtivos = addonsData.addons.filter(a => a.ativo)

  return (
    <AssinaturaClient 
      faturas={faturas} 
      planoAtual={escola?.plano || 'semente'} 
      addonsAtivos={addonsAtivos}
      statusAssinatura={escolaInfo?.status_assinatura || 'trial'}
      mercadopagoPreapprovalId={escolaInfo?.mercadopago_preapproval_id || null}
    />
  )
}