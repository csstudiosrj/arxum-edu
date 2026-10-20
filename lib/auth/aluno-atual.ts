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
    if (!user?.id || !user.email) return null

    const admin = createAdminClient()

    // 1. Tenta buscar pelo usuario_id (caminho feliz)
    let { data: aluno } = await admin
      .from('alunos')
      .select('id, escola_id, nome, data_nascimento, serie, turno, status, email_aluno, responsavel_nome, responsavel_email')
      .eq('usuario_id', user.id)
      .maybeSingle()

    // 2. FALLBACK: Se não achou, tenta pelo email_aluno
    if (!aluno) {
      const { data: alunoPorEmail } = await admin
        .from('alunos')
        .select('id, escola_id, nome, data_nascimento, serie, turno, status, email_aluno, responsavel_nome, responsavel_email')
        .eq('email_aluno', user.email)
        .maybeSingle()
      
      if (alunoPorEmail) {
        aluno = alunoPorEmail
        // Auto-corrige o vínculo para a próxima vez
        await admin.from('alunos').update({ usuario_id: user.id }).eq('id', aluno.id)
      }
    }

    // 3. SEGUNDO FALLBACK: Se não achou, tenta pelo responsavel_email (caso o aluno esteja usando o login do pai)
    if (!aluno) {
      const { data: alunoPorResponsavel } = await admin
        .from('alunos')
        .select('id, escola_id, nome, data_nascimento, serie, turno, status, email_aluno, responsavel_nome, responsavel_email')
        .eq('responsavel_email', user.email)
        .limit(1)
        .maybeSingle()
      
      if (alunoPorResponsavel) {
        aluno = alunoPorResponsavel
        await admin.from('alunos').update({ usuario_id: user.id }).eq('id', aluno.id)
      }
    }

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