'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { enviarConfirmacaoCadastro } from '@/lib/emails/cadastro'
import { registrarConsentimento } from '@/lib/consentimentos-server'
import { POLITICA_VERSAO, TERMOS_VERSAO } from '@/lib/consentimentos'

export type CadastroInput = {
  escola_nome: string
  escola_razao_social: string
  escola_cnpj: string
  escola_cep: string
  escola_endereco: string
  escola_numero: string
  escola_bairro: string
  escola_cidade: string
  escola_estado: string
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
      return { success: false, error: 'Este e-mail já está cadastrado no sistema. Tente fazer login ou use outro e-mail.' }
    }

    // 2. Validar CNPJ único (TRAVA DE SEGURANÇA ADICIONADA AQUI)
    const cnpjLimpo = data.escola_cnpj.replace(/\D/g, '')
    
    // Busca tanto formatado quanto limpo para garantir compatibilidade com cadastros antigos
    const { data: cnpjExistente } = await admin
      .from('escolas')
      .select('id')
      .or(`cnpj.eq.${cnpjLimpo},cnpj.eq.${data.escola_cnpj}`)
      .maybeSingle()

    if (cnpjExistente) {
      return { success: false, error: 'Este CNPJ já está cadastrado para outra escola. Cada escola deve ter um CNPJ exclusivo.' }
    }

    // 3. Gerar slug único
    let slug = gerarSlug(data.escola_nome)
    let contador = 0
    let slugFinal = slug
    while (true) {
      const { data: existente } = await admin.from('escolas').select('id').eq('slug', slugFinal).maybeSingle()
      if (!existente) break
      contador++
      slugFinal = `${slug}-${contador}`
    }

    // 4. Criar escola
    const { data: escola, error: erroEscola } = await admin
      .from('escolas')
      .insert({
        nome: data.escola_nome,
        razao_social: data.escola_razao_social,
        slug: slugFinal,
        cnpj: data.escola_cnpj,
        cep: data.escola_cep,
        endereco: data.escola_endereco,
        numero: data.escola_numero,
        bairro: data.escola_bairro,
        cidade: data.escola_cidade,
        estado: data.escola_estado,
        telefone: data.admin_telefone,
        email_contato: data.admin_email,
        plano: data.plano,
        status_assinatura: 'trial',
      })
      .select('id, slug, nome')
      .single()

    if (erroEscola || !escola) {
      // Fallback para caso o banco rejeite por duplicidade (erro 23505)
      if (erroEscola?.code === '23505') {
         return { success: false, error: 'Este CNPJ já está cadastrado no banco de dados.' }
      }
      return { success: false, error: erroEscola?.message || 'Erro ao criar escola no banco.' }
    }

    // 5. Criar usuário no Auth
    const { data: authUser, error: erroAuth } = await admin.auth.admin.createUser({
      email: data.admin_email,
      password: data.admin_senha,
      email_confirm: false,
      user_metadata: { nome: data.admin_nome, papel: 'admin_escola' },
    })

    if (erroAuth || !authUser.user) {
      await admin.from('escolas').delete().eq('id', escola.id)
      return { success: false, error: erroAuth?.message || 'Erro ao criar credenciais de acesso.' }
    }

    // 6. Vincular perfil à escola
    const { error: erroPerfil } = await admin
      .from('perfis')
      .update({ escola_id: escola.id, nome: data.admin_nome, papel: 'admin_escola', ativo: true })
      .eq('id', authUser.user.id)

    if (erroPerfil) {
      await admin.auth.admin.deleteUser(authUser.user.id)
      await admin.from('escolas').delete().eq('id', escola.id)
      return { success: false, error: 'Erro ao vincular perfil ao usuário.' }
    }

    // 7. Registrar consentimentos
    try {
      const consentimentoBase = { escolaId: escola.id, usuarioId: authUser.user.id, responsavelEmail: data.admin_email, alunoNome: null }
      await registrarConsentimento({ ...consentimentoBase, tipo: 'politica_privacidade', versao: POLITICA_VERSAO })
      await registrarConsentimento({ ...consentimentoBase, tipo: 'termos_uso', versao: TERMOS_VERSAO })
    } catch (e) {}

    // 8. Gerar link de confirmação
    const { data: linkData, error: erroLink } = await admin.auth.admin.generateLink({
      type: 'signup',
      email: data.admin_email,
      password: data.admin_senha,
      options: { redirectTo: 'https://arxum.com.br/edu/dashboard' },
    })

    if (erroLink || !linkData?.properties?.action_link) {
      return { success: true, proximo_passo: 'confirmar_email', email: data.admin_email, slug: escola.slug, aviso: 'Conta criada, mas falha ao gerar link.' }
    }

    // 9. Enviar e-mail
    const envio = await enviarConfirmacaoCadastro({
      para: data.admin_email,
      nome: data.admin_nome,
      escolaNome: escola.nome,
      linkConfirmacao: linkData.properties.action_link,
    })

    if (!envio.success) {
      return { success: false, error: `Erro no envio do e-mail (Resend): ${envio.error}` }
    }

    return { success: true, proximo_passo: 'confirmar_email', email: data.admin_email, slug: escola.slug }
  } catch (e: any) {
    console.error('Erro fatal no cadastro:', e)
    return { success: false, error: e.message || 'Erro inesperado ao criar a conta.' }
  }
}

export async function reenviarConfirmacao(email: string) {
  try {
    const admin = createAdminClient()
    const { data: usuarios } = await admin.auth.admin.listUsers()
    const user = (usuarios?.users || []).find((u) => u.email === email)
    if (!user) return { success: false, error: 'Conta não encontrada.' }
    if (user.email_confirmed_at) return { success: false, error: 'Este e-mail já foi confirmado.' }

    const { data: perfil } = await admin.from('perfis').select('nome, escola_id').eq('id', user.id).maybeSingle()
    const { data: escola } = perfil?.escola_id ? await admin.from('escolas').select('nome').eq('id', perfil.escola_id).maybeSingle() : { data: null }

    const { data: linkData, error: erroLink } = await admin.auth.admin.generateLink({
      type: 'signup',
      email: user.email!,
      password: 'temp-' + Math.random().toString(36).slice(2),
      options: { redirectTo: 'https://arxum.com.br/edu/dashboard' },
    })

    if (erroLink || !linkData?.properties?.action_link) {
      const { error: erroInvite } = await admin.auth.admin.inviteUserByEmail(user.email!, { redirectTo: 'https://arxum.com.br/edu/dashboard' })
      if (erroInvite) return { success: false, error: 'Não foi possível reenviar agora.' }
      return { success: true }
    }

    const envio = await enviarConfirmacaoCadastro({
      para: user.email!,
      nome: perfil?.nome || 'Administrador',
      escolaNome: escola?.nome || 'Sua escola',
      linkConfirmacao: linkData.properties.action_link,
    })

    if (!envio.success) return { success: false, error: `Erro no Resend: ${envio.error}` }
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao reenviar.' }
  }
}