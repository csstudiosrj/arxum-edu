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

    const { data: addonsEscola } = await admin
      .from('escolas_addons')
      .select('addon_slug, addons(nome, preco_centavos)')
      .eq('escola_id', escolaId)
      .eq('ativo', true)

    const addons = (addonsEscola || []).map((a: any) => {
      const addonData = Array.isArray(a.addons) ? a.addons[0] : a.addons
      return {
        slug: a.addon_slug,
        nome: addonData?.nome || a.addon_slug,
        preco_centavos: addonData?.preco_centavos || 0
      }
    })

    return { success: true, valorBaseCentavos: plano.preco_centavos, addons }
  } catch (e) {
    return { success: false, error: 'Erro ao buscar dados da escola.' }
  }
}

export async function gerarCobrancaCheckout(
  escolaId: string, 
  descontoCentavos: number, 
  addonsSelecionados: string[], 
  descricao: string, 
  referencia: string
) {
  try {
    const admin = createAdminClient()
    
    const { data: escola } = await admin.from('escolas').select('nome, plano').eq('id', escolaId).single()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const { data: plano } = await admin.from('planos').select('preco_centavos').eq('slug', escola.plano).single()
    if (!plano) return { success: false, error: 'Plano não encontrado.' }

    let addonsCentavos = 0
    if (addonsSelecionados.length > 0) {
      const { data: addonsDb } = await admin.from('addons').select('preco_centavos').in('slug', addonsSelecionados)
      addonsCentavos = (addonsDb || []).reduce((acc, curr) => acc + curr.preco_centavos, 0)
    }

    const valorFinalCentavos = plano.preco_centavos + addonsCentavos - descontoCentavos
    if (valorFinalCentavos <= 0) return { success: false, error: 'O valor final deve ser maior que zero.' }

    const vencimento = new Date()
    vencimento.setDate(vencimento.getDate() + 7)

    const { data: fatura, error: errFatura } = await admin.from('faturamento_escolas').insert({
      escola_id: escolaId,
      escola_nome: escola.nome,
      descricao,
      valor_centavos: valorFinalCentavos,
      vencimento: vencimento.toISOString().split('T')[0],
      periodo_referencia: referencia,
      status: 'em_aberto',
      aviso_d3_enviado: false,
      aviso_d1_enviado: false
    }).select('id').single()

    if (errFatura || !fatura) return { success: false, error: 'Erro ao criar fatura no banco.' }

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
      back_urls: { success: `${baseUrl}/edu/super-admin/financeiro`, failure: `${baseUrl}/edu/super-admin/financeiro`, pending: `${baseUrl}/edu/super-admin/financeiro` },
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

export async function getInfoAssinaturaEscola(escolaId: string) {
  const admin = createAdminClient()
  const { data } = await admin.from('escolas').select('mercadopago_preapproval_id, status_assinatura').eq('id', escolaId).single()
  return data
}

export async function gerarAssinaturaRecorrente(escolaId: string) {
  try {
    const admin = createAdminClient()
    const { data: escola } = await admin.from('escolas').select('nome, plano, email_contato').eq('id', escolaId).single()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const { data: plano } = await admin.from('planos').select('preco_centavos').eq('slug', escola.plano).single()
    if (!plano) return { success: false, error: 'Plano não encontrado.' }

    const token = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!token) return { success: false, error: 'Token MP não configurado.' }
    const baseUrl = 'https://www.arxum.com.br'

    const body = {
      reason: `Assinatura ARXUM - Plano ${escola.plano}`,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: plano.preco_centavos / 100,
        currency_id: 'BRL'
      },
      back_url: `${baseUrl}/edu/super-admin/financeiro`,
      payer_email: escola.email_contato || 'financeiro@escola.com.br',
      status: 'pending'
    }

    const res = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    const data = await res.json()

    if (!res.ok) return { success: false, error: data.message || 'Erro no Mercado Pago.' }

    await admin.from('escolas').update({ mercadopago_preapproval_id: data.id }).eq('id', escolaId)
    revalidatePath('/super-admin/financeiro')
    return { success: true, link: data.init_point }
  } catch (e: any) {
    return { success: false, error: 'Erro interno ao gerar assinatura.' }
  }
}

export async function cancelarAssinaturaRecorrente(escolaId: string, preapprovalId: string) {
  try {
    const admin = createAdminClient()
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN

    if (token) {
      await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      })
    }

    await admin.from('escolas').update({ mercadopago_preapproval_id: null, status_assinatura: 'cancelada' }).eq('id', escolaId)
    revalidatePath('/super-admin/financeiro')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao cancelar assinatura.' }
  }
}

// ── NOVAS FUNÇÕES DE TAXAS E REPASSES ────────────────────────────────

export type ResumoTaxaEscola = {
  escola_id: string
  escola_nome: string
  total_taxas_pendentes_centavos: number
  total_addons_centavos: number
  valor_fatura_centavos: number
  quantidade_alunos: number
}

