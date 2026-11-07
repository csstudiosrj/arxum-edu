import { getResumoAno, listarAlunosParaArquivar } from './actions'
import { AnoLetivoClient } from './ano-letivo-client'

export const dynamic = 'force-dynamic'

export default async function AnoLetivoPage() {
  const [resumo, alunos] = await Promise.all([
    getResumoAno(),
    listarAlunosParaArquivar()
  ])

  return <AnoLetivoClient resumoInicial={resumo} alunosIniciais={alunos} />
}