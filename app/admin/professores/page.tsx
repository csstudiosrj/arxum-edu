import { getProfessores } from './actions'
import { ProfessoresClient } from './professores-client'

export const dynamic = 'force-dynamic'

export default async function ProfessoresPage() {
  const professores = await getProfessores()
  return <ProfessoresClient professores={professores} />
}