import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const admin = createAdminClient()

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const daqui3Dias = new Date(hoje)
  daqui3Dias.setDate(daqui3Dias.getDate() + 3)
  const strD3 = daqui3Dias.toISOString().split('T')[0]

  const ontem = new Date(hoje)
  ontem.setDate(ontem.getDate() - 1)
  const strD1 = ontem.toISOString().split('T')[0]

  let enviadosD3 = 0
  let enviadosD1 = 0

  try {
    // Busca os templates ativos no banco
    const { data: templates } = await admin.from('email_templates').select('*').eq('ativo', true)
    const tplD3 = templates?.find(t => t.slug === 'aviso_d3')
    const tplD1 = templates?.find(t => t.slug === 'aviso_d1')

    // Função auxiliar para substituir variáveis
    const buildEmail = (tpl: any, fatura: any) => {
      let html = tpl.corpo_html
      let assunto = tpl.assunto
      const vars: Record<string, string> = {
        '{{nome_escola}}': fatura.escola_nome,
        '{{valor}}': `R$ ${(fatura.valor_centavos / 100).toFixed(2).replace('.', ',')}`,
        '{{vencimento}}': new Date(fatura.vencimento).toLocaleDateString('pt-BR'),
        '{{referencia}}': fatura.periodo_referencia || '',
        '{{link_pagamento}}': fatura.checkout_url || '#'
      }
      Object.entries(vars).forEach(([k, v]) => {
        html = html.split(k).join(v)
        assunto = assunto.split(k).join(v)
      })
      return { html, assunto }
    }

    // 1. D-3
    if (tplD3) {
      const { data: faturasD3 } = await admin.from('faturamento_escolas').select('*, escolas(email_contato)').eq('status', 'em_aberto').eq('vencimento', strD3).eq('aviso_d3_enviado', false)
      if (faturasD3 && faturasD3.length > 0 && process.env.RESEND_API_KEY) {
        for (const fatura of faturasD3) {
          const emailEscola = fatura.escolas?.email_contato
          if (emailEscola) {
            const { html, assunto } = buildEmail(tplD3, fatura)
            await resend.emails.send({ from: 'ARXUM Edu <financeiro@arxum.com.br>', to: emailEscola, subject: assunto, html })
            await admin.from('faturamento_escolas').update({ aviso_d3_enviado: true }).eq('id', fatura.id)
            enviadosD3++
          }
        }
      }
    }

    // 2. D+1
    if (tplD1) {
      const { data: faturasD1 } = await admin.from('faturamento_escolas').select('*, escolas(email_contato)').neq('status', 'pago').eq('vencimento', strD1).eq('aviso_d1_enviado', false)
      if (faturasD1 && faturasD1.length > 0 && process.env.RESEND_API_KEY) {
        for (const fatura of faturasD1) {
          await admin.from('faturamento_escolas').update({ status: 'vencido' }).eq('id', fatura.id)
          const emailEscola = fatura.escolas?.email_contato
          if (emailEscola) {
            const { html, assunto } = buildEmail(tplD1, fatura)
            await resend.emails.send({ from: 'ARXUM Edu <financeiro@arxum.com.br>', to: emailEscola, subject: assunto, html })
            await admin.from('faturamento_escolas').update({ aviso_d1_enviado: true }).eq('id', fatura.id)
            enviadosD1++
          }
        }
      }
    }

    return NextResponse.json({ ok: true, enviadosD3, enviadosD1 })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}
