import { getFaturas, getAlunosParaFatura } from './actions'
import { FinanceiroClient } from './financeiro-client'

export const dynamic = 'force-dynamic'

export default async function FinanceiroPage() {
  const [faturas, alunos] = await Promise.all([getFaturas(), getAlunosParaFatura()])
  return <FinanceiroClient faturas={faturas} alunos={alunos} />
}