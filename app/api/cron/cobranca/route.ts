import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(request: Request) {
  // Opcional: Proteger a rota com um token no header para segurança extra
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const admin = createAdminClient()
    
    // 1. Buscar todas as escolas com régua configurada
    const { data: escolas } = await admin
      .from('escolas')
      .select('id, nome, config_financeiro')
      .not('config_financeiro', 'is', null)

    if (!escolas) return NextResponse.json({ success: true, message: 'Nenhuma escola encontrada.' })

    let totalEmailsEnviados = 0

    // 2. Para cada escola, verificar as faturas e as regras
    for (const escola of escolas) {
      const regras = (escola.config_financeiro as any[]) || []
      if (regras.length === 0) continue

      // Buscar faturas não pagas
      const { data: faturas } = await admin
        .from('faturas')
        .select('*')
        .eq('escola_id', escola.id)
        .in('status', ['em_aberto', 'vencido'])

      if (!faturas || faturas.length === 0) continue

      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0) // Zerar hora para comparar apenas o dia

      for (const fatura of faturas) {
        if (!fatura.responsavel_email) continue
        
        const vencimento = new Date(fatura.vencimento + 'T12:00:00')
        const diffTempo = vencimento.getTime() - hoje.getTime()
        const diffDias = Math.round(diffTempo / (1000 * 3600 * 24)) // Diferença em dias (positivo se for futuro, negativo se passado)

        const enviadas = fatura.cobrancas_enviadas || []

        // 3. Verificar se alguma regra bate com a data de hoje
        for (const regra of regras) {
          if (!regra.ativo) continue

          const diasAlvo = regra.tipo === 'antes' ? regra.dias : -regra.dias
          
          if (diffDias === diasAlvo && !enviadas.includes(regra.id)) {
            // DEVE ENVIAR O EMAIL
            
            const templateVars = {
              '{{nome_escola}}': escola.nome,
              '{{valor}}': `R$ ${(fatura.valor_centavos / 100).toFixed(2).replace('.', ',')}`,
              '{{vencimento}}': vencimento.toLocaleDateString('pt-BR'),
              '{{referencia}}': fatura.descricao,
              '{{link_pagamento}}': fatura.pix_copia_cola || fatura.boleto_url || 'Acesse o portal'
            }

            // Gerar HTML simples (idealmente puxaria do template do banco)
            let assunto = diffDias < 0 ? `Fatura Vencida: ${fatura.descricao}` : `Lembrete de Vencimento: ${fatura.descricao}`
            let html = `<p>Olá,</p><p>Sua fatura referente a <strong>${fatura.descricao}</strong> no valor de <strong>${templateVars['{{valor}}']}</strong> vence em <strong>${templateVars['{{vencimento}}']}</strong>.</p><p><a href="${templateVars['{{link_pagamento}}']}">Clique aqui para pagar</a></p>`

            if (process.env.RESEND_API_KEY) {
              await resend.emails.send({
                from: 'ARXUM Edu <financeiro@arxum.com.br>',
                to: fatura.responsavel_email,
                subject: assunto,
                html: `<div style="font-family: sans-serif; color: #12232b; max-width: 600px; margin: 0 auto; border: 1px solid #e5ecee; border-radius: 12px; overflow: hidden;"><div style="background-color: #0d9488; padding: 24px; text-align: center;"><h1 style="color: white; margin: 0; font-size: 24px;">${escola.nome}</h1></div><div style="padding: 32px;">${html}</div></div>`
              })

              // Registrar que o e-mail foi enviado
              await admin.from('faturas').update({
                cobrancas_enviadas: [...enviadas, regra.id]
              }).eq('id', fatura.id)

              totalEmailsEnviados++
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true, emails_enviados: totalEmailsEnviados })
  } catch (error) {
    console.error('Erro no cron de cobrança:', error)
    return NextResponse.json({ success: false, error: 'Erro interno no cron.' }, { status: 500 })
  }
}