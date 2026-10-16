import { createAdminClient } from '@/lib/supabase/admin'

export type MarcaEscola = {
  nome: string
  slug: string
  logoUrl: string | null
  corPrimaria: string
  usaBranding: boolean
  escolaId: string
}

export const COR_ARXUM = '#0d9488'

export function corSegura(cor: string | null | undefined): string {
  if (!cor) return COR_ARXUM
  if (!/^#[0-9a-fA-F]{6}$/.test(cor)) return COR_ARXUM
  return cor
}

export function marcaDaEscola(escola: {
  id?: string
  nome: string
  slug: string
  logo_url: string | null
  cor_primaria: string | null
  branding_portais: boolean | null
}): MarcaEscola {
  return {
    nome: escola.nome,
    slug: escola.slug,
    logoUrl: escola.logo_url,
    corPrimaria: corSegura(escola.cor_primaria),
    usaBranding: !!escola.branding_portais,
    escolaId: escola.id || '',
  }
}

export async function getMarcaPorSlug(slug: string): Promise<MarcaEscola | null> {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('escolas')
      .select('id, nome, slug, logo_url, cor_primaria, branding_portais')
      .eq('slug', slug)
      .maybeSingle()
    if (!data) return null
    return marcaDaEscola(data)
  } catch {
    return null
  }
}

export async function getMarcaPorEmail(email: string): Promise<MarcaEscola | null> {
  try {
    const admin = createAdminClient()

    // Busca o perfil do usuário para pegar o escola_id
    const { data: perfil } = await admin
      .from('perfis')
      .select('escola_id')
      .eq('email', email)
      .maybeSingle()

    if (perfil?.escola_id) {
      const { data } = await admin
        .from('escolas')
        .select('id, nome, slug, logo_url, cor_primaria, branding_portais')
        .eq('id', perfil.escola_id)
        .maybeSingle()
      if (data) return marcaDaEscola(data)
    }

    // Fallback: busca como responsável de aluno (não tem perfil ainda, mas tem aluno)
    const { data: aluno } = await admin
      .from('alunos')
      .select('escola_id')
      .eq('responsavel_email', email)
      .limit(1)
      .maybeSingle()

    if (aluno?.escola_id) {
      const { data } = await admin
        .from('escolas')
        .select('id, nome, slug, logo_url, cor_primaria, branding_portais')
        .eq('id', aluno.escola_id)
        .maybeSingle()
      if (data) return marcaDaEscola(data)
    }

    return null
  } catch {
    return null
  }
}

export async function getAddonsAtivosDaEscola(escolaId: string): Promise<string[]> {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('escolas_addons')
      .select('addon_slug')
      .eq('escola_id', escolaId)
      .eq('ativo', true)
    return (data || []).map((a) => a.addon_slug)
  } catch {
    return []
  }
}

export async function escolaTemAddon(escolaId: string, slug: string): Promise<boolean> {
  const addons = await getAddonsAtivosDaEscola(escolaId)
  return addons.includes(slug)
}