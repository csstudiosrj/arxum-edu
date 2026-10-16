'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getEscolaDoUsuario } from '@/lib/auth/escola-atual'
import { createClient } from '@/lib/supabase/server'
import { enviarConviteEquipe } from '@/lib/emails/convite-equipe'
import { PAPEIS_INTERNOS } from './papeis'
import { revalidatePath } from 'next/cache'

export type UsuarioInterno = {
  id: string
  nome: string
  email: string
  papel: string
  disciplinas: string[] | null
  telefone: string | null
  ativo: boolean
  unidade_id: string | null
  unidade_nome: string | null
  criado_em: string
  e_admin: boolean
}

export type NovoUsuario = {
  nome: string
  email: string
  papel: string
  telefone: string
  unidade_id: string | null
}

export async function getUsuariosInternos(): Promise<UsuarioInterno[]> {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return []

    const admin = createAdminClient()

    const { data: perfis, error } = await admin
      .from('perfis')
      .select('id, nome, email, papel, disciplinas, telefone, ativo, unidade_id, criado_em')
      .eq('escola_id', escola.id)
      .in('papel', ['admin_escola', 'direcao', 'coordenacao', 'secretaria', 'financeiro', 'professor'])
      .order('criado_em', { ascending: true })

    if (error || !perfis) return []

    const unidadesIds = Array.from(new Set(perfis.map((p) => p.unidade_id).filter(Boolean))) as string[]
    const nomesPorUnidade: Record<string, string> = {}
    if (unidadesIds.length > 0) {
      const { data: unidades } = await admin
        .from('unidades')
        .select('id, nome')
        .in('id', unidadesIds)
      ;(unidades || []).forEach((u) => { nomesPorUnidade[u.id] = u.nome })
    }

    const primeiroAdmin = perfis.find((p) => p.papel === 'admin_escola')

    return perfis.map((p) => ({
      id: p.id,
      nome: p.nome,
      email: p.email,
      papel: p.papel,
      disciplinas: Array.isArray(p.disciplinas) ? p.disciplinas : [],
      telefone: p.telefone,
      ativo: p.ativo,
      unidade_id: p.unidade_id,
      unidade_nome: p.unidade_id ? nomesPorUnidade[p.unidade_id] || null : null,
      criado_em: p.criado_em,
      e_admin: primeiroAdmin?.id === p.id,
    })) as UsuarioInterno[]
  } catch (e) {
    console.error('Erro ao buscar usuários:', e)
    return []
  }
}

export async function convidarUsuario(data: NovoUsuario) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    if (!data.nome.trim()) return { success: false, error: 'Informe o nome.' }
    if (!data.email.includes('@')) return { success: false, error: 'E-mail inválido.' }

    const papeisValidos = PAPEIS_INTERNOS.map((p) => p.key)
    if (!papeisValidos.includes(data.papel as any)) {
      return { success: false, error: 'Papel inválido.' }
    }

    const admin = createAdminClient()

    const supabaseAuth = await createClient()
    const { data: { user: userAtual } } = await supabaseAuth.auth.getUser()
    let convidadoPor = 'A equipe da escola'
    if (userAtual?.email) {
      const { data: perfilAtual } = await admin
        .from('perfis')
        .select('nome')
        .eq('email', userAtual.email)
        .maybeSingle()
      convidadoPor = perfilAtual?.nome || 'A direção'
    }

    const { data: usuarios } = await admin.auth.admin.listUsers()
    let usuario = (usuarios?.users || []).find((u) => u.email === data.email)

    if (!usuario) {
      const { data: novo, error: erroAuth } = await admin.auth.admin.createUser({
        email: data.email,
        email_confirm: true,
        user_metadata: { nome: data.nome, papel: data.papel },
      })

      if (erroAuth || !novo.user) {
        return { success: false, error: erroAuth?.message || 'Erro ao criar usuário.' }
      }
      usuario = novo.user
    }

    const { data: perfilExistente } = await admin
      .from('perfis')
      .select('escola_id, papel')
      .eq('id', usuario.id)
      .maybeSingle()

    if (perfilExistente?.escola_id && perfilExistente.escola_id !== escola.id) {
      return { success: false, error: 'Este e-mail já está vinculado a outra escola.' }
    }

    const { error: erroPerfil } = await admin
      .from('perfis')
      .update({
        escola_id: escola.id,
        nome: data.nome,
        papel: data.papel,
        telefone: data.telefone || null,
        unidade_id: data.unidade_id || null,
        ativo: true,
      })
      .eq('id', usuario.id)

    if (erroPerfil) return { success: false, error: erroPerfil.message }

    const { data: linkData, error: erroLink } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: data.email,
      options: { redirectTo: 'https://arxum.com.br/dashboard' },
    })

    if (erroLink || !linkData?.properties?.action_link) {
      return { success: false, error: erroLink?.message || 'Erro ao gerar link.' }
    }

    const envio = await enviarConviteEquipe({
      para: data.email,
      nome: data.nome,
      papel: data.papel,
      escolaNome: escola.nome,
      escolaSlug: escola.slug,
      linkMagico: linkData.properties.action_link,
      convidadoPor,
    })

    if (!envio.success) {
      return { success: false, error: envio.error || 'Erro ao enviar e-mail.' }
    }

    revalidatePath('/admin/usuarios')
    return { success: true }
  } catch (e) {
    console.error('Erro ao convidar usuário:', e)
    return { success: false, error: 'Erro ao convidar usuário.' }
  }
}