export async function getResumoTaxasPendentes(): Promise<ResumoTaxaEscola[]> {
  try {
    const admin = createAdminClient()

    // 1. Busca todas as taxas pendentes
    const { data: taxas } = await admin
      .from('taxas_geradas')
      .select('escola_id, taxa_centavos, escolas(nome)')
      .eq('status', 'pendente')

    if (!taxas || taxas.length === 0) return []

    // 2. Agrupa por escola
    const resumoMap: Record<string, { nome: string, taxas: number }> = {}
    taxas.forEach((t: any) => {
      const nomeEscola = Array.isArray(t.escolas) ? t.escolas[0]?.nome : t.escolas?.nome || 'Escola'
      if (!resumoMap[t.escola_id]) resumoMap[t.escola_id] = { nome: nomeEscola, taxas: 0 }
      resumoMap[t.escola_id].taxas += t.taxa_centavos
    })

    // 3. Para cada escola com taxas, calcula os add-ons ativos
    const resultado: ResumoTaxaEscola[] = []
    
    for (const [escolaId, dados] of Object.entries(resumoMap)) {
      // Conta alunos ativos
      const { count: totalAlunos } = await admin
        .from('alunos')
        .select('*', { count: 'exact', head: true })
        .eq('escola_id', escolaId)
        .eq('status', 'ativo')

      // Pega add-ons ativos e seus preços por aluno
      const { data: addons } = await admin
        .from('escolas_addons')
        .select('addons(preco_por_aluno_centavos)')
        .eq('escola_id', escolaId)
        .eq('ativo', true)

      let totalAddonsCentavos = 0
      if (addons) {
        addons.forEach((a: any) => {
          const precoPorAluno = Array.isArray(a.addons) ? a.addons[0]?.preco_por_aluno_centavos : a.addons?.preco_por_aluno_centavos
          if (precoPorAluno) totalAddonsCentavos += precoPorAluno * (totalAlunos || 0)
        })
      }

      resultado.push({
        escola_id: escolaId,
        escola_nome: dados.nome,
        total_taxas_pendentes_centavos: dados.taxas,
        total_addons_centavos: totalAddonsCentavos,
        valor_fatura_centavos: dados.taxas + totalAddonsCentavos,
        quantidade_alunos: totalAlunos || 0
      })
    }

    return resultado
  } catch (e) {
    console.error('Erro ao buscar resumo de taxas:', e)
    return []
  }
}

export async function gerarFaturaTaxas(escolaId: string) {
  try {
    const admin = createAdminClient()
    
    // 1. Pega os dados necessários para a fatura
    const { data: escola } = await admin.from('escolas').select('nome').eq('id', escolaId).single()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const { data: taxas } = await admin.from('taxas_geradas').select('id, taxa_centavos').eq('escola_id', escolaId).eq('status', 'pendente')
    if (!taxas || taxas.length === 0) return { success: false, error: 'Nenhuma taxa pendente.' }

    const totalTaxas = taxas.reduce((acc, t) => acc + t.taxa_centavos, 0)

    // 2. Calcula Add-ons (mesma lógica da função anterior)
    const { count: totalAlunos } = await admin.from('alunos').select('*', { count: 'exact', head: true }).eq('escola_id', escolaId).eq('status', 'ativo')
    const { data: addons } = await admin.from('escolas_addons').select('addons(preco_por_aluno_centavos)').eq('escola_id', escolaId).eq('ativo', true)
    
    let totalAddons = 0
    if (addons) {
      addons.forEach((a: any) => {
        const preco = Array.isArray(a.addons) ? a.addons[0]?.preco_por_aluno_centavos : a.addons?.preco_por_aluno_centavos
        if (preco) totalAddons += preco * (totalAlunos || 0)
      })
    }

    const valorTotal = totalTaxas + totalAddons

    // 3. Cria a fatura
    const vencimento = new Date()
    vencimento.setDate(vencimento.getDate() + 10) // Vencimento padrão de 10 dias

    const descricao = `Fatura de Taxas e Add-ons - Ref. ${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`

    const { data: fatura, error: errFatura } = await admin.from('faturamento_escolas').insert({
      escola_id: escolaId,
      escola_nome: escola.nome,
      descricao,
      valor_centavos: valorTotal,
      vencimento: vencimento.toISOString().split('T')[0],
      periodo_referencia: new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      status: 'em_aberto',
      aviso_d3_enviado: false,
      aviso_d1_enviado: false
    }).select('id').single()

    if (errFatura) return { success: false, error: 'Erro ao criar fatura.' }

    // 4. Atualiza o status das taxas para 'faturado'
    const taxasIds = taxas.map(t => t.id)
    await admin.from('taxas_geradas').update({ status: 'faturado' }).in('id', taxasIds)

    revalidatePath('/super-admin/financeiro')
    return { success: true, faturaId: fatura.id }
  } catch (e) {
    console.error(e)
    return { success: false, error: 'Erro interno ao gerar fatura.' }
  }
}
