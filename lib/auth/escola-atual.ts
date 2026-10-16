'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'

export type EscolaCompleta = {
  id: string
  nome: string
  slug: string
  plano: string
  cnpj: string | null
  endereco: string | null
  cidade: string | null
  estado: string | null
  telefone: string | null
  email_contato: string | null
  site: string | null
  logo_url: string | null
  cor_primaria: string | null
  fonte_par: string | null
  tema: string | null
  branding_portais: boolean
  criado_em: string
}

export async function getEscolaDoUsuario(): Promise<EscolaCompleta | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) return null

    const admin = createAdminClient()
    const { data: perfil } = await admin
      .from('perfis')
      .select('escola_id')
      .eq('id', user.id)
      .maybeSingle()

    if (!perfil?.escola_id) return null
    return await getEscolaPorId(perfil.escola_id)
  } catch (e) {
    console.error('Erro ao buscar escola do usuário:', e)
    return null
  }
}

export async function getEscolaPorId(id: string): Promise<EscolaCompleta | null> {
  try {
    const admin = createAdminClient()
    const { data } = await admin.from('escolas').select('*').eq('id', id).maybeSingle()
    return (data || null) as EscolaCompleta | null
  } catch (e) {
    return null
  }
}

export async function getEscolaPorSlug(slug: string): Promise<EscolaCompleta | null> {
  try {
    const admin = createAdminClient()
    const { data } = await admin.from('escolas').select('*').eq('slug', slug).maybeSingle()
    return (data || null) as EscolaCompleta | null
  } catch (e) {
    return null
  }
}

export async function getEscolaDaRequisicao(): Promise<EscolaCompleta | null> {
  try {
    const headersList = await headers()
    const slug = headersList.get('x-escola-slug')
    if (!slug) return null
    return await getEscolaPorSlug(slug)
  } catch (e) {
    return null
  }
}

export async function getNomeEscolaAtual(): Promise<string> {
  const escola = await getEscolaDoUsuario()
  return escola?.nome || 'Minha escola'
}