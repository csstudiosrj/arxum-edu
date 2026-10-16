// ── Pagar.me V5 (agora Stone Digital) ──────────────────────────────
// Doc: https://docs.pagar.me/reference
// Auth: Basic <base64(sk_xxx:)>
// API base: https://api.pagar.me/core/v5

const PAGARME_API = 'https://api.pagar.me/core/v5'

function getKey(): string | null {
  return process.env.PAGARME_SECRET_KEY || process.env.PAGARME_API_KEY || null
}

function authHeader(): string | null {
  const key = getKey()
  if (!key) return null
  return 'Basic ' + Buffer.from(`${key}:`).toString('base64')
}

export function pagarmeConfigurado(): boolean {
  return !!getKey()
}

// ── Tipos ──────────────────────────────────────────────────────────
export type PagarmeEndereco = {
  line_1: string         // "Rua X, 123, Bairro"
  zip_code: string       // "12345678" (só dígitos)
  city: string
  state: string          // "RJ"
  country: string        // "BR"
}

export type PagarmeTelefone = {
  country_code: string   // "55"
  area_code: string      // "21"
  number: string         // "900000000" (só dígitos)
}

export type DadosRecebedor = {
  nome: string
  email: string
  documento: string             // CNPJ ou CPF só dígitos
  tipo: 'individual' | 'company'
  telefone: PagarmeTelefone
  endereco: PagarmeEndereco
  banco: {
    codigo: string              // "341", "237", "001" etc
    agencia: string
    conta: string
    digito: string
    tipo: 'checking' | 'savings'
    titular_nome: string
    titular_documento: string
  }
  siteUrl?: string              // opcional
}

