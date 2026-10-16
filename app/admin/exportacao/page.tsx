import { getResumoExportacao, getAlunosParaExportar } from './actions'
import { ExportacaoClient } from './exportacao-client'

export const dynamic = 'force-dynamic'

export default async function ExportacaoPage() {
  const [resumo, alunos] = await Promise.all([
    getResumoExportacao(),
    getAlunosParaExportar(),
  ])

  return <ExportacaoClient resumo={resumo} alunos={alunos} />
}