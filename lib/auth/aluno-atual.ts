'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type AlunoCompleto = {
  id: string
  escola_id: string
  nome: string
  data_nascimento: string | null
  serie: string | null
  turno: string | null
  status: string
  email_aluno: string | null
  responsavel_nome: string
  responsavel_email: string
  escola_nome: string
  escola_slug: string
  escola_fonte_par: string | null
}

export async function getAlunoDoUsuario(): Promise<AlunoCompleto | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) return null

    const admin = createAdminClient()

    const { data: aluno } = await admin
      .from('alunos')
      .select('id, escola_id, nome, data_nascimento, serie, turno, status, email_aluno, responsavel_nome, responsavel_email')
      .eq('usuario_id', user.id)
      .maybeSingle()

    if (!aluno) return null

    const { data: escola } = await admin
      .from('escolas')
      .select('nome, slug, fonte_par')
      .eq('id', aluno.escola_id)
      .maybeSingle()

    return {
      ...aluno,
      escola_nome: escola?.nome || 'Escola',
      escola_slug: escola?.slug || '',
      escola_fonte_par: escola?.fonte_par || null,
    } as AlunoCompleto
  } catch (e) {
    console.error('Erro ao buscar aluno do usuário:', e)
    return null
  }
}