import { getMarcaPorSlug, type MarcaEscola } from '@/lib/auth/marca'
import { LoginClient } from './login-client'

export const dynamic = 'force-dynamic'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ escola?: string }>
}) {
  const params = await searchParams
  const escolaSlug = params.escola || ''

  let marca: MarcaEscola | null = null
  if (escolaSlug) {
    marca = await getMarcaPorSlug(escolaSlug)
  }

  return <LoginClient marcaInicial={marca} escolaSlug={escolaSlug} />
}