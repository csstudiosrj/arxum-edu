import { getUsuariosInternos, getUnidadesParaUsuario } from './actions'
import { UsuariosClient } from './usuarios-client'

export const dynamic = 'force-dynamic'

export default async function UsuariosPage() {
  const [usuarios, unidades] = await Promise.all([
    getUsuariosInternos(),
    getUnidadesParaUsuario(),
  ])

  return <UsuariosClient usuarios={usuarios} unidades={unidades} />
}