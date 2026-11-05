'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function getDadosCobrancaEscola(escolaId: string) {
  try {
    const admin = createAdminClient()
    const { data: escola } = await admin.from('escolas').select('plano').eq('id', escolaId).single()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const { data: plano } = await admin.from('planos').select('preco_centavos').eq('slug', escola.plano).single()
    if (!plano) return { success: false, error: 'Plano da escola não encontrado.' }

    return { success: true, valorBaseCentavos: plano.preco_centavos }
  } catch (e) {
    return { success: false, error: 'Erro ao buscar dados da escola.' }
  }
}

export async function gerarCobrancaCheckout(
  escolaId: string, 
  descontoCentavos: number, 
  addonCentavos: number, 
  descricao: string, 
  referencia: string
) {
  try {
    const admin = createAdminClient()
    
    // 1. Busca escola e plano para recalcular no servidor
    const { data: escola } = await admin.from('escolas').select('nome, plano').eq('id', escolaId).single()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const { data: plano } = await admin.from('planos').select('preco_centavos').eq('slug', escola.plano).single()
    if (!plano) return { success: false, error: 'Plano não encontrado.' }

    // 2. Calcula o valor final
    const valorFinalCentavos = plano.preco_centavos - descontoCentavos + addonCentavos
    if (valorFinalCentavos <= 0) return { success: false, error: 'O valor final deve ser maior que zero.' }

    // 3. Cria a fatura no banco
    const vencimento = new Date()
    vencimento.setDate(vencimento.getDate() + 7)

    const { data: fatura, error: errFatura } = await admin.from('faturamento_escolas').insert({
      escola_id: escolaId,
      escola_nome: escola.nome,
      descricao,
      valor_centavos: valorFinalCentavos,
      vencimento: vencimento.toISOString().split('T')[0],
      periodo_referencia: referencia,
      status: 'em_aberto'
    }).select('id').single()

    if (errFatura || !fatura) return { success: false, error: 'Erro ao criar fatura no banco.' }

    // 4. Gera o Link no Mercado Pago
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!token) return { success: false, error: 'Token MP não configurado.' }
    const baseUrl = 'https://www.arxum.com.br'

    const body = {
      items: [{
        id: fatura.id,
        title: descricao,
        quantity: 1,
        currency_id: 'BRL',
        unit_price: valorFinalCentavos / 100
      }],
      payer: { email: 'financeiro@escola.com.br', name: escola.nome },
      external_reference: fatura.id,
      notification_url: `${baseUrl}/edu/api/webhooks/mercadopago`,
      back_urls: {
        success: `${baseUrl}/edu/super-admin/financeiro`,
        failure: `${baseUrl}/edu/super-admin/financeiro`,
        pending: `${baseUrl}/edu/super-admin/financeiro`
      },
      auto_return: 'approved',
      payment_methods: { installments: 12 }
    }

    const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    const data = await res.json()
    
    if (!res.ok) return { success: false, error: data.message || 'Erro no Mercado Pago.' }

    // 5. Salva o link no banco
    await admin.from('faturamento_escolas').update({
      gateway: 'mercadopago',
      gateway_payment_id: data.id,
      checkout_url: data.init_point
    }).eq('id', fatura.id)

    revalidatePath('/super-admin/financeiro')
    return { success: true, link: data.init_point }
  } catch (e: any) {
    return { success: false, error: 'Erro interno ao gerar cobrança.' }
  }
}

// Botão de emergência (Sincronização Manual)
export async function sincronizarPagamentoManual(faturaId: string) {
  try {
    const admin = createAdminClient()
    const { data: fatura } = await admin.from('faturamento_escolas').select('gateway_payment_id').eq('id', faturaId).single()
    if (!fatura?.gateway_payment_id) return { success: false, error: 'Fatura sem ID de gateway.' }

    const token = process.env.MERCADOPAGO_ACCESS_TOKEN
    const res = await fetch(`https://api.mercadopago.com/v1/payments/search?external_reference=${faturaId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    
    if (data.results?.some((p: any) => p.status === 'approved')) {
      await admin.from('faturamento_escolas').update({ 
        status: 'pago', 
        pago_em: new Date().toISOString(),
        data_pagamento: new Date().toISOString()
      }).eq('id', faturaId)
      revalidatePath('/super-admin/financeiro')
      return { success: true, status: 'approved' }
    }
    return { success: true, status: 'pending' }
  } catch (e) {
    return { success: false, error: 'Erro ao sincronizar.' }
  }
}

export async function getFaturasPorEscola(escolaId: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('faturamento_escolas')
    .select('*')
    .eq('escola_id', escolaId)
    .order('vencimento', { ascending: false })
  return data || []
}
