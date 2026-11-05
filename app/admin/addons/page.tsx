import { getAddonsDaEscola } from './actions'
import { AddonsEscolaClient } from './addons-client'

export const dynamic = 'force-dynamic'

export default async function AddonsEscolaPage() {
  const { addons, totalAlunos } = await getAddonsDaEscola()
  return <AddonsEscolaClient addonsIniciais={addons} totalAlunos={totalAlunos} />
}