export async function atualizarUsuario(id: string, data: {
  nome?: string
  papel?: string
  telefone?: string | null
  unidade_id?: string | null
  ativo?: boolean
}) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()

    if (data.papel !== undefined) {
      const { data: perfis } = await admin
        .from('perfis')
        .select('id, papel, criado_em')
        .eq('escola_id', escola.id)
        .in('papel', ['admin_escola', 'direcao', 'coordenacao', 'secretaria', 'financeiro', 'professor'])
        .order('criado_em', { ascending: true })

      const primeiroAdmin = (perfis || []).find((p) => p.papel === 'admin_escola')

      if (primeiroAdmin?.id === id && data.papel !== 'admin_escola') {
        return { success: false, error: 'Não é possível alterar o papel do administrador principal.' }
      }

      const papeisValidos = PAPEIS_INTERNOS.map((p) => p.key)
      if (!papeisValidos.includes(data.papel as any)) {
        return { success: false, error: 'Papel inválido.' }
      }
    }

    const payload: Record<string, any> = {}
    if (data.nome !== undefined) payload.nome = data.nome
    if (data.papel !== undefined) payload.papel = data.papel
    if (data.telefone !== undefined) payload.telefone = data.telefone
    if (data.unidade_id !== undefined) payload.unidade_id = data.unidade_id
    if (data.ativo !== undefined) payload.ativo = data.ativo

    const { error } = await admin
      .from('perfis')
      .update(payload)
      .eq('id', id)
      .eq('escola_id', escola.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/usuarios')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao atualizar usuário.' }
  }
}

export async function reenviarConviteUsuario(id: string) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()

    const { data: perfil } = await admin
      .from('perfis')
      .select('nome, email, papel')
      .eq('id', id)
      .eq('escola_id', escola.id)
      .maybeSingle()

    if (!perfil) return { success: false, error: 'Usuário não encontrado.' }

    const supabaseAuth = await createClient()
    const { data: { user: userAtual } } = await supabaseAuth.auth.getUser()
    let convidadoPor = 'A equipe da escola'
    if (userAtual?.email) {
      const { data: perfilAtual } = await admin
        .from('perfis')
        .select('nome')
        .eq('email', userAtual.email)
        .maybeSingle()
      convidadoPor = perfilAtual?.nome || 'A direção'
    }

    const { data: linkData, error: erroLink } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: perfil.email,
      options: { redirectTo: 'https://arxum.com.br/dashboard' },
    })

    if (erroLink || !linkData?.properties?.action_link) {
      return { success: false, error: erroLink?.message || 'Erro ao gerar link.' }
    }

    const envio = await enviarConviteEquipe({
      para: perfil.email,
      nome: perfil.nome,
      papel: perfil.papel,
      escolaNome: escola.nome,
      escolaSlug: escola.slug,
      linkMagico: linkData.properties.action_link,
      convidadoPor,
    })

    if (!envio.success) {
      return { success: false, error: envio.error || 'Erro ao enviar e-mail.' }
    }

    revalidatePath('/admin/usuarios')
    return { success: true, enviadoPara: perfil.email }
  } catch (e) {
    return { success: false, error: 'Erro ao reenviar convite.' }
  }
}

export async function excluirUsuario(id: string) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()

    const { data: perfis } = await admin
      .from('perfis')
      .select('id, papel, criado_em')
      .eq('escola_id', escola.id)
      .in('papel', ['admin_escola', 'direcao', 'coordenacao', 'secretaria', 'financeiro', 'professor'])
      .order('criado_em', { ascending: true })

    const primeiroAdmin = (perfis || []).find((p) => p.papel === 'admin_escola')
    if (primeiroAdmin?.id === id) {
      return { success: false, error: 'Não é possível excluir o administrador principal.' }
    }

    const { data: perfil } = await admin
      .from('perfis')
      .select('id')
      .eq('id', id)
      .eq('escola_id', escola.id)
      .maybeSingle()

    if (!perfil) return { success: false, error: 'Usuário não encontrado.' }

    const { error } = await admin.auth.admin.deleteUser(id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/usuarios')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao excluir usuário.' }
  }
}

export async function getUnidadesParaUsuario(): Promise<Array<{ id: string; nome: string }>> {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return []

    const admin = createAdminClient()
    const { data } = await admin
      .from('unidades')
      .select('id, nome')
      .eq('escola_id', escola.id)
      .eq('ativa', true)
      .order('nome', { ascending: true })

    return (data || []) as Array<{ id: string; nome: string }>
  } catch (e) {
    return []
  }
}