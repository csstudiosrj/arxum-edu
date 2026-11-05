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

export async function getTemplates(): Promise<EmailTemplate[]> {
  const admin = createAdminClient()
  const { data } = await admin.from('email_templates').select('*').order('nome')
  return data || []
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

export async function enviarEmailManual(escolaId: string, templateId: string, faturaId?: string) {
  try {
    const admin = createAdminClient()
    const resend = new Resend(process.env.RESEND_API_KEY)

    // 1. Busca template e escola
    const { data: template } = await admin.from('email_templates').select('*').eq('id', templateId).single()
    const { data: escola } = await admin.from('escolas').select('*').eq('id', escolaId).single()

    if (!template || !escola) return { success: false, error: 'Template ou escola não encontrado.' }
    if (!escola.email_contato) return { success: false, error: 'A escola não possui e-mail de contato cadastrado.' }

    // 2. Variáveis base
    let variaveis: Record<string, string> = {
      '{{nome_escola}}': escola.nome,
      '{{email_escola}}': escola.email_contato,
    }

    // 3. Se tiver fatura, puxa os dados dela
    if (faturaId) {
      const { data: fatura } = await admin.from('faturamento_escolas').select('*').eq('id', faturaId).single()
      if (fatura) {
        variaveis['{{valor}}'] = `R$ ${(fatura.valor_centavos / 100).toFixed(2).replace('.', ',')}`
        variaveis['{{vencimento}}'] = new Date(fatura.vencimento).toLocaleDateString('pt-BR')
        variaveis['{{referencia}}'] = fatura.periodo_referencia || ''
        variaveis['{{link_pagamento}}'] = fatura.checkout_url || '#'
      }
    }

    // 4. Substitui as variáveis no HTML e no Assunto
    let htmlFinal = template.corpo_html
    let assuntoFinal = template.assunto

    Object.entries(variaveis).forEach(([chave, valor]) => {
      htmlFinal = htmlFinal.split(chave).join(valor)
      assuntoFinal = assuntoFinal.split(chave).join(valor)
    })

    // 5. Envia via Resend
    await resend.emails.send({
      from: 'ARXUM Edu <financeiro@arxum.com.br>',
      to: escola.email_contato,
      subject: assuntoFinal,
      html: htmlFinal
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
