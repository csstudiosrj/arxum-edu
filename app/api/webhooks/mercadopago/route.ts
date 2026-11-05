import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // O Mercado Pago envia notificações de pagamento com type: 'payment' ou action contendo 'payment'
    const isPayment = body.type === 'payment' || body.action?.includes('payment')
    const paymentId = body.data?.id

    if (!isPayment || !paymentId) {
      // Se não for pagamento, apenas ignora e retorna OK para o MP não ficar reenviando
      return NextResponse.json({ ok: true })
    }

    const token = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!token) {
      console.error('[Webhook MP] Token não configurado')
      return NextResponse.json({ ok: false }, { status: 500 })
    }

    // Consulta os detalhes do pagamento direto na API do Mercado Pago
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    if (!res.ok) return NextResponse.json({ ok: false }, { status: 400 })
    
    const pagamento = await res.json()

    // Se o pagamento foi aprovado
    if (pagamento.status === 'approved') {
      const admin = createAdminClient()
      
      // O ID da fatura está no external_reference que enviamos ao gerar o PIX/Boleto
      const faturaId = pagamento.external_reference

      if (faturaId) {
        // Tenta atualizar na tabela do Super Admin (ARXUM -> Escola)
        const { error: errArxum } = await admin.from('faturamento_escolas').update({
          status: 'pago',
          pago_em: new Date().toISOString(),
          gateway: 'mercadopago',
          gateway_payment_id: String(pagamento.id),
          gateway_status: pagamento.status
        }).eq('id', faturaId)

        // Se não atualizou nenhuma linha (porque a fatura não é do super admin), tenta na tabela da Escola
        if (errArxum || faturaId.startsWith('tmp')) {
           await admin.from('faturas').update({
            status: 'pago',
            pago_em: new Date().toISOString(),
            gateway: 'mercadopago',
            gateway_payment_id: String(pagamento.id),
            gateway_status: pagamento.status
          }).eq('id', faturaId)
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[Webhook MP] Erro:', e)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
