import { getProdutos, getPedidos } from './actions'
import { LojaAdminClient } from './loja-client'

export const dynamic = 'force-dynamic'

export default async function LojaAdminPage() {
  const [produtos, pedidos] = await Promise.all([getProdutos(), getPedidos()])
  return <LojaAdminClient produtos={produtos} pedidos={pedidos} />
}