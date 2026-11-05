'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { revalidatePath } from 'next/cache'

export type EmailTemplate = {
  id: string
  slug: string
  nome: string
  assunto: string
  corpo_html: string
  ativo: boolean
  atualizado_em: string
}

// Molde visual ARXUM para envelopar o conteúdo do e-mail
function wrapEmailARXUM(conteudo: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f6f8f9; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5ecee; }
        .header { background-color: #0d9488; padding: 24px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: -0.5px; }
        .content { padding: 32px; color: #12232b; font-size: 15px; line-height: 1.6; }
        .content h2 { color: #0d9488; margin-top: 0; font-size: 20px; }
        .content a { color: #0d9488; font-weight: 600; text-decoration: none; }
        .footer { background-color: #fafcfc; padding: 20px; text-align: center; color: #82939a; font-size: 12px; border-top: 1px solid #e5ecee; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>ARXUM Edu</h1>
        </div>
        <div class="content">
          ${conteudo}
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} ARXUM Edu. Todos os direitos reservados.<br>
          Este é um e-mail automático, por favor não responda.
        </div>
      </div>
    </body>
    </html>
  `
}

export async function getTemplates(): Promise<EmailTemplate[]> {
  const admin = createAdminClient()
  const { data } = await admin.from('email_templates').select('*').order('nome')
  return data || []
}

export async function criarTemplate(data: { slug: string, nome: string, assunto: string, corpo_html: string }) {
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('email_templates').insert({
      slug: data.slug,
      nome: data.nome,
      assunto: data.assunto,
      corpo_html: data.corpo_html,
      ativo: true
    })

    if (error) return { success: false, error: error.message }
    revalidatePath('/super-admin/comunicacao')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao criar template.' }
  }
}

export async function atualizarTemplate(id: string, data: { assunto: string; corpo_html: string; ativo: boolean }) {
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('email_templates').update({
      assunto: data.assunto,
      corpo_html: data.corpo_html,
      ativo: data.ativo,
      atualizado_em: new Date().toISOString()
    }).eq('id', id)

    if (error) return { success: false, error: error.message }
    revalidatePath('/super-admin/comunicacao')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao atualizar template.' }
  }
}

export async function excluirTemplate(id: string) {
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('email_templates').delete().eq('id', id)
    if (error) return { success: false, error: error.message }
    revalidatePath('/super-admin/comunicacao')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao excluir template.' }
  }
}

export async function enviarEmailManual(escolaId: string, templateId: string, faturaId?: string) {
  try {
    const admin = createAdminClient()
    const resend = new Resend(process.env.RESEND_API_KEY)

    const { data: template } = await admin.from('email_templates').select('*').eq('id', templateId).single()
    const { data: escola } = await admin.from('escolas').select('*').eq('id', escolaId).single()

    if (!template || !escola) return { success: false, error: 'Template ou escola não encontrado.' }
    if (!escola.email_contato) return { success: false, error: 'A escola não possui e-mail de contato cadastrado.' }

    let variaveis: Record<string, string> = {
      '{{nome_escola}}': escola.nome,
      '{{email_escola}}': escola.email_contato,
    }

    if (faturaId) {
      const { data: fatura } = await admin.from('faturamento_escolas').select('*').eq('id', faturaId).single()
      if (fatura) {
        variaveis['{{valor}}'] = `R$ ${(fatura.valor_centavos / 100).toFixed(2).replace('.', ',')}`
        variaveis['{{vencimento}}'] = new Date(fatura.vencimento).toLocaleDateString('pt-BR')
        variaveis['{{referencia}}'] = fatura.periodo_referencia || ''
        variaveis['{{link_pagamento}}'] = fatura.checkout_url || '#'
      }
    }

    let htmlFinal = template.corpo_html
    let assuntoFinal = template.assunto

    Object.entries(variaveis).forEach(([chave, valor]) => {
      htmlFinal = htmlFinal.split(chave).join(valor)
      assuntoFinal = assuntoFinal.split(chave).join(valor)
    })

    // Aplica o molde visual bonito antes de enviar
    const htmlComMolde = wrapEmailARXUM(htmlFinal)

    await resend.emails.send({
      from: 'ARXUM Edu <financeiro@arxum.com.br>',
      to: escola.email_contato,
      subject: assuntoFinal,
      html: htmlComMolde
    })

    return { success: true }
  } catch (e: any) {
    console.error(e)
    return { success: false, error: 'Erro ao enviar e-mail.' }
  }
}

export async function getEscolasParaComunicacao() {
  const admin = createAdminClient()
  const { data } = await admin.from('escolas').select('id, nome, email_contato').order('nome')
  return data || []
}

export async function getFaturasDaEscola(escolaId: string) {
  const admin = createAdminClient()
  const { data } = await admin.from('faturamento_escolas').select('id, descricao, valor_centavos, status').eq('escola_id', escolaId).order('vencimento', { ascending: false }).limit(10)
  return data || []
}
