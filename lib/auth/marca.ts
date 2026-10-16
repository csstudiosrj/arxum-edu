import { createAdminClient } from '@/lib/supabase/admin'

export type MarcaEscola = {
  nome: string
  slug: string
  logoUrl: string | null
  corPrimaria: string
  usaBranding: boolean
}

export const COR_ARXUM = '#0d9488'

export function corSegura(cor: string | null | undefined): string {
  if (!cor) return COR_ARXUM
  if (!/^#[0-9a-fA-F]{6}$/.test(cor)) return COR_ARXUM
  return cor
}

export function marcaDaEscola(escola: {
  nome: string
  slug: string
  logo_url: string | null
  cor_primaria: string | null
  branding_portais: boolean
}): MarcaEscola {
  return {
    nome: escola.nome,
    slug: escola.slug,
    logoUrl: escola.logo_url,
    corPrimaria: corSegura(escola.cor_primaria),
    usaBranding: escola.branding_portais,
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