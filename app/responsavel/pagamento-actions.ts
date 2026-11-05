'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import {
  resolverToken,
  resolverPublicKey,
  criarPagamentoPix,
  criarPagamentoBoleto,
  criarPagamentoCartao,
  mensagemRecusa,
  statusInterno,
  type DadosPagadorBoleto,
} from '@/lib/mercadopago'

// ... (Mantenha as funções cpfValido e carregar iguais)

export async function getCheckoutFatura(faturaId: string) { /* ... mantenha igual ... */ }

export async function gerarPix(faturaId: string) { 
  // ... mantenha igual ...
  // O PIX será baixado via webhook, então a taxa é gerada lá.
}

export async function gerarBoleto(faturaId: string, d: DadosBoleto) { 
  // ... mantenha igual ...
  // O Boleto será baixado via webhook, então a taxa é gerada lá.
}

// 👇 ATUALIZADO AQUI 👇
export async function pagarComCartao(
  faturaId: string,
  d: { cardToken: string; parcelas: number; metodoId: string; emissorId?: string; cpf: string },
) {
  const c = await carregar(faturaId)
  if ('erro' in c) return { success: false, error: c.erro } as Erro
  const f = c.fatura

  const cpf = d.cpf.replace(/\D/g, '')
  if (!cpfValido(cpf)) return { success: false, error: 'CPF do titular inválido.' } as Erro
  if (!d.cardToken || !d.metodoId) return { success: false, error: 'Dados do cartão incompletos.' } as Erro
  const parcelas = Math.min(Math.max(Math.floor(d.parcelas) || 1, 1), 12)

  const r = await criarPagamentoCartao({
    accessToken: c.token,
    faturaId: f.id,
    valorCentavos: f.valor_centavos,
    descricao: `${f.descricao} - ${f.aluno_nome}`,
    cardToken: d.cardToken,
    parcelas,
    metodoId: d.metodoId,
    emissorId: d.emissorId,
    emailPagador: c.email,
    cpfPagador: cpf,
  })
  if (!r.success) return { success: false, error: r.error } as Erro

  const aprovado = statusInterno(r.status) === 'pago'
  
  await c.admin.from('faturas').update({
    gateway: 'mercadopago',
    gateway_payment_id: r.paymentId,
    gateway_status: r.status,
    metodo_pagamento: 'cartao',
    ...(aprovado ? { status: 'pago', pago_em: r.dataAprovacao || new Date().toISOString() } : {}),
    atualizado_em: new Date().toISOString(),
  }).eq('id', f.id)

  if (aprovado) {
    // GERA A TAXA DA ARXUM (Mensalidade)
    const { data: escolaData } = await c.admin
      .from('escolas')
      .select('mercadopago_access_token')
      .eq('id', f.escola_id)
      .single()

    const { data: monetizacao } = await c.admin
      .from('configuracoes_monetizacao')
      .select('taxa_mensalidade_padrao_bps, taxa_mensalidade_mp_bps')
      .limit(1)
      .maybeSingle()

    const temMpConectado = !!escolaData?.mercadopago_access_token
    const taxaBps = temMpConectado 
      ? (monetizacao?.taxa_mensalidade_mp_bps || 0) 
      : (monetizacao?.taxa_mensalidade_padrao_bps || 0)

    const valorTaxaCentavos = Math.round(f.valor_centavos * (taxaBps / 10000))

    if (valorTaxaCentavos > 0) {
      await c.admin.from('taxas_geradas').insert({
        escola_id: f.escola_id,
        tipo: 'mensalidade',
        referencia_id: f.id,
        valor_base_centavos: f.valor_centavos,
        percentual_aplicado_bps: taxaBps,
        taxa_centavos: valorTaxaCentavos,
        status: temMpConectado ? 'split_automatico' : 'pendente'
      })
    }

    revalidatePath('/responsavel')
    return { success: true as const, aprovado: true, mensagem: 'Pagamento aprovado!' }
  }
  
  if (r.status === 'in_process' || r.status === 'pending') {
    return { success: true as const, aprovado: false, mensagem: 'Pagamento em análise. Você será avisado quando for confirmado.' }
  }
  
  return { success: false, error: mensagemRecusa(r.statusDetail) } as Erro
}
