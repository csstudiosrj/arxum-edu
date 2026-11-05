'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function gerarPagamentoArxum(faturaId: string, metodo: 'pix' | 'boleto' | 'credit_card') {
  try {
    const admin = createAdminClient()
    const { data: fatura } = await admin.from('faturamento_escolas').select('*').eq('id', faturaId).single()
    
    if (!fatura) return { success: false, error: 'Fatura não encontrada.' }

    const token = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!token) return { success: false, error: 'Token do Mercado Pago não configurado no servidor.' }

    const url = process.env.NEXT_PUBLIC_SITE_URL || 'https://arxum.com.br'

    const body = {
      transaction_amount: fatura.valor_centavos / 100,
      description: fatura.descricao,
      payment_method_id: metodo === 'pix' ? 'pix' : 'bolbradesco',
      payer: {
        email: 'financeiro@arxum.com.br', 
        first_name: 'Escola',
        last_name: fatura.escola_nome,
        identification: { type: 'CNPJ', number: '00000000000000' } // Placeholder
      },
      external_reference: faturaId,
      notification_url: `${url}/edu/api/webhooks/mercadopago?faturaId=${faturaId}&tipo=arxum`
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
      pix_copia_cola: data.point_of_interaction?.transaction_data?.qr_code,
      pix_qr_imagem: data.point_of_interaction?.transaction_data?.qr_code_base64,
      boleto_linha: data.barcode?.content,
      boleto_url: data.transaction_details?.external_resource_url
    }).eq('id', faturaId)

    revalidatePath('/super-admin/financeiro')
    return { success: true, data }
  } catch (e: any) {
    return { success: false, error: 'Erro interno ao comunicar com o gateway.' }
  }
}
