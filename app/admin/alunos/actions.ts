'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getEscolaDoUsuario } from '@/lib/auth/escola-atual'
import { enviarConviteAluno } from '@/lib/emails/convite-aluno'
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

    const { data: aluno } = await admin
      .from('alunos')
      .select('nome')
      .eq('id', alunoId)
      .eq('escola_id', escola.id)
      .maybeSingle()

    if (!aluno) return { success: false, error: 'Aluno não encontrado.' }

    const { error: erroUpdate } = await admin
      .from('alunos')
      .update({ email_aluno: emailAluno })
      .eq('id', alunoId)
      .eq('escola_id', escola.id)

    if (erroUpdate) return { success: false, error: erroUpdate.message }

    const { data: usuarios } = await admin.auth.admin.listUsers()
    let usuarioExistente = (usuarios?.users || []).find((u) => u.email === emailAluno)

    if (!usuarioExistente) {
      const { data: novoUsuario, error: erroAuth } = await admin.auth.admin.createUser({
        email: emailAluno,
        email_confirm: true,
        user_metadata: { nome: aluno.nome, papel: 'aluno' },
      })

      if (erroAuth || !novoUsuario.user) {
        return { success: false, error: erroAuth?.message || 'Erro ao criar usuário.' }
      }

      usuarioExistente = novoUsuario.user

      await admin
        .from('perfis')
        .update({
          escola_id: escola.id,
          nome: aluno.nome,
          papel: 'aluno',
          ativo: true,
        })
        .eq('id', usuarioExistente.id)
    }

    await admin
      .from('alunos')
      .update({ usuario_id: usuarioExistente.id })
      .eq('id', alunoId)

    const { data: linkData, error: erroLink } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: emailAluno,
      options: { redirectTo: 'https://arxum.com.br/primeiro-acesso' },
    })

    if (erroLink || !linkData?.properties?.action_link) {
      return { success: false, error: erroLink?.message || 'Erro ao gerar link.' }
    }

    const envio = await enviarConviteAluno({
      para: emailAluno,
      alunoNome: aluno.nome,
      escolaNome: escola.nome,
      escolaSlug: escola.slug,
      linkMagico: linkData.properties.action_link,
    })

    if (!envio.success) {
      return { success: false, error: envio.error || 'Erro ao enviar e-mail.' }
    }

    revalidatePath('/admin/alunos')
    return { success: true }
  } catch (e) {
    console.error('Erro ao convidar aluno:', e)
    return { success: false, error: 'Erro ao convidar aluno.' }
  }
}

export async function reenviarConviteAluno(alunoId: string) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()

    const { data: aluno } = await admin
      .from('alunos')
      .select('nome, email_aluno, usuario_id')
      .eq('id', alunoId)
      .eq('escola_id', escola.id)
      .maybeSingle()

    if (!aluno) return { success: false, error: 'Aluno não encontrado.' }
    if (!aluno.email_aluno) return { success: false, error: 'Este aluno ainda não tem e-mail cadastrado.' }
    if (!aluno.usuario_id) return { success: false, error: 'O aluno ainda não foi vinculado ao portal.' }

    // Verifica se o usuário ainda existe no Auth
    const { data: usuario } = await admin.auth.admin.getUserById(aluno.usuario_id)
    if (!usuario?.user) {
      return { success: false, error: 'Usuário não encontrado. Convide novamente.' }
    }

    const { data: linkData, error: erroLink } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: aluno.email_aluno,
      options: { redirectTo: 'https://arxum.com.br/primeiro-acesso' },
    })

    if (erroLink || !linkData?.properties?.action_link) {
      return { success: false, error: erroLink?.message || 'Erro ao gerar link.' }
    }

    const envio = await enviarConviteAluno({
      para: aluno.email_aluno,
      alunoNome: aluno.nome,
      escolaNome: escola.nome,
      escolaSlug: escola.slug,
      linkMagico: linkData.properties.action_link,
    })

    if (!envio.success) {
      return { success: false, error: envio.error || 'Erro ao enviar e-mail.' }
    }

    revalidatePath('/admin/alunos')
    return { success: true, enviadoPara: aluno.email_aluno }
  } catch (e) {
    console.error('Erro ao reenviar convite:', e)
    return { success: false, error: 'Erro ao reenviar convite.' }
  }
}