// ── Recebedores (escolas no marketplace) ──────────────────────────
export async function criarRecebedor(dados: DadosRecebedor) {
  const auth = authHeader()
  if (!auth) return { success: false as const, error: 'PAGARME_SECRET_KEY não configurada.' }

  try {
    const res = await fetch(`${PAGARME_API}/recipients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: auth,
      },
      body: JSON.stringify({
        name: dados.nome,
        email: dados.email,
        document: dados.documento,
        type: dados.tipo,
        ...(dados.tipo === 'company' ? { company_name: dados.nome } : {}),
        ...(dados.siteUrl ? { site_url: dados.siteUrl } : {}),
        phone: dados.telefone,
        address: dados.endereco,
        bank_account: {
          holder_name: dados.banco.titular_nome,
          holder_type: dados.tipo,
          holder_document: dados.banco.titular_documento,
          bank: dados.banco.codigo,
          branch_number: dados.banco.agencia,
          account_number: dados.banco.conta,
          account_check_digit: dados.banco.digito,
          type: dados.banco.tipo,
        },
        transfer_settings: {
          transfer_enabled: true,
          transfer_interval: 'daily',
          transfer_day: 1,
        },
        automatic_anticipation_settings: {
          enabled: false,
        },
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('[pagarme:criarRecebedor] Erro:', data)
      return {
        success: false as const,
        error: data?.message || 'Erro ao criar recebedor.',
        detalhes: data,
      }
    }

    return {
      success: true as const,
      recipientId: data.id as string,
      status: (data.status || 'registration') as string,
      kycUrl: (data.register_information_url || null) as string | null,
      raw: data,
    }
  } catch (e) {
    console.error('[pagarme:criarRecebedor] Erro inesperado:', e)
    return { success: false as const, error: 'Erro ao comunicar com Pagar.me.' }
  }
}

export async function obterRecebedor(recipientId: string) {
  const auth = authHeader()
  if (!auth) return { success: false as const, error: 'PAGARME_SECRET_KEY não configurada.' }

  try {
    const res = await fetch(`${PAGARME_API}/recipients/${recipientId}`, {
      headers: { Authorization: auth },
    })
    const data = await res.json()
    if (!res.ok) {
      return { success: false as const, error: data?.message || 'Erro ao buscar recebedor.' }
    }
    return {
      success: true as const,
      status: (data.status || 'unknown') as string,
      kycUrl: (data.register_information_url || null) as string | null,
      raw: data,
    }
  } catch (e) {
    return { success: false as const, error: 'Erro ao comunicar com Pagar.me.' }
  }
}

// ── Clientes (responsáveis) ───────────────────────────────────────
export async function criarOuAtualizarCliente(params: {
  nome: string
  email: string
  documento?: string
  telefone?: PagarmeTelefone
  endereco?: PagarmeEndereco
}) {
  const auth = authHeader()
  if (!auth) return { success: false as const, error: 'PAGARME_SECRET_KEY não configurada.' }

  try {
    const res = await fetch(`${PAGARME_API}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: auth,
      },
      body: JSON.stringify({
        name: params.nome,
        email: params.email,
        type: 'individual',
        ...(params.documento ? { document: params.documento } : {}),
        ...(params.telefone ? { phones: { mobile_phone: params.telefone } } : {}),
        ...(params.endereco ? { address: params.endereco } : {}),
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      return {
        success: false as const,
        error: data?.message || 'Erro ao criar cliente.',
        detalhes: data,
      }
    }
    return { success: true as const, customerId: data.id as string, raw: data }
  } catch (e) {
    return { success: false as const, error: 'Erro ao comunicar com Pagar.me.' }
  }
}

// ── Pedidos (orders com split) ────────────────────────────────────
export type SplitRule = {
  recipientId: string
  amount?: number            // centavos
  percentage?: number        // 0-100
  chargeRemainder?: boolean
  chargeProcessingFee?: boolean
  liable?: boolean
}

export type ItemPedido = {
  amount: number             // centavos
  description: string
  quantity: number
  code?: string
}

export type MetodoPagamento =
  | { tipo: 'pix'; expiresInSeconds?: number }
  | { tipo: 'boleto'; instrucoes?: string; expiresInDays?: number }
  | { tipo: 'credit_card'; cardToken: string; installments: number; cvv?: string; statementDescriptor?: string }

export async function criarPedido(params: {
  code: string
  clienteId: string
  itens: ItemPedido[]
  metodo: MetodoPagamento
  split: SplitRule[]
  metadata?: Record<string, string>
}) {
  const auth = authHeader()
  if (!auth) return { success: false as const, error: 'PAGARME_SECRET_KEY não configurada.' }

  const payments: any[] = [{ payment_method: params.metodo.tipo }]

  if (params.metodo.tipo === 'pix') {
    payments[0].pix = {
      expires_in: params.metodo.expiresInSeconds ?? 3600 * 24 * 7,
    }
  } else if (params.metodo.tipo === 'boleto') {
    const vencimento = new Date()
    vencimento.setDate(vencimento.getDate() + (params.metodo.expiresInDays ?? 3))
    payments[0].boleto = {
      instructions: params.metodo.instrucoes || 'Pagar até o vencimento',
      due_at: vencimento.toISOString(),
    }
  } else if (params.metodo.tipo === 'credit_card') {
    payments[0].credit_card = {
      installments: params.metodo.installments,
      statement_descriptor: params.metodo.statementDescriptor || 'ARXUM EDU',
      card_token: params.metodo.cardToken,
      ...(params.metodo.cvv ? { card: { cvv: params.metodo.cvv } } : {}),
    }
  }

  try {
    const res = await fetch(`${PAGARME_API}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: auth,
      },
      body: JSON.stringify({
        code: params.code,
        customer_id: params.clienteId,
        items: params.itens.map((i) => ({
          amount: i.amount,
          description: i.description,
          quantity: i.quantity,
          code: i.code || i.description.slice(0, 30),
        })),
        payments,
        split: params.split.map((s) => ({
          recipient_id: s.recipientId,
          ...(s.amount !== undefined ? { amount: s.amount } : {}),
          ...(s.percentage !== undefined ? { percentage: s.percentage } : {}),
          ...(s.chargeRemainder !== undefined ? { charge_remainder: s.chargeRemainder } : {}),
          ...(s.chargeProcessingFee !== undefined ? { charge_processing_fee: s.chargeProcessingFee } : {}),
          ...(s.liable !== undefined ? { liable: s.liable } : {}),
        })),
        metadata: params.metadata || {},
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('[pagarme:criarPedido] Erro:', data)
      return {
        success: false as const,
        error: data?.message || 'Erro ao criar pedido.',
        detalhes: data,
      }
    }

    const charge = data.charges?.[0]
    const tx = charge?.last_transaction

    return {
      success: true as const,
      orderId: data.id as string,
      orderCode: data.code as string,
      status: data.status as string,
      chargeId: (charge?.id || null) as string | null,
      chargeStatus: (charge?.status || null) as string | null,
      qrCode: (tx?.qr_code || null) as string | null,
      qrCodeUrl: (tx?.qr_code_url || null) as string | null,
      boletoUrl: (tx?.url || null) as string | null,
      boletoBarcode: (tx?.line || null) as string | null,
      paymentUrl: ((tx?.url || tx?.qr_code_url) || null) as string | null,
      raw: data,
    }
  } catch (e) {
    console.error('[pagarme:criarPedido] Erro inesperado:', e)
    return { success: false as const, error: 'Erro ao comunicar com Pagar.me.' }
  }
}

export async function obterPedido(orderId: string) {
  const auth = authHeader()
  if (!auth) return { success: false as const, error: 'PAGARME_SECRET_KEY não configurada.' }

  try {
    const res = await fetch(`${PAGARME_API}/orders/${orderId}`, {
      headers: { Authorization: auth },
    })
    const data = await res.json()
    if (!res.ok) {
      return { success: false as const, error: data?.message || 'Erro ao buscar pedido.' }
    }
    return { success: true as const, status: data.status as string, raw: data }
  } catch (e) {
    return { success: false as const, error: 'Erro ao comunicar com Pagar.me.' }
  }
}

// ── Cálculo de split ──────────────────────────────────────────────
// Faturas: ARXUM recebe a % do total via `percentage`. Escola é a
// liable + charge_processing_fee + charge_remainder, então absorve a
// taxa do Pagar.me (não sobra pro ARXUM nem pro responsável).
export function calcularSplitFatura(params: {
  taxaArxumBps: number         // 200 = 2%
  recipientEscolaId: string
  recipientArxumId: string
}): SplitRule[] {
  return [
    {
      recipientId: params.recipientArxumId,
      percentage: params.taxaArxumBps / 100,
      liable: false,
      chargeProcessingFee: false,
      chargeRemainder: false,
    },
    {
      recipientId: params.recipientEscolaId,
      liable: true,
      chargeProcessingFee: true,
      chargeRemainder: true,
    },
  ]
}

// Loja: produto X% pra ARXUM + R$ 0,99 de taxa de serviço pro ARXUM.
// Escola recebe o resto e absorve a taxa do Pagar.me.
export function calcularSplitLoja(params: {
  valorProdutosCentavos: number
  taxaServicoCentavos: number
  taxaArxumBps: number         // 300 = 3%
  recipientEscolaId: string
  recipientArxumId: string
}): { split: SplitRule[]; totalCobradoCentavos: number } {
  const totalCobradoCentavos = params.valorProdutosCentavos + params.taxaServicoCentavos
  const valorArxum = Math.round((params.valorProdutosCentavos * params.taxaArxumBps) / 10000) + params.taxaServicoCentavos

  return {
    totalCobradoCentavos,
    split: [
      {
        recipientId: params.recipientArxumId,
        amount: valorArxum,
        liable: false,
        chargeProcessingFee: false,
        chargeRemainder: false,
      },
      {
        recipientId: params.recipientEscolaId,
        liable: true,
        chargeProcessingFee: true,
        chargeRemainder: true,
      },
    ],
  }
}