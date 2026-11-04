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

// Todas as ações abaixo: o valor SEMPRE vem do banco (nunca do navegador) e
// só o responsável dono da fatura consegue pagar.

type Erro = { success: false; error: string }

function cpfValido(cpf: string) {
  const c = cpf.replace(/\D/g, '')
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false
  for (const t of [9, 10]) {
    let soma = 0
    for (let i = 0; i < t; i++) soma += Number(c[i]) * (t + 1 - i)
    const dv = ((soma * 10) % 11) % 10
    if (dv !== Number(c[t])) return false
  }
  return true
}

async function carregar(faturaId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { erro: 'Sessão expirada. Entre novamente.' } as const

  const admin = createAdminClient()
  const { data: fatura } = await admin
    .from('faturas')
    .select('id, escola_id, responsavel_email, aluno_nome, descricao, valor_centavos, vencimento, status, pix_copia_cola, pix_qr_imagem, pix_expira_em, boleto_linha, boleto_url')
    .eq('id', faturaId)
    .maybeSingle()

  if (!fatura || fatura.responsavel_email?.toLowerCase() !== user.email.toLowerCase()) {
    return { erro: 'Fatura não encontrada.' } as const
  }
  if (fatura.status === 'pago') return { erro: 'Esta fatura já foi paga.', pago: true } as const
  if (fatura.status === 'cancelado') return { erro: 'Esta fatura foi cancelada.' } as const

  const { data: escola } = await admin
    .from('escolas')
    .select('mercadopago_access_token, mercadopago_public_key')
    .eq('id', fatura.escola_id)
    .single()

  const token = resolverToken(escola?.mercadopago_access_token)
  if (!token) return { erro: 'A escola ainda não configurou o recebimento de pagamentos.' } as const

  return {
    admin,
    fatura,
    email: user.email,
    token,
    publicKey: resolverPublicKey(escola?.mercadopago_access_token, escola?.mercadopago_public_key),
  } as const
}

// ── Abre o checkout: devolve o que já existe e se o cartão está disponível ──
export async function getCheckoutFatura(faturaId: string) {
  const c = await carregar(faturaId)
  if ('erro' in c) {
    if ('pago' in c && c.pago) return { success: true as const, pago: true as const }
    return { success: false, error: c.erro } as Erro
  }

  const f = c.fatura
  const pixValido = f.pix_copia_cola && f.pix_expira_em && new Date(f.pix_expira_em) > new Date()
  return {
    success: true as const,
    pago: false as const,
    valorCentavos: f.valor_centavos as number,
    publicKey: c.publicKey,
    pix: pixValido ? { copiaCola: f.pix_copia_cola as string, qr: f.pix_qr_imagem as string | null } : null,
    boleto: f.boleto_linha || f.boleto_url
      ? { linha: f.boleto_linha as string | null, url: f.boleto_url as string | null }
      : null,
  }
}

// ── PIX ──
export async function gerarPix(faturaId: string) {
  const c = await carregar(faturaId)
  if ('erro' in c) return { success: false, error: c.erro } as Erro
  const f = c.fatura

  const pix = await criarPagamentoPix({
    accessToken: c.token,
    faturaId: f.id,
    valorCentavos: f.valor_centavos,
    descricao: `${f.descricao} - ${f.aluno_nome}`,
    emailPagador: c.email,
  })
  if (!pix.success) return { success: false, error: pix.error } as Erro

  await c.admin.from('faturas').update({
    gateway: 'mercadopago',
    gateway_payment_id: pix.paymentId,
    gateway_status: pix.status,
    pix_copia_cola: pix.pixCopiaCola,
    pix_qr_imagem: pix.pixQrImagem,
    pix_expira_em: pix.expiraEm,
    metodo_pagamento: 'pix',
  }).eq('id', f.id)

  return { success: true as const, pix: { copiaCola: pix.pixCopiaCola, qr: pix.pixQrImagem } }
}

// ── Boleto ──
export type DadosBoleto = {
  nome: string
  cpf: string
  cep: string
  rua: string
  numero: string
  bairro: string
  cidade: string
  uf: string
}

export async function gerarBoleto(faturaId: string, d: DadosBoleto) {
  const c = await carregar(faturaId)
  if ('erro' in c) return { success: false, error: c.erro } as Erro
  const f = c.fatura

  const cpf = d.cpf.replace(/\D/g, '')
  const cep = d.cep.replace(/\D/g, '')
  const partes = d.nome.trim().split(/\s+/)
  if (partes.length < 2) return { success: false, error: 'Informe nome e sobrenome.' } as Erro
  if (!cpfValido(cpf)) return { success: false, error: 'CPF inválido.' } as Erro
  if (cep.length !== 8) return { success: false, error: 'CEP inválido.' } as Erro
  if (!d.rua.trim() || !d.numero.trim() || !d.bairro.trim() || !d.cidade.trim() || d.uf.trim().length !== 2) {
    return { success: false, error: 'Preencha o endereço completo.' } as Erro
  }

  const pagador: DadosPagadorBoleto = {
    email: c.email,
    nome: partes[0],
    sobrenome: partes.slice(1).join(' '),
    cpf, cep,
    rua: d.rua.trim(), numero: d.numero.trim(), bairro: d.bairro.trim(),
    cidade: d.cidade.trim(), uf: d.uf.trim().toUpperCase(),
  }

  const b = await criarPagamentoBoleto({
    accessToken: c.token,
    faturaId: f.id,
    valorCentavos: f.valor_centavos,
    descricao: `${f.descricao} - ${f.aluno_nome}`,
    pagador,
    vencimento: f.vencimento,
  })
  if (!b.success) return { success: false, error: b.error } as Erro

  await c.admin.from('faturas').update({
    gateway: 'mercadopago',
    gateway_payment_id: b.paymentId,
    gateway_status: b.status,
    boleto_linha: b.linhaDigitavel,
    boleto_url: b.boletoUrl,
    metodo_pagamento: 'boleto',
  }).eq('id', f.id)

  return { success: true as const, boleto: { linha: b.linhaDigitavel, url: b.boletoUrl } }
}

// ── Cartão (o número do cartão NUNCA passa por aqui: só o token gerado no navegador) ──
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
    revalidatePath('/responsavel')
    return { success: true as const, aprovado: true, mensagem: 'Pagamento aprovado!' }
  }
  if (r.status === 'in_process' || r.status === 'pending') {
    return { success: true as const, aprovado: false, mensagem: 'Pagamento em análise. Você será avisado quando for confirmado.' }
  }
  return { success: false, error: mensagemRecusa(r.statusDetail) } as Erro
}
