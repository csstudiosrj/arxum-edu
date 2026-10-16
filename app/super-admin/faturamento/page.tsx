import { getFaturamento, getEscolasParaFatura } from '../actions'
import { FaturamentoClient } from './faturamento-client'

export const dynamic = 'force-dynamic'

export default async function FaturamentoPage() {
  const [faturamento, escolas] = await Promise.all([getFaturamento(), getEscolasParaFatura()])
  return <FaturamentoClient faturamento={faturamento} escolas={escolas} />
}