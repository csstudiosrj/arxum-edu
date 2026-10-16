import { notFound } from 'next/navigation'
import { getFormularioPorId, getRespostas } from '../../actions'
import { RespostasClient } from './respostas-client'

export const dynamic = 'force-dynamic'

export default async function RespostasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getFormularioPorId(id)
  if (!data) notFound()

  const respostas = await getRespostas(id)

  return <RespostasClient formulario={data.formulario} campos={data.campos} respostas={respostas} />
}