'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitFormularioPublico(slug: string, dados: Record<string, any>) {
  try {
    const admin = createAdminClient()

    const { data: formulario } = await admin
      .from('formularios')
      .select('id, escola_id, status, redirecionar_url')
      .eq('slug', slug)
      .eq('status', 'publicado')
      .maybeSingle()

    if (!formulario) return { success: false, error: 'Formulário não encontrado.' }

    // Tenta capturar o e-mail de quem respondeu (se estiver logado)
    let email: string | null = null
    let alunoNome: string | null = null
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      email = user?.email || null

      if (email) {
        const { data: aluno } = await admin
          .from('alunos')
          .select('nome')
          .eq('responsavel_email', email)
          .eq('escola_id', formulario.escola_id)
          .limit(1)
          .maybeSingle()
        alunoNome = aluno?.nome || null
      }
    } catch {
      // sem usuário logado, segue sem e-mail
    }

    const { error } = await admin.from('formulario_respostas').insert({
      formulario_id: formulario.id,
      escola_id: formulario.escola_id,
      responsavel_email: email,
      aluno_nome: alunoNome,
      dados,
    })

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/formularios')
    return {
      success: true,
      redirecionar_url: formulario.redirecionar_url,
    }
  } catch (e) {
    return { success: false, error: 'Erro ao enviar resposta.' }
  }
}