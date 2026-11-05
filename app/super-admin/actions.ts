'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export type MetricasFinanceiras = {
  mrrCentavos: number
  arrCentavos: number
  totalRecebido: number
  totalEmAberto: number
  totalVencido: number
}

export type EscolaFinanceiro = {
  id: string
  nome: string
  slug: string
  plano: string
  status_assinatura: string
  ltvCentavos: number
  faturas_pagas: number
  faturas_vencidas: number
  media_dias_atraso: number
  health_score: 'bom' | 'atencao' | 'risco'
}

export async function getMetricasFinanceiras(): Promise<MetricasFinanceiras> {
  const admin = createAdminClient()
  const { data: faturas } = await admin.from('faturamento_escolas').select('valor_centavos, status')
  
  const pagas = (faturas || []).filter(f => f.status === 'pago').reduce((acc, f) => acc + f.valor_centavos, 0)
  const abertas = (faturas || []).filter(f => f.status === 'em_aberto').reduce((acc, f) => acc + f.valor_centavos, 0)
  const vencidas = (faturas || []).filter(f => f.status === 'vencido').reduce((acc, f) => acc + f.valor_centavos, 0)
  
  // O MRR real seria calculado com base nas escolas ativas x valor do plano, mas para simplificar usaremos o valor pago no mês
  const mrr = pagas 

  return {
    mrrCentavos: mrr,
    arrCentavos: mrr * 12,
    totalRecebido: pagas,
    totalEmAberto: abertas,
    totalVencido: vencidas
  }
}

export async function getEscolasFinanceiro(): Promise<EscolaFinanceiro[]> {
  const admin = createAdminClient()
  const { data: escolas } = await admin.from('escolas').select('*')
  const { data: faturas } = await admin.from('faturamento_escolas').select('*')

  if (!escolas) return []

  return escolas.map(e => {
    const faturasEscola = (faturas || []).filter(f => f.escola_id === e.id)
    const pagas = faturasEscola.filter(f => f.status === 'pago')
    const vencidas = faturasEscola.filter(f => f.status === 'vencido')
    
    const ltv = pagas.reduce((acc, f) => acc + f.valor_centavos, 0)
    
    // Cálculo simples de dias de atraso para pagas
    let diasAtrasoTotal = 0
    pagas.forEach(f => {
      if (f.data_pagamento && f.vencimento) {
        const venc = new Date(f.vencimento).getTime()
        const pago = new Date(f.data_pagamento).getTime()
        const diff = Math.floor((pago - venc) / (1000 * 3600 * 24))
        if (diff > 0) diasAtrasoTotal += diff
      }
    })

    const mediaAtraso = pagas.length > 0 ? Math.round(diasAtrasoTotal / pagas.length) : 0
    
    let health: 'bom' | 'atencao' | 'risco' = 'bom'
    if (vencidas.length > 0) health = 'risco'
    else if (mediaAtraso > 3 || e.status_assinatura === 'trial') health = 'atencao'

    return {
      id: e.id,
      nome: e.nome,
      slug: e.slug,
      plano: e.plano,
      status_assinatura: e.status_assinatura,
      ltvCentavos: ltv,
      faturas_pagas: pagas.length,
      faturas_vencidas: vencidas.length,
      media_dias_atraso: mediaAtraso,
      health_score: health
    }
  })
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
