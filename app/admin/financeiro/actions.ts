'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getEscolaDoUsuario } from '@/lib/auth/escola-atual'
import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'
import { criarPagamentoPix, criarPagamentoBoleto } from '@/lib/mercadopago'

export type Fatura = {
  id: string
  escola_id: string
  aluno_id: string | null
  aluno_nome: string
  responsavel_email: string
  descricao: string
  valor_centavos: number
  vencimento: string
  status: string
  pago_em: string | null
  criado_em: string
  gateway?: string | null
  gateway_payment_id?: string | null
  gateway_status?: string | null
  metodo_pagamento?: string | null
  pix_copia_cola?: string | null
  pix_qr_imagem?: string | null
  pix_expira_em?: string | null
  boleto_linha?: string | null
  boleto_url?: string | null
  cobrancas_enviadas?: string[] | null
}

export type RegraCobranca = {
  id: string
  dias: number
  tipo: 'antes' | 'depois'
  ativo: boolean
}

export async function getFaturas(): Promise<Fatura[]> {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return []

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('faturas')
      .select('*')
      .eq('escola_id', escola.id)
      .order('criado_em', { ascending: false })

    if (error) return []
    return (data || []) as Fatura[]
  } catch (e) {
    return []
  }
}

export async function getAlunosParaFatura(): Promise<Array<{ id: string; nome: string; responsavel_email: string }>> {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return []

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('alunos')
      .select('id, nome, responsavel_email')
      .eq('escola_id', escola.id)
      .eq('status', 'ativo')
      .order('nome', { ascending: true })

    if (error) return []
    return (data || []) as Array<{ id: string; nome: string; responsavel_email: string }>
  } catch (e) {
    return []
  }
}

export async function getConfiguracaoFinanceiro(): Promise<RegraCobranca[]> {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return []

    const admin = createAdminClient()
    const { data } = await admin
      .from('escolas')
      .select('config_financeiro')
      .eq('id', escola.id)
      .maybeSingle()

    const regras = (data?.config_financeiro as RegraCobranca[]) || []
    return regras
  } catch (e) {
    return []
  }
}

export async function salvarReguaCobranca(regras: RegraCobranca[]) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const { error } = await admin
      .from('escolas')
      .update({ config_financeiro: regras })
      .eq('id', escola.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/financeiro')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao salvar.' }
  }
}

export async function criarFatura(data: {
  aluno_id?: string
  aluno_nome: string
  responsavel_email: string
  descricao: string
  valor_centavos: number
  vencimento: string
}) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    
    let finalAlunoId = data.aluno_id
    if (!finalAlunoId) {
      const { data: aluno } = await admin
        .from('alunos')
        .select('id')
        .eq('escola_id', escola.id)
        .eq('responsavel_email', data.responsavel_email)
        .limit(1)
        .maybeSingle()
      finalAlunoId = aluno?.id
    }

    const { data: fatura, error } = await admin.from('faturas').insert({
      escola_id: escola.id,
      aluno_id: finalAlunoId || null,
      aluno_nome: data.aluno_nome,
      responsavel_email: data.responsavel_email,
      descricao: data.descricao,
      valor_centavos: data.valor_centavos,
      vencimento: data.vencimento,
      status: 'em_aberto',
      cobrancas_enviadas: []
    }).select('id').single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/financeiro')
    return { success: true, faturaId: fatura.id }
  } catch (e) {
    return { success: false, error: 'Erro ao criar fatura.' }
  }
}

export async function gerarPixAdmin(faturaId: string) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const { data: fatura } = await admin.from('faturas').select('*').eq('id', faturaId).eq('escola_id', escola.id).single()
    if (!fatura) return { success: false, error: 'Fatura não encontrada.' }

    const { data: escolaData } = await admin.from('escolas').select('mercadopago_access_token').eq('id', escola.id).single()
    const token = (escolaData as any)?.mercadopago_access_token
    if (!token) return { success: false, error: 'A escola não configurou o Mercado Pago nas Configurações.' }

    const pix = await criarPagamentoPix({
      accessToken: token,
      faturaId: fatura.id,
      valorCentavos: fatura.valor_centavos,
      descricao: `${fatura.descricao} - ${fatura.aluno_nome}`,
      emailPagador: fatura.responsavel_email,
    })

    if (!pix.success) return { success: false, error: pix.error }

    await admin.from('faturas').update({
      gateway: 'mercadopago',
      gateway_payment_id: pix.paymentId,
      gateway_status: pix.status,
      pix_copia_cola: pix.pixCopiaCola,
      pix_qr_imagem: pix.pixQrImagem,
      pix_expira_em: pix.expiraEm,
      metodo_pagamento: 'pix',
    }).eq('id', faturaId)

    revalidatePath('/admin/financeiro')
    return { success: true, pix: { copiaCola: pix.pixCopiaCola, qr: pix.pixQrImagem } }
  } catch (e) {
    return { success: false, error: 'Erro ao gerar PIX.' }
  }
}

export async function enviarCobrancaEmail(faturaId: string, regraId?: string) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const { data: fatura } = await admin.from('faturas').select('*').eq('id', faturaId).eq('escola_id', escola.id).single()
    if (!fatura) return { success: false, error: 'Fatura não encontrada.' }

    if (!fatura.responsavel_email) return { success: false, error: 'Responsável sem e-mail cadastrado.' }

    const { data: template } = await admin.from('email_templates').select('*').eq('slug', 'cobranca_manual').maybeSingle()
    if (!template) return { success: false, error: 'Template de cobrança não encontrado.' }

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      
      let html = template.corpo_html
      let assunto = template.assunto
      
      const vars: Record<string, string> = {
        '{{nome_escola}}': escola.nome,
        '{{valor}}': `R$ ${(fatura.valor_centavos / 100).toFixed(2).replace('.', ',')}`,
        '{{vencimento}}': new Date(fatura.vencimento + 'T12:00:00').toLocaleDateString('pt-BR'),
        '{{referencia}}': fatura.descricao,
        '{{link_pagamento}}': fatura.pix_copia_cola || fatura.boleto_url || `${process.env.NEXT_PUBLIC_SITE_URL}/edu/responsavel`
      }
      
      Object.entries(vars).forEach(([k, v]) => {
        html = html.split(k).join(v)
        assunto = assunto.split(k).join(v)
      })

      await resend.emails.send({
        from: 'ARXUM Edu <financeiro@arxum.com.br>',
        to: fatura.responsavel_email,
        subject: assunto,
        html: `<div style="font-family: sans-serif; color: #12232b; max-width: 600px; margin: 0 auto; border: 1px solid #e5ecee; border-radius: 12px; overflow: hidden;"><div style="background-color: #0d9488; padding: 24px; text-align: center;"><h1 style="color: white; margin: 0; font-size: 24px;">${escola.nome}</h1></div><div style="padding: 32px;">${html}</div></div>`
      })

      // Se foi a régua automática, salva o ID da regra para não enviar de novo
      if (regraId) {
        const enviadas = fatura.cobrancas_enviadas || []
        await admin.from('faturas').update({
          cobrancas_enviadas: [...enviadas, regraId]
        }).eq('id', faturaId)
      }
    }

    revalidatePath('/admin/financeiro')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao enviar e-mail.' }
  }
}

export async function excluirFatura(id: string) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const { error } = await admin
      .from('faturas')
      .delete()
      .eq('id', id)
      .eq('escola_id', escola.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/financeiro')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao excluir fatura.' }
  }
}