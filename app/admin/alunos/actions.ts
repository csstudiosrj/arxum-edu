'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getEscolaDoUsuario } from '@/lib/auth/escola-atual'
import { revalidatePath } from 'next/cache'

export type Aluno = {
  id: string
  nome: string
  serie: string | null
  turno: string | null
  responsavel_nome: string
  responsavel_email: string
  responsavel_telefone: string | null
  email_aluno: string | null
  usuario_id: string | null
  status: string
  criado_em: string
}

export async function getAlunos(): Promise<Aluno[]> {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return []

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('alunos')
      .select('id, nome, serie, turno, responsavel_nome, responsavel_email, responsavel_telefone, email_aluno, usuario_id, status, criado_em')
      .eq('escola_id', escola.id)
      .order('nome', { ascending: true })

    if (error) return []
    return (data || []) as Aluno[]
  } catch (e) {
    return []
  }
}

export async function convidarAlunoParaPortal(alunoId: string, emailAluno: string) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    if (!emailAluno || !emailAluno.includes('@')) {
      return { success: false, error: 'Informe um e-mail válido para o aluno.' }
    }

    const admin = createAdminClient()

    // Salva o e-mail no aluno
    const { error: erroUpdate } = await admin
      .from('alunos')
      .update({ email_aluno: emailAluno })
      .eq('id', alunoId)
      .eq('escola_id', escola.id)

    if (erroUpdate) return { success: false, error: erroUpdate.message }

    // Cria usuário no auth (se não existir)
    const { data: existente } = await admin.auth.admin.listUsers()
    const usuarioExiste = (existente?.users || []).some((u) => u.email === emailAluno)

    if (!usuarioExiste) {
      const { error: erroAuth } = await admin.auth.admin.createUser({
        email: emailAluno,
        email_confirm: true,
      })

      if (erroAuth) {
        return { success: false, error: erroAuth.message }
      }
    }

    // Vincula manualmente (caso o trigger não tenha rodado)
    const { data: usuario } = await admin.auth.admin.listUsers()
    const usuarioCriado = (usuario?.users || []).find((u) => u.email === emailAluno)

    if (usuarioCriado) {
      await admin
        .from('alunos')
        .update({ usuario_id: usuarioCriado.id })
        .eq('id', alunoId)
    }

    revalidatePath('/admin/alunos')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao convidar aluno.' }
  }
}