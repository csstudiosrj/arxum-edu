import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { searchParams } = new URL(request.url)
    const faturaId = searchParams.get('faturaId')
    const tipo = searchParams.get('tipo')

    // O Mercado Pago envia notificações com action: 'payment.created' ou 'payment.updated'
    // ou simplesmente type: 'payment' dependendo da versão da API.
    const isPayment = body.type === 'payment' || body.action?.includes('payment')
    const paymentId = body.data?.id

    if (!isPayment || !paymentId) {
      return NextResponse.json({ ok: true })
    }

    const token = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!token) {
      console.error('[Webhook MP] Token não configurado')
      return NextResponse.json({ ok: false }, { status: 500 })
    }

    // Consulta o pagamento real no Mercado Pago para garantir que foi aprovado
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    if (!res.ok) return NextResponse.json({ ok: false }, { status: 400 })
    const pagamento = await res.json()

    if (pagamento.status === 'approved') {
      const admin = createAdminClient()

      if (tipo === 'arxum') {
        // Baixa da fatura ARXUM -> Escola
        await admin.from('faturamento_escolas').update({
          status: 'pago',
          pago_em: new Date().toISOString(),
          gateway: 'mercadopago',
          gateway_payment_id: String(pagamento.id),
          gateway_status: pagamento.status
        }).eq('id', faturaId)
      } else {
        // Baixa de fatura da Escola -> Responsável
        await admin.from('faturas').update({
          status: 'pago',
          pago_em: new Date().toISOString(),
          gateway: 'mercadopago',
          gateway_payment_id: String(pagamento.id),
          gateway_status: pagamento.status
        }).eq('id', faturaId)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[Webhook MP] Erro:', e)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
