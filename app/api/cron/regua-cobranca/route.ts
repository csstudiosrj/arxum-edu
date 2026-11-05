import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { criarNotificacaoSuper } from '@/app/super-admin/notificacoes-actions'

export const dynamic = 'force-dynamic'

// Molde visual ARXUM (o mesmo do editor de comunicação)
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
      return { html: wrapEmailARXUM(html), assunto }
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
            
            await criarNotificacaoSuper(
              'financeiro',
              'Aviso D-3 Enviado',
              `Lembrete de vencimento enviado para ${fatura.escola_nome}.`,
              '/super-admin/financeiro'
            )
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

            await criarNotificacaoSuper(
              'financeiro',
              'Fatura Vencida',
              `A fatura de ${fatura.escola_nome} venceu e o aviso D+1 foi enviado.`,
              `/super-admin/financeiro?escolaId=${fatura.escola_id}`
            )
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
