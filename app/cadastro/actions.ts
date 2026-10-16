'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export type CadastroInput = {
  escola_nome: string
  escola_cnpj: string
  admin_nome: string
  admin_email: string
  admin_senha: string
  admin_telefone: string
  plano: string
}

function gerarSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50)
}

export async function cadastrarEscola(data: CadastroInput) {
  try {
    const admin = createAdminClient()

    // 1. Validar e-mail único
    const { data: perfilExistente } = await admin
      .from('perfis')
      .select('id')
      .eq('email', data.admin_email)
      .maybeSingle()

    if (perfilExistente) {
      return { success: false, error: 'Este e-mail já está cadastrado.' }
    }

    // 2. Gerar slug único
    let slug = gerarSlug(data.escola_nome)
    let contador = 0
    let slugFinal = slug
    while (true) {
      const { data: existente } = await admin
        .from('escolas')
        .select('id')
        .eq('slug', slugFinal)
        .maybeSingle()
      if (!existente) break
      contador++
      slugFinal = `${slug}-${contador}`
    }

    // 3. Criar escola
    const { data: escola, error: erroEscola } = await admin
      .from('escolas')
      .insert({
        nome: data.escola_nome,
        slug: slugFinal,
        plano: data.plano,
      })
      .select('id, slug')
      .single()

    if (erroEscola || !escola) {
      return { success: false, error: erroEscola?.message || 'Erro ao criar escola.' }
    }

    // 4. Criar usuário no Auth
    const { data: authUser, error: erroAuth } = await admin.auth.admin.createUser({
      email: data.admin_email,
      password: data.admin_senha,
      email_confirm: true,
      user_metadata: { nome: data.admin_nome },
    })

    if (erroAuth || !authUser.user) {
      await admin.from('escolas').delete().eq('id', escola.id)
      return { success: false, error: erroAuth?.message || 'Erro ao criar usuário.' }
    }

    // 5. Vincular perfil à escola (o trigger já criou o perfil)
    const { error: erroPerfil } = await admin
      .from('perfis')
      .update({
        escola_id: escola.id,
        nome: data.admin_nome,
        papel: 'admin_escola',
        ativo: true,
      })
      .eq('id', authUser.user.id)

    if (erroPerfil) {
      await admin.auth.admin.deleteUser(authUser.user.id)
      await admin.from('escolas').delete().eq('id', escola.id)
      return { success: false, error: 'Erro ao vincular perfil à escola.' }
    }

    // 6. Fazer login automático
    const supabase = await createClient()
    const { error: erroLogin } = await supabase.auth.signInWithPassword({
      email: data.admin_email,
      password: data.admin_senha,
    })

    if (erroLogin) {
      return { success: true, redirect: '/login', aviso: 'Conta criada! Faça login para continuar.' }
    }

    return { success: true, redirect: '/dashboard' }
  } catch (e) {
    return { success: false, error: 'Erro inesperado. Tente novamente.' }
  }
}

export async function verificarSlug(slug: string): Promise<boolean> {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('escolas')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()
    return !data
  } catch {
    return false
  }
}