import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getEscolaDaRequisicao } from '@/lib/auth/escola-atual'
import { getProdutosLoja } from './actions'
import { LojaClient } from './loja-client'

export const dynamic = 'force-dynamic'

export default async function LojaPage() {
  const escola = await getEscolaDaRequisicao()
  if (!escola) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const produtos = await getProdutosLoja()

  return <LojaClient produtos={produtos} estaLogado={!!user} />
}