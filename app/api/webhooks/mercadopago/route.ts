import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { obterPagamento, resolverToken, statusInterno } from '@/lib/mercadopago'

// O Mercado Pago faz POST aqui quando um pagamento muda de status.
// Segurança: não confiamos no corpo da requisição. Usamos apenas o ID do
// pagamento e consultamos o status real direto na API do Mercado Pago
// (com o token da escola dona da fatura). Um POST forjado não altera nada.

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url)
    let body: any = {}
    try { body = await request.json() } catch {}

    const tipo = (body.type || body.topic || url.searchParams.get('type') || url.searchParams.get('topic')) as string | null
    const paymentId = String(body.data?.id || url.searchParams.get('data.id') || url.searchParams.get('id') || '')

    // Só nos interessam eventos de pagamento.
    if (tipo !== 'payment' || !paymentId) {
      return NextResponse.json({ ok: true, ignorado: true })
    }

    // O ID da fatura vem na URL de notificação que nós mesmos informamos ao criar o pagamento.
    const faturaId = url.searchParams.get('f')
    if (!faturaId) return NextResponse.json({ ok: true, semFatura: true })

    const admin = createAdminClient()

    const { data: fatura } = await admin
      .from('faturas')
      .select('id, status, escola_id, valor_centavos')
      .eq('id', faturaId)
      .maybeSingle()

    if (!fatura) return NextResponse.json({ ok: true, semFatura: true })

    const { data: escola } = await admin
      .from('escolas')
      .select('mercadopago_access_token')
      .eq('id', fatura.escola_id)
      .single()

    const token = resolverToken(escola?.mercadopago_access_token)
    if (!token) return NextResponse.json({ ok: false, error: 'Sem token.' }, { status: 500 })

    const pagamento = await obterPagamento(token, paymentId)
    if (!pagamento.success) {
      // 500 faz o Mercado Pago tentar de novo mais tarde.
      return NextResponse.json({ ok: false, error: pagamento.error }, { status: 500 })
    }

    // O pagamento precisa ser mesmo desta fatura e ter o valor certo.
    if (
      pagamento.referenciaExterna !== fatura.id ||
      Math.round(pagamento.valor * 100) !== fatura.valor_centavos
    ) {
      return NextResponse.json({ ok: true, ignorado: 'divergente' })
    }

    // Não "despaga" uma fatura já paga por outro pagamento.
    if (fatura.status === 'pago') {
      return NextResponse.json({ ok: true, jaProcessado: true })
    }

    // Uma tentativa recusada/expirada não pode cancelar a fatura: o responsável pode tentar de novo.
    const mapeado = statusInterno(pagamento.status)
    const novoStatus = mapeado === 'pago' ? 'pago' : fatura.status

    await admin
      .from('faturas')
      .update({
        status: novoStatus,
        gateway_status: pagamento.status,
        gateway_payment_id: paymentId,
        ...(novoStatus === 'pago' ? { pago_em: pagamento.dataAprovacao || new Date().toISOString() } : {}),
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', fatura.id)

    return NextResponse.json({ ok: true, status: novoStatus })
  } catch (e) {
    console.error('[webhook mercadopago] Erro inesperado:', e)
    return NextResponse.json({ ok: false, error: 'Erro interno.' }, { status: 500 })
  }
}

// Health check — útil para testar a URL no navegador.
export async function GET() {
  return NextResponse.json({ ok: true, service: 'ARXUM Edu · Mercado Pago webhook' })
}
