// lib/mercadopago-arxum.ts
export async function criarPagamentoArxum(params: {
  valorCentavos: number
  descricao: string
  metodo: 'pix' | 'boleto' | 'credit_card'
  emailPagador: string
  nomePagador: string
  cpfPagador?: string
  faturaId: string
  cardToken?: string
  installments?: number
}) {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!token) throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado na Vercel.')

  const body: any = {
    transaction_amount: params.valorCentavos / 100,
    description: params.descricao,
    payment_method_id: params.metodo === 'pix' ? 'pix' : params.metodo === 'boleto' ? 'bolbradesco' : 'master', // Master é fallback
    payer: {
      email: params.emailPagador,
      first_name: params.nomePagador.split(' ')[0],
      last_name: params.nomePagador.split(' ').slice(1).join(' ') || 'Silva',
      identification: params.cpfPagador ? { type: 'CPF', number: params.cpfPagador.replace(/\D/g, '') } : undefined,
    },
    external_reference: params.faturaId,
    notification_url: `${process.env.NEXT_PUBLIC_SITE_URL}/edu/api/webhooks/mercadopago?tipo=arxum&faturaId=${params.faturaId}`,
  }

  if (params.metodo === 'credit_card') {
    body.token = params.cardToken
    body.installments = params.installments || 1
  }

  const res = await fetch('https://api.mercadopago.com/v1/payments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': `${params.faturaId}-${Date.now()}`,
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  if (!res.ok) {
    return { success: false, error: data.message || 'Erro no Mercado Pago', detalhes: data }
  }

  return {
    success: true,
    paymentId: data.id,
    status: data.status,
    qrCode: data.point_of_interaction?.transaction_data?.qr_code,
    qrCodeBase64: data.point_of_interaction?.transaction_data?.qr_code_base64,
    boletoUrl: data.transaction_details?.external_resource_url,
    boletoLinha: data.barcode?.content,
  }
}
