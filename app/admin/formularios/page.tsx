import { getFormularios, contarRespostas } from './actions'
import { FormulariosClient } from './formularios-client'

export const dynamic = 'force-dynamic'

export default async function FormulariosPage() {
  const formularios = await getFormularios()

  const comContagem = await Promise.all(
    formularios.map(async (f) => ({
      ...f,
      total_respostas: await contarRespostas(f.id),
    }))
  )

  return <FormulariosClient formularios={comContagem} />
}