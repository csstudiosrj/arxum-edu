'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function gerarPagamentoArxum(
  faturaId: string, 
  metodo: 'pix' | 'boleto' | 'credit_card', 
  cardToken?: string 
) {
  try {
    const admin = createAdminClient()
    const { data: fatura } = await admin.from('faturamento_escolas').select('*').eq('id', faturaId).single()
    
    if (!fatura) return { success: false, error: 'Fatura não encontrada.' }

    const token = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!token) return { success: false, error: 'Token do Mercado Pago não configurado.' }

    const url = process.env.NEXT_PUBLIC_SITE_URL || 'https://arxum.com.br'

    const body: any = {
      transaction_amount: fatura.valor_centavos / 100,
      description: fatura.descricao,
      payer: {
        email: 'financeiro@escola.com.br', 
        first_name: 'Escola',
        last_name: fatura.escola_nome,
        identification: { type: 'CNPJ', number: '00000000000000' }
      },
      external_reference: faturaId,
      notification_url: `${url}/edu/api/webhooks/mercadopago?faturaId=${faturaId}&tipo=arxum`
    }

    if (metodo === 'pix') {
      body.payment_method_id = 'pix'
    } else if (metodo === 'boleto') {
      body.payment_method_id = 'bolbradesco'
    } else if (metodo === 'credit_card') {
      if (!cardToken) return { success: false, error: 'Token do cartão não informado.' }
      body.payment_method_id = 'visa'
      body.token = cardToken
      body.installments = 1
    }

    const res = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': faturaId + Date.now().toString()
      },
      body: JSON.stringify(body)
    })

    const data = await res.json()

    if (!res.ok) return { success: false, error: data.message || 'Erro no Mercado Pago.', detalhes: data }

    await admin.from('faturamento_escolas').update({
      gateway: 'mercadopago',
      gateway_payment_id: String(data.id),
      gateway_status: data.status,
      pix_copia_cola: data.point_of_interaction?.transaction_data?.qr_code || null,
      pix_qr_imagem: data.point_of_interaction?.transaction_data?.qr_code_base64 || null,
      boleto_linha: data.barcode?.content || null,
      boleto_url: data.transaction_details?.external_resource_url || null
    }).eq('id', faturaId)

    revalidatePath('/super-admin/financeiro')
    return { success: true, data }
  } catch (e: any) {
    return { success: false, error: 'Erro interno ao comunicar com o gateway.' }
  }
}
