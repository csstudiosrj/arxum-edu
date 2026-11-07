import { getFaturas, getAlunosParaFatura, getConfiguracaoFinanceiro } from './actions'
import { FinanceiroClient } from './financeiro-client'

export const dynamic = 'force-dynamic'

export default async function FinanceiroPage() {
  const [faturas, alunos, regras] = await Promise.all([
    getFaturas(), 
    getAlunosParaFatura(),
    getConfiguracaoFinanceiro()
  ])
  return <FinanceiroClient faturas={faturas} alunos={alunos} regrasIniciais={regras} />
}