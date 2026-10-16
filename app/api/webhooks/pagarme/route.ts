import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Doc: https://docs.pagar.me/reference/visão-geral-sobre-webhooks
// A Pagar.me faz POST pra URL configurada sempre que um evento ocorre.
// Não assina por HMAC — recomendamos whitelist de IP em produção.

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const eventId = body.id as string | undefined
    const eventType = body.type as string | undefined

    if (!eventId || !eventType) {
      return NextResponse.json({ ok: false, error: 'Payload inválido.' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Idempotência: se já processamos esse evento, retorna OK sem repetir.
    const { data: existente } = await admin
      .from('pagarme_webhooks')
      .select('id, processado')
      .eq('event_id', eventId)
      .maybeSingle()

    if (existente?.processado) {
      return NextResponse.json({ ok: true, jaProcessado: true })
    }

    let webhookId = existente?.id as string | undefined

    if (!existente) {
      const { data: inserted, error: erroInsert } = await admin
        .from('pagarme_webhooks')
        .insert({
          event_id: eventId,
          event_type: eventType,
          payload: body,
          processado: false,
        })
        .select('id')
        .single()

      if (erroInsert || !inserted) {
        console.error('[webhook pagarme] Erro ao registrar:', erroInsert)
        return NextResponse.json({ ok: false, error: 'Erro ao registrar evento.' }, { status: 500 })
      }
      webhookId = inserted.id
    }

    // ── Processa por tipo de evento ─────────────────────────────────
    let processadoComSucesso = false
    let erroProcessamento: string | null = null

    try {
      const eventosDeOrder = ['order.paid', 'order.payment_failed', 'order.canceled', 'order.created']

      if (eventosDeOrder.includes(eventType)) {
        const orderId = body.data?.id as string | undefined
        const orderCode = body.data?.code as string | undefined
        const statusPagar = body.data?.status as string | undefined

        if (orderId || orderCode) {
          // Tenta achar em faturas primeiro
          let faturaQuery = admin.from('faturas').select('id').limit(1)
          if (orderId) faturaQuery = faturaQuery.eq('pagarme_order_id', orderId)

          const { data: faturas } = await faturaQuery
          const fatura = faturas?.[0]

          if (fatura) {
            const novoStatus =
              eventType === 'order.paid' ? 'pago'
              : eventType === 'order.canceled' ? 'cancelado'
              : 'em_aberto'

            await admin
              .from('faturas')
              .update({
                status: novoStatus,
                pagarme_status: statusPagar || null,
                ...(novoStatus === 'pago' ? { pago_em: new Date().toISOString() } : {}),
                atualizado_em: new Date().toISOString(),
              })
              .eq('id', fatura.id)

            processadoComSucesso = true
          }

          // Senão, tenta em pedidos
          if (!processadoComSucesso) {
            let pedidoQuery = admin.from('pedidos').select('id').limit(1)
            if (orderId) pedidoQuery = pedidoQuery.eq('pagarme_order_id', orderId)

            const { data: pedidos } = await pedidoQuery
            const pedido = pedidos?.[0]

            if (pedido) {
              const novoStatus =
                eventType === 'order.paid' ? 'pago'
                : eventType === 'order.canceled' ? 'cancelado'
                : 'pendente'

              await admin
                .from('pedidos')
                .update({
                  status: novoStatus,
                  pagarme_status: statusPagar || null,
                  atualizado_em: new Date().toISOString(),
                })
                .eq('id', pedido.id)

              processadoComSucesso = true
            }
          }
        }

        if (!processadoComSucesso) {
          erroProcessamento = `Nenhum registro encontrado para order_id=${orderId} / code=${orderCode}`
        }
      } else {
        // Eventos que não processamos ainda — só registramos pra auditoria.
        processadoComSucesso = true
      }
    } catch (e) {
      erroProcessamento = e instanceof Error ? e.message : String(e)
      console.error('[webhook pagarme] Erro no processamento:', e)
    }

    // Marca como processado (ou registra o erro).
    if (webhookId) {
      await admin
        .from('pagarme_webhooks')
        .update({
          processado: processadoComSucesso,
          erro: erroProcessamento,
        })
        .eq('id', webhookId)
    }

    return NextResponse.json({ ok: true, processado: processadoComSucesso })
  } catch (e) {
    console.error('[webhook pagarme] Erro inesperado:', e)
    return NextResponse.json({ ok: false, error: 'Erro interno.' }, { status: 500 })
  }
}

// Health check — útil quando você cadastra a URL no dashboard.
export async function GET() {
  return NextResponse.json({ ok: true, service: 'ARXUM Edu · Pagar.me webhook' })
}