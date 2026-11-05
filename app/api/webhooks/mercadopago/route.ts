import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Eventos de pagamento
    if (body.type === 'payment' || body.action?.includes('payment')) {
      const paymentId = body.data?.id
      if (!paymentId) return NextResponse.json({ ok: true })

      const token = process.env.MERCADOPAGO_ACCESS_TOKEN
      if (!token) return NextResponse.json({ ok: false }, { status: 500 })

      const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const pagamento = await res.json()

      if (pagamento.status === 'approved' && pagamento.external_reference) {
        const admin = createAdminClient()
        
        await admin.from('faturamento_escolas').update({
          status: 'pago',
          pago_em: new Date().toISOString(),
          data_pagamento: new Date().toISOString(),
          gateway_status: 'approved'
        }).eq('id', pagamento.external_reference)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
