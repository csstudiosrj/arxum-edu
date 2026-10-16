'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type ProfessorCompleto = {
  id: string
  escola_id: string
  nome: string
  email: string
  papel: string
  disciplinas: string[] | null
  telefone: string | null
  escola_nome: string
  escola_slug: string
}

export async function getProfessorDoUsuario(): Promise<ProfessorCompleto | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) return null

    const admin = createAdminClient()
    const { data: perfil } = await admin
      .from('perfis')
      .select('id, escola_id, nome, email, papel, disciplinas, telefone')
      .eq('id', user.id)
      .maybeSingle()

    if (!perfil?.escola_id) return null

    // Aceita apenas papéis que dão acesso ao portal do professor
    const papeisValidos = ['professor', 'coordenacao', 'direcao']
    if (!papeisValidos.includes(perfil.papel)) return null

    const { data: escola } = await admin
      .from('escolas')
      .select('nome, slug')
      .eq('id', perfil.escola_id)
      .maybeSingle()

    return {
      ...perfil,
      escola_nome: escola?.nome || 'Escola',
      escola_slug: escola?.slug || '',
    } as ProfessorCompleto
  } catch (e) {
    console.error('Erro ao buscar professor:', e)
    return null
  }
}