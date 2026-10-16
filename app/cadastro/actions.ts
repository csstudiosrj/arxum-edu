'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { enviarConfirmacaoCadastro } from '@/lib/emails/cadastro'
import { registrarConsentimento } from '@/lib/consentimentos-server'
import { POLITICA_VERSAO, TERMOS_VERSAO } from '@/lib/consentimentos'

export type CadastroInput = {
  escola_nome: string
  escola_cnpj: string
  admin_nome: string
  admin_email: string
  admin_senha: string
  admin_telefone: string
  plano: string
  aceite_termos: boolean
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
    if (!data.aceite_termos) {
      return { success: false, error: 'É necessário aceitar os termos e a política de privacidade.' }
    }

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
        status_assinatura: 'trial',
      })
      .select('id, slug, nome')
      .single()

    if (erroEscola || !escola) {
      return { success: false, error: erroEscola?.message || 'Erro ao criar escola.' }
    }

    // 4. Criar usuário no Auth — sem auto-confirmar
    const { data: authUser, error: erroAuth } = await admin.auth.admin.createUser({
      email: data.admin_email,
      password: data.admin_senha,
      email_confirm: false,
      user_metadata: { nome: data.admin_nome, papel: 'admin_escola' },
    })

    if (erroAuth || !authUser.user) {
      await admin.from('escolas').delete().eq('id', escola.id)
      return { success: false, error: erroAuth?.message || 'Erro ao criar usuário.' }
    }

    // 5. Vincular perfil à escola
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

    // 6. Registrar consentimentos (best-effort)
    //    Política de privacidade + Termos de uso — os dois vêm do mesmo aceite.
    const consentimentoBase = {
      escolaId: escola.id,
      usuarioId: authUser.user.id,
      responsavelEmail: data.admin_email,
      alunoNome: null,
    }
    await registrarConsentimento({
      ...consentimentoBase,
      tipo: 'politica_privacidade',
      versao: POLITICA_VERSAO,
    })
    await registrarConsentimento({
      ...consentimentoBase,
      tipo: 'termos_uso',
      versao: TERMOS_VERSAO,
    })

    // 7. Gerar link de confirmação
    const { data: linkData, error: erroLink } = await admin.auth.admin.generateLink({
      type: 'signup',
      email: data.admin_email,
      password: data.admin_senha,
      options: { redirectTo: 'https://arxum.com.br/dashboard' },
    })

    if (erroLink || !linkData?.properties?.action_link) {
      return {
        success: true,
        proximo_passo: 'confirmar_email',
        email: data.admin_email,
        slug: escola.slug,
        aviso: 'Conta criada, mas houve falha ao gerar o link de confirmação. Contate o suporte.',
      }
    }

    // 8. Enviar e-mail de confirmação via Resend
    const envio = await enviarConfirmacaoCadastro({
      para: data.admin_email,
      nome: data.admin_nome,
      escolaNome: escola.nome,
      linkConfirmacao: linkData.properties.action_link,
    })

    if (!envio.success) {
      return {
        success: true,
        proximo_passo: 'confirmar_email',
        email: data.admin_email,
        slug: escola.slug,
        aviso: 'Conta criada. Houve problema ao enviar o e-mail, mas você pode tentar reenviar na próxima tela.',
      }
    }

    return {
      success: true,
      proximo_passo: 'confirmar_email',
      email: data.admin_email,
      slug: escola.slug,
    }
  } catch (e) {
    console.error('Erro no cadastro:', e)
    return { success: false, error: 'Erro inesperado. Tente novamente.' }
  }
}

export async function reenviarConfirmacao(email: string) {
  try {
    const admin = createAdminClient()

    const { data: usuarios } = await admin.auth.admin.listUsers()
    const user = (usuarios?.users || []).find((u) => u.email === email)

    if (!user) return { success: false, error: 'Conta não encontrada.' }
    if (user.email_confirmed_at) {
      return { success: false, error: 'Este e-mail já foi confirmado.' }
    }

    const { data: perfil } = await admin
      .from('perfis')
      .select('nome, escola_id')
      .eq('id', user.id)
      .maybeSingle()

    const { data: escola } = perfil?.escola_id
      ? await admin.from('escolas').select('nome').eq('id', perfil.escola_id).maybeSingle()
      : { data: null }

    const { data: linkData, error: erroLink } = await admin.auth.admin.generateLink({
      type: 'signup',
      email: user.email!,
      password: 'temp-' + Math.random().toString(36).slice(2),
      options: { redirectTo: 'https://arxum.com.br/dashboard' },
    })

    if (erroLink || !linkData?.properties?.action_link) {
      const { error: erroInvite } = await admin.auth.admin.inviteUserByEmail(user.email!, {
        redirectTo: 'https://arxum.com.br/dashboard',
      })
      if (erroInvite) {
        return { success: false, error: 'Não foi possível reenviar agora. Tente novamente em alguns minutos.' }
      }
      return { success: true }
    }

    const envio = await enviarConfirmacaoCadastro({
      para: user.email!,
      nome: perfil?.nome || 'Administrador',
      escolaNome: escola?.nome || 'Sua escola',
      linkConfirmacao: linkData.properties.action_link,
    })

    if (!envio.success) {
      return { success: false, error: 'Erro ao enviar e-mail.' }
    }

    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao reenviar.' }
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