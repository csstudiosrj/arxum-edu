import { getProdutosLoja } from './actions'
import { LojaClient } from './loja-client'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function LojaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const produtos = await getProdutosLoja()

  return <LojaClient produtos={produtos} estaLogado={!!user} />
}