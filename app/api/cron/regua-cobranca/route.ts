import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Segurança: A Vercel envia o token configurado no CRON_SECRET
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

  const ontem = new Date(hoje)
  ontem.setDate(ontem.getDate() - 1)

  const strD3 = daqui3Dias.toISOString().split('T')[0]
  const strD1 = ontem.toISOString().split('T')[0]

  let enviadosD3 = 0
  let enviadosD1 = 0

  try {
    // 1. Faturas que vencem em 3 dias (D-3)
    const { data: faturasD3 } = await admin
      .from('faturamento_escolas')
      .select('*, escolas(email_contato)')
      .eq('status', 'em_aberto')
      .eq('vencimento', strD3)
      .eq('aviso_d3_enviado', false)

    if (faturasD3 && faturasD3.length > 0 && process.env.RESEND_API_KEY) {
      for (const fatura of faturasD3) {
        const emailEscola = fatura.escolas?.email_contato
        if (emailEscola) {
          await resend.emails.send({
            from: 'ARXUM Edu <financeiro@arxum.com.br>',
            to: emailEscola,
            subject: `Lembrete: Fatura vence em 3 dias - ${fatura.escola_nome}`,
            html: `
              <div style="font-family: sans-serif; color: #12232b; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #0d9488;">Olá, ${fatura.escola_nome}!</h2>
                <p>Este é um lembrete amigável de que a fatura referente a <strong>${fatura.periodo_referencia}</strong> vencerá em 3 dias (${new Date(fatura.vencimento).toLocaleDateString('pt-BR')}).</p>
                <p>Valor: <strong>R$ ${(fatura.valor_centavos / 100).toFixed(2).replace('.', ',')}</strong></p>
                ${fatura.checkout_url ? `<p><a href="${fatura.checkout_url}" style="background-color: #0d9488; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Pagar agora via PIX, Boleto ou Cartão</a></p>` : ''}
                <p style="font-size: 12px; color: #6b7d86; margin-top: 30px;">Se você já realizou o pagamento, desconsidere este e-mail.</p>
              </div>
            `
          })
          
          await admin.from('faturamento_escolas').update({ aviso_d3_enviado: true }).eq('id', fatura.id)
          enviadosD3++
        }
      }
    }

    // 2. Faturas vencidas ontem (D+1)
    const { data: faturasD1 } = await admin
      .from('faturamento_escolas')
      .select('*, escolas(email_contato)')
      .neq('status', 'pago')
      .eq('vencimento', strD1)
      .eq('aviso_d1_enviado', false)

    if (faturasD1 && faturasD1.length > 0 && process.env.RESEND_API_KEY) {
      for (const fatura of faturasD1) {
        // Atualiza status para vencido
        await admin.from('faturamento_escolas').update({ status: 'vencido' }).eq('id', fatura.id)

        const emailEscola = fatura.escolas?.email_contato
        if (emailEscola) {
          await resend.emails.send({
            from: 'ARXUM Edu <financeiro@arxum.com.br>',
            to: emailEscola,
            subject: `Aviso: Fatura vencida - ${fatura.escola_nome}`,
            html: `
              <div style="font-family: sans-serif; color: #12232b; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #991b1b;">Olá, ${fatura.escola_nome}.</h2>
                <p>Identificamos que a fatura referente a <strong>${fatura.periodo_referencia}</strong> venceu ontem (${new Date(fatura.vencimento).toLocaleDateString('pt-BR')}).</p>
                <p>Valor em aberto: <strong style="color: #991b1b;">R$ ${(fatura.valor_centavos / 100).toFixed(2).replace('.', ',')}</strong></p>
                ${fatura.checkout_url ? `<p><a href="${fatura.checkout_url}" style="background-color: #0d9488; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Regularizar pagamento</a></p>` : ''}
                <p style="font-size: 12px; color: #6b7d86; margin-top: 30px;">Se você já realizou o pagamento, desconsidere este e-mail.</p>
              </div>
            `
          })
          
          await admin.from('faturamento_escolas').update({ aviso_d1_enviado: true }).eq('id', fatura.id)
          enviadosD1++
        }
      }
    }

    return NextResponse.json({ ok: true, enviadosD3, enviadosD1 })
  } catch (error: any) {
    console.error('Erro na régua de cobrança:', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}
