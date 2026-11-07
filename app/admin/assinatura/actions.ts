'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getEscolaDoUsuario } from '@/lib/auth/escola-atual'
import { revalidatePath } from 'next/cache'

export type FaturaArxum = {
  id: string
  descricao: string
  valor_centavos: number
  vencimento: string
  status: string
  checkout_url: string | null
  pago_em: string | null
  criado_em: string
}

export async function getMinhasFaturasArxum(): Promise<FaturaArxum[]> {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return []

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('faturamento_escolas')
      .select('id, descricao, valor_centavos, vencimento, status, checkout_url, data_pagamento, criado_em')
      .eq('escola_id', escola.id)
      .order('criado_em', { ascending: false })

    if (error) return []
    return (data || []).map(f => ({ ...f, pago_em: f.data_pagamento })) as FaturaArxum[]
  } catch (e) {
    return []
  }
}

export async function gerarPagamentoArxum(faturaId: string) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    
    // 1. Busca a fatura
    const { data: fatura } = await admin
      .from('faturamento_escolas')
      .select('*')
      .eq('id', faturaId)
      .eq('escola_id', escola.id)
      .single()

    if (!fatura) return { success: false, error: 'Fatura não encontrada.' }
    if (fatura.status === 'pago') return { success: false, error: 'Fatura já paga.' }

    // Se já tem link, só devolve
    if (fatura.checkout_url) return { success: true, link: fatura.checkout_url }

    // 2. Gera o link no Mercado Pago (Token da ARXUM)
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!token) return { success: false, error: 'Configuração de pagamento indisponível.' }
    
    const baseUrl = 'https://www.arxum.com.br'

    const body = {
      items: [{
        id: fatura.id,
        title: fatura.descricao,
        quantity: 1,
        currency_id: 'BRL',
        unit_price: fatura.valor_centavos / 100
      }],
      payer: { email: escola.email_contato || 'financeiro@escola.com.br', name: escola.nome },
      external_reference: fatura.id,
      notification_url: `${baseUrl}/edu/api/webhooks/mercadopago`,
      back_urls: { success: `${baseUrl}/edu/admin/assinatura`, failure: `${baseUrl}/edu/admin/assinatura`, pending: `${baseUrl}/edu/admin/assinatura` },
      auto_return: 'approved',
    }

    const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    const data = await res.json()
    
    if (!res.ok) return { success: false, error: data.message || 'Erro ao gerar pagamento.' }

    // 3. Salva o link na fatura
    await admin.from('faturamento_escolas').update({
      gateway: 'mercadopago',
      gateway_payment_id: data.id,
      checkout_url: data.init_point
    }).eq('id', fatura.id)

    revalidatePath('/admin/assinatura')
    return { success: true, link: data.init_point }
  } catch (e) {
    return { success: false, error: 'Erro ao gerar link de pagamento.' }
  }
}