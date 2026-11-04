// ── Mercado Pago (API de Pagamentos) ───────────────────────────────
// Cobrança 100% dentro do site: o PIX é gerado via API e o QR Code /
// código "copia e cola" são exibidos na própria tela do sistema.
// Nenhum redirecionamento e nenhuma logo do Mercado Pago é exibida.
//
// Modelo de recebimento (fase 1, sem split): cada escola informa o
// próprio Access Token do Mercado Pago, e o dinheiro cai direto na
// conta dela. Opcionalmente existe a variável MERCADOPAGO_ACCESS_TOKEN
// como token padrão (fallback) caso a escola não tenha configurado o dela.

import { randomUUID } from 'crypto'

const MP_API = 'https://api.mercadopago.com'

export function tokenPadrao(): string | null {
  return process.env.MERCADOPAGO_ACCESS_TOKEN || null
}

export function resolverToken(tokenEscola?: string | null): string | null {
  return (tokenEscola && tokenEscola.trim()) || tokenPadrao()
}

// A Public Key precisa ser da MESMA conta do Access Token usado.
export function resolverPublicKey(tokenEscola?: string | null, publicKeyEscola?: string | null): string | null {
  if (tokenEscola && tokenEscola.trim()) return (publicKeyEscola && publicKeyEscola.trim()) || null
  return process.env.MERCADOPAGO_PUBLIC_KEY || null
}

// Endereço público do app, já com o basePath '/edu' (ver next.config.mjs).
// Ex.: https://arxum.com.br  →  https://arxum.com.br/edu
export function urlSite(): string | null {
  const url = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (!url) return null
  const base = (url.startsWith('http') ? url : `https://${url}`).replace(/\/+$/, '')
  return base.endsWith('/edu') ? base : `${base}/edu`
}

// ── Valida um Access Token (usado na tela de configuração) ──────────
export async function validarToken(accessToken: string) {
  try {
    const res = await fetch(`${MP_API}/users/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    })
    const data = await res.json()
    if (!res.ok) {
      return { success: false as const, error: 'Access Token inválido ou sem permissão.' }
    }
    return {
      success: true as const,
      userId: String(data.id),
      email: (data.email || null) as string | null,
      nickname: (data.nickname || null) as string | null,
      modoTeste: accessToken.startsWith('TEST-'),
    }
  } catch {
    return { success: false as const, error: 'Erro ao comunicar com o Mercado Pago.' }
  }
}

// ── Núcleo: cria um pagamento no Mercado Pago ───────────────────────
type CriarPagamentoBase = {
  accessToken: string
  faturaId: string // vira external_reference e vai na URL do webhook
  valorCentavos: number
  descricao: string
}

async function postarPagamento(accessToken: string, corpo: Record<string, unknown>) {
  try {
    const res = await fetch(`${MP_API}/v1/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'X-Idempotency-Key': randomUUID(),
      },
      body: JSON.stringify(corpo),
    })
    const data = await res.json()
    if (!res.ok) {
      console.error('[mercadopago:criarPagamento] Erro:', JSON.stringify(data))
      const causa = Array.isArray(data?.cause) ? data.cause[0]?.description : null
      return { success: false as const, error: (causa || data?.message || 'Erro ao processar pagamento.') as string }
    }
    return { success: true as const, data }
  } catch (e) {
    console.error('[mercadopago:criarPagamento] Erro inesperado:', e)
    return { success: false as const, error: 'Erro ao comunicar com o Mercado Pago.' }
  }
}

function camposComuns(p: CriarPagamentoBase) {
  const site = urlSite()
  return {
    transaction_amount: Number((p.valorCentavos / 100).toFixed(2)),
    description: p.descricao.slice(0, 200),
    external_reference: p.faturaId,
    // O Mercado Pago avisa este endereço quando o pagamento muda de status.
    ...(site ? { notification_url: `${site}/api/webhooks/mercadopago?f=${p.faturaId}` } : {}),
  }
}

// ── PIX ─────────────────────────────────────────────────────────────
export async function criarPagamentoPix(p: CriarPagamentoBase & { emailPagador: string; expiraEmDias?: number }) {
  const expira = new Date(Date.now() + (p.expiraEmDias ?? 7) * 24 * 3600 * 1000)
  const r = await postarPagamento(p.accessToken, {
    ...camposComuns(p),
    payment_method_id: 'pix',
    payer: { email: p.emailPagador },
    date_of_expiration: expira.toISOString().replace('Z', '-00:00'),
  })
  if (!r.success) return r

  const tx = r.data.point_of_interaction?.transaction_data
  const qr = (tx?.qr_code_base64 || null) as string | null
  return {
    success: true as const,
    paymentId: String(r.data.id),
    status: r.data.status as string,
    pixCopiaCola: (tx?.qr_code || null) as string | null,
    // Imagem do QR pronta para <img src=...>, sem URL externa
    pixQrImagem: qr ? `data:image/png;base64,${qr}` : null,
    expiraEm: expira.toISOString(),
  }
}

// ── Boleto ──────────────────────────────────────────────────────────
export type DadosPagadorBoleto = {
  email: string
  nome: string
  sobrenome: string
  cpf: string
  cep: string
  rua: string
  numero: string
  bairro: string
  cidade: string
  uf: string
}

export async function criarPagamentoBoleto(p: CriarPagamentoBase & { pagador: DadosPagadorBoleto; vencimento: string }) {
  // Vencimento do boleto: a data da fatura, se estiver entre amanhã e 29 dias; senão 3 dias.
  const hoje = Date.now()
  let venc = new Date(`${p.vencimento}T23:59:59-03:00`)
  const dias = (venc.getTime() - hoje) / 86400000
  if (isNaN(venc.getTime()) || dias < 1 || dias > 29) venc = new Date(hoje + 3 * 86400000)

  const r = await postarPagamento(p.accessToken, {
    ...camposComuns(p),
    payment_method_id: 'bolbradesco',
    payer: {
      email: p.pagador.email,
      first_name: p.pagador.nome,
      last_name: p.pagador.sobrenome,
      identification: { type: 'CPF', number: p.pagador.cpf },
      address: {
        zip_code: p.pagador.cep,
        street_name: p.pagador.rua,
        street_number: p.pagador.numero,
        neighborhood: p.pagador.bairro,
        city: p.pagador.cidade,
        federal_unit: p.pagador.uf,
      },
    },
    date_of_expiration: venc.toISOString().replace('Z', '-00:00'),
  })
  if (!r.success) return r

  const td = r.data.transaction_details
  return {
    success: true as const,
    paymentId: String(r.data.id),
    status: r.data.status as string,
    linhaDigitavel: (td?.digitable_line || r.data.barcode?.content || null) as string | null,
    boletoUrl: (td?.external_resource_url || null) as string | null,
  }
}

// ── Cartão ──────────────────────────────────────────────────────────
export async function criarPagamentoCartao(
  p: CriarPagamentoBase & {
    cardToken: string
    parcelas: number
    metodoId: string
    emissorId?: string
    emailPagador: string
    cpfPagador: string
  },
) {
  const r = await postarPagamento(p.accessToken, {
    ...camposComuns(p),
    token: p.cardToken,
    installments: p.parcelas,
    payment_method_id: p.metodoId,
    ...(p.emissorId ? { issuer_id: p.emissorId } : {}),
    statement_descriptor: 'ARXUM EDU',
    payer: { email: p.emailPagador, identification: { type: 'CPF', number: p.cpfPagador } },
  })
  if (!r.success) return r
  return {
    success: true as const,
    paymentId: String(r.data.id),
    status: r.data.status as string,
    statusDetail: (r.data.status_detail || null) as string | null,
    dataAprovacao: (r.data.date_approved || null) as string | null,
  }
}

// Mensagem amigável para recusas de cartão.
export function mensagemRecusa(statusDetail: string | null): string {
  switch (statusDetail) {
    case 'cc_rejected_insufficient_amount': return 'Saldo/limite insuficiente no cartão.'
    case 'cc_rejected_bad_filled_security_code': return 'Código de segurança (CVV) incorreto.'
    case 'cc_rejected_bad_filled_date': return 'Data de validade incorreta.'
    case 'cc_rejected_bad_filled_other': return 'Confira os dados do cartão.'
    case 'cc_rejected_call_for_authorize': return 'Seu banco precisa autorizar este pagamento. Ligue para a operadora do cartão.'
    case 'cc_rejected_card_disabled': return 'Cartão desabilitado. Ative-o com seu banco ou use outro.'
    case 'cc_rejected_duplicated_payment': return 'Pagamento duplicado. Aguarde alguns minutos.'
    default: return 'Pagamento recusado pelo banco. Tente outro cartão ou outra forma de pagamento.'
  }
}

// ── Consulta um pagamento (fonte da verdade para o webhook) ─────────
export async function obterPagamento(accessToken: string, paymentId: string) {
  try {
    const res = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    })
    const data = await res.json()
    if (!res.ok) {
      return { success: false as const, error: (data?.message as string) || 'Erro ao buscar pagamento.' }
    }
    return {
      success: true as const,
      status: data.status as string,
      statusDetail: (data.status_detail || null) as string | null,
      dataAprovacao: (data.date_approved || null) as string | null,
      referenciaExterna: (data.external_reference || null) as string | null,
      valor: Number(data.transaction_amount),
    }
  } catch {
    return { success: false as const, error: 'Erro ao comunicar com o Mercado Pago.' }
  }
}

// Traduz o status do Mercado Pago para o status interno das faturas.
export function statusInterno(statusMp: string): 'pago' | 'cancelado' | 'em_aberto' {
  if (statusMp === 'approved') return 'pago'
  if (statusMp === 'cancelled' || statusMp === 'refunded' || statusMp === 'charged_back') return 'cancelado'
  return 'em_aberto' // pending, in_process, rejected...
}
