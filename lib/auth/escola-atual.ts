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
  razao_social: string | null
  cep: string | null
  endereco: string | null
  numero: string | null
  bairro: string | null
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

    // 1. Tenta buscar escola via perfil (Admin, Professor, etc)
    const { data: perfil } = await admin
      .from('perfis')
      .select('escola_id, papel')
      .eq('id', user.id)
      .maybeSingle()

    if (perfil?.escola_id) {
      return await getEscolaPorId(perfil.escola_id)
    }

    // 2. Fallback: Se for aluno, busca a escola do aluno
    const { data: aluno } = await admin
      .from('alunos')
      .select('escola_id')
      .eq('usuario_id', user.id)
      .maybeSingle()

    if (aluno?.escola_id) {
      return await getEscolaPorId(aluno.escola_id)
    }

    // 3. Fallback: Se for responsável, busca a escola do primeiro filho
    if (user.email) {
      const { data: alunoResp } = await admin
        .from('alunos')
        .select('escola_id')
        .eq('responsavel_email', user.email)
        .limit(1)
        .maybeSingle()
      
      if (alunoResp?.escola_id) {
        return await getEscolaPorId(alunoResp.escola_id)
      }
    }

    return null
  } catch (e) {
    console.error('Erro ao buscar escola do usuário:', e)
    return null
  }
}

export async function getEscolaPorId(id: string): Promise<EscolaCompleta | null> {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('escolas')
      .select('*')
      .eq('id', id)
      .maybeSingle()
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

// ── MARCA ATUAL (nome + cor primária + logo) ────────────────────────

export type MarcaAtual = {
  nome: string
  corPrimaria: string
  logoUrl: string | null
}

const COR_FALLBACK = '#0d9488'

function corValida(cor: string | null | undefined): string {
  if (!cor) return COR_FALLBACK
  if (!/^#[0-9a-fA-F]{6}$/.test(cor)) return COR_FALLBACK
  return cor
}

export async function getMarcaEscolaAtual(): Promise<MarcaAtual> {
  const escola = await getEscolaDoUsuario()
  if (!escola) {
    return { nome: 'Minha escola', corPrimaria: COR_FALLBACK, logoUrl: null }
  }
  return {
    nome: escola.nome,
    corPrimaria: corValida(escola.cor_primaria),
    logoUrl: escola.logo_url,
  }
}