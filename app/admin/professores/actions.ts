'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getEscolaDoUsuario } from '@/lib/auth/escola-atual'
import { enviarConviteProfessor } from '@/lib/emails/convite-professor'
import { revalidatePath } from 'next/cache'

export type Professor = {
  id: string
  nome: string
  email: string
  papel: string
  disciplinas: string[] | null
  telefone: string | null
  ativo: boolean
  criado_em: string
}

export type NovoProfessor = {
  nome: string
  email: string
  disciplinas: string[]
  telefone: string
}

export async function getProfessores(): Promise<Professor[]> {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return []

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('perfis')
      .select('id, nome, email, papel, disciplinas, telefone, ativo, criado_em')
      .eq('escola_id', escola.id)
      .in('papel', ['professor', 'coordenacao', 'direcao'])
      .order('nome', { ascending: true })

    if (error) return []
    return (data || []) as Professor[]
  } catch (e) {
    return []
  }
}

export async function convidarProfessor(data: NovoProfessor) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    if (!data.nome.trim()) return { success: false, error: 'Informe o nome.' }
    if (!data.email.includes('@')) return { success: false, error: 'E-mail inválido.' }

    const admin = createAdminClient()

    const { data: usuarios } = await admin.auth.admin.listUsers()
    let usuario = (usuarios?.users || []).find((u) => u.email === data.email)

    if (!usuario) {
      const { data: novo, error: erroAuth } = await admin.auth.admin.createUser({
        email: data.email,
        email_confirm: true,
        user_metadata: { nome: data.nome, papel: 'professor' },
      })

      if (erroAuth || !novo.user) {
        return { success: false, error: erroAuth?.message || 'Erro ao criar usuário.' }
      }
      usuario = novo.user
    }

    const { error: erroPerfil } = await admin
      .from('perfis')
      .update({
        escola_id: escola.id,
        nome: data.nome,
        papel: 'professor',
        disciplinas: data.disciplinas,
        telefone: data.telefone || null,
        ativo: true,
      })
      .eq('id', usuario.id)

    if (erroPerfil) {
      return { success: false, error: erroPerfil.message }
    }

    const { data: linkData, error: erroLink } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: data.email,
      options: { redirectTo: 'https://arxum.com.br/primeiro-acesso' },
    })

    if (erroLink || !linkData?.properties?.action_link) {
      return { success: false, error: erroLink?.message || 'Erro ao gerar link.' }
    }

    const envio = await enviarConviteProfessor({
      para: data.email,
      professorNome: data.nome,
      escolaNome: escola.nome,
      escolaSlug: escola.slug,
      linkMagico: linkData.properties.action_link,
    })

    if (!envio.success) {
      return { success: false, error: envio.error || 'Erro ao enviar e-mail.' }
    }

    revalidatePath('/admin/professores')
    return { success: true }
  } catch (e) {
    console.error('Erro ao convidar professor:', e)
    return { success: false, error: 'Erro ao convidar professor.' }
  }
}

export async function atualizarProfessor(id: string, data: { nome: string, telefone: string, disciplinas: string[] }) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    if (!data.nome.trim()) return { success: false, error: 'Informe o nome.' }

    const admin = createAdminClient()

    const { error } = await admin
      .from('perfis')
      .update({
        nome: data.nome,
        telefone: data.telefone || null,
        disciplinas: data.disciplinas,
      })
      .eq('id', id)
      .eq('escola_id', escola.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/professores')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao atualizar professor.' }
  }
}

export async function reenviarConviteProfessor(professorId: string) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()

    const { data: perfil } = await admin
      .from('perfis')
      .select('nome, email')
      .eq('id', professorId)
      .eq('escola_id', escola.id)
      .maybeSingle()

    if (!perfil) return { success: false, error: 'Professor não encontrado.' }
    if (!perfil.email) return { success: false, error: 'Este professor não tem e-mail cadastrado.' }

    const { data: usuario } = await admin.auth.admin.getUserById(professorId)
    if (!usuario?.user) {
      return { success: false, error: 'Usuário não encontrado. Convide novamente.' }
    }

    const { data: linkData, error: erroLink } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: perfil.email,
      options: { redirectTo: 'https://arxum.com.br/primeiro-acesso' },
    })

    if (erroLink || !linkData?.properties?.action_link) {
      return { success: false, error: erroLink?.message || 'Erro ao gerar link.' }
    }

    const envio = await enviarConviteProfessor({
      para: perfil.email,
      professorNome: perfil.nome,
      escolaNome: escola.nome,
      escolaSlug: escola.slug,
      linkMagico: linkData.properties.action_link,
    })

    if (!envio.success) {
      return { success: false, error: envio.error || 'Erro ao enviar e-mail.' }
    }

    revalidatePath('/admin/professores')
    return { success: true, enviadoPara: perfil.email }
  } catch (e) {
    console.error('Erro ao reenviar convite:', e)
    return { success: false, error: 'Erro ao reenviar convite.' }
  }
}

export async function alternarAtivoProfessor(id: string, ativo: boolean) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const { error } = await admin
      .from('perfis')
      .update({ ativo })
      .eq('id', id)
      .eq('escola_id', escola.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/professores')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro.' }
  }
}

export async function excluirProfessor(id: string) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()

    const { data: perfil } = await admin
      .from('perfis')
      .select('id')
      .eq('id', id)
      .eq('escola_id', escola.id)
      .maybeSingle()

    if (!perfil) return { success: false, error: 'Professor não encontrado.' }

    const { error } = await admin.auth.admin.deleteUser(id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/professores')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao excluir.' }
  }
}