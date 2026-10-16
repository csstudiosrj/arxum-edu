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
  criado_em: string
}

const SLUGS_RESERVADOS = ['www', 'app', 'api', 'admin', 'edu', 'root', 'painel']

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

export async function getEscolaPadrao(): Promise<EscolaCompleta | null> {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('escolas')
      .select('*')
      .eq('slug', 'colegio-horizonte')
      .maybeSingle()
    return (data || null) as EscolaCompleta | null
  } catch (e) {
    return null
  }
}

/**
 * Extrai o slug da escola a partir do cabeçalho `x-escola-slug`
 * injetado pelo middleware a partir do subdomínio.
 * Fallback: 'colegio-horizonte'.
 */
export async function getSlugDaRequisicao(): Promise<string> {
  try {
    const headersList = await headers()
    const slug = headersList.get('x-escola-slug')
    if (slug && !SLUGS_RESERVADOS.includes(slug)) return slug
  } catch (e) {
    // headers() pode não estar disponível em certos contextos
  }
  return 'colegio-horizonte'
}

/**
 * Retorna a escola da requisição com base no subdomínio.
 * Usado pelas páginas públicas (matrícula, eduflix, sala-virtual, loja).
 */
export async function getEscolaDaRequisicao(): Promise<EscolaCompleta | null> {
  const slug = await getSlugDaRequisicao()
  const escola = await getEscolaPorSlug(slug)
  if (escola) return escola
  return await getEscolaPadrao()
}

export async function getNomeEscolaAtual(): Promise<string> {
  const escola = await getEscolaDoUsuario()
  return escola?.nome || 'Minha escola'
}