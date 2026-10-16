import { notFound } from 'next/navigation'
import { getFormularioPorId } from '../actions'
import { ConstrutorClient } from './construtor-client'

export const dynamic = 'force-dynamic'

export default async function ConstrutorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getFormularioPorId(id)

  if (!data) notFound()

  return <ConstrutorClient formulario={data.formulario} camposIniciais={data.campos} />
}