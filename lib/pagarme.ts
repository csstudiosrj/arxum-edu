// ── Pagar.me V5 (agora Stone Digital) ──────────────────────────────

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
  line_1: string
  zip_code: string
  city: string
  state: string
  country: string
}

export type PagarmeTelefone = {
  country_code: string
  area_code: string
  number: string
}

export type DadosRecebedor = {
  nome: string
  email: string
  documento: string
  tipo: 'individual' | 'company'
  telefone: PagarmeTelefone
  endereco: PagarmeEndereco
  banco: {
    codigo: string
    agencia: string
    agenciaDigito?: string
    conta: string
    digito: string
    tipo: 'checking' | 'savings'
    titular_nome: string
    titular_documento: string
    titular_tipo?: 'individual' | 'company'
  }
  siteUrl?: string
  registerInformation: {
    type: 'corporation' | 'individual'
    name: string
    company_name?: string
    trading_name?: string
    annual_revenue?: string
    site_url?: string
    corporation_type?: string
    founding_date?: string
    cnae?: string
    mother_name?: string
    birthdate?: string
    monthly_income?: string
    professional_occupation?: string
    document: string
    email: string
    phone_numbers: Array<{ ddd: string; number: string; type: string }>
    main_address: {
      street: string
      complementary: string
      street_number: string
      neighborhood: string
      city: string
      state: string
      zip_code: string
      reference_point: string
    }
    managing_partners?: Array<{
      type: 'individual'
      name: string
      document: string
      mother_name?: string
      birthdate: string
      email: string
      monthly_income: string
      professional_occupation: string
      self_declared_legal_representative: boolean
      address: {
        street: string
        complementary: string
        street_number: string
        neighborhood: string
        city: string
        state: string
        zip_code: string
        reference_point: string
      }
      phone_numbers: Array<{ ddd: string; number: string; type: string }>
    }>
  }
}

// ── Recebedores (escolas no marketplace) ──────────────────────────
export async function criarRecebedor(dados: DadosRecebedor) {
  const auth = authHeader()
  if (!auth) return { success: false as const, error: 'PAGARME_SECRET_KEY não configurada.' }

  try {
    // register_information leva os dados cadastrais detalhados.
    // name, email, document e type também vão na raiz — é o que a API V5 exige.
    const registerInfo = {
      ...dados.registerInformation,
      name: dados.nome,
      email: dados.email,
      document: dados.documento,
      type: dados.tipo === 'company' ? 'corporation' : 'individual',
    }

    const payload = {
      // ── Campos obrigatórios na RAIZ ────────────────────────────
      name: dados.nome,
      email: dados.email,
      document: dados.documento,
      type: dados.tipo, // 'individual' ou 'company'

      // ── Conta bancária ─────────────────────────────────────────
      default_bank_account: {
        holder_name: dados.banco.titular_nome,
        holder_type: dados.banco.titular_tipo || dados.tipo,
        holder_document: dados.banco.titular_documento,
        bank: dados.banco.codigo.slice(0, 3),
        branch_number: dados.banco.agencia,
        ...(dados.banco.agenciaDigito ? { branch_check_digit: dados.banco.agenciaDigito } : {}),
        account_number: dados.banco.conta,
        account_check_digit: dados.banco.digito,
        type: dados.banco.tipo,
      },

      // ── Transferências ─────────────────────────────────────────
      transfer_settings: {
        transfer_enabled: true,
        transfer_interval: 'Daily',
        transfer_day: 0,
      },
      automatic_anticipation_settings: {
        enabled: false,
      },

      // ── Dados cadastrais detalhados (KYC) ──────────────────────
      register_information: registerInfo,
    }

    const res = await fetch(`${PAGARME_API}/recipients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: auth,
      },
      body: JSON.stringify(payload),
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
  amount: number
  type: 'flat' | 'percentage'
  options?: {
    liable?: boolean
    chargeProcessingFee?: boolean
    chargeRemainderFee?: boolean
  }
}

export type ItemPedido = {
  amount: number
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
          amount: s.amount,
          type: s.type,
          options: {
            liable: s.options?.liable ?? false,
            charge_processing_fee: s.options?.chargeProcessingFee ?? false,
            charge_remainder_fee: s.options?.chargeRemainderFee ?? false,
          },
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
export function calcularSplitFatura(params: {
  taxaArxumBps: number
  recipientEscolaId: string
}): SplitRule[] {
  return [
    {
      recipientId: params.recipientEscolaId,
      amount: 100 - (params.taxaArxumBps / 100),
      type: 'percentage',
      options: {
        liable: true,
        chargeProcessingFee: true,
        chargeRemainderFee: false,
      },
    },
  ]
}

export function calcularSplitLoja(params: {
  valorProdutosCentavos: number
  taxaServicoCentavos: number
  taxaArxumBps: number
  recipientEscolaId: string
}): { split: SplitRule[]; totalCobradoCentavos: number } {
  const totalCobradoCentavos = params.valorProdutosCentavos + params.taxaServicoCentavos
  const valorArxum = Math.round((params.valorProdutosCentavos * params.taxaArxumBps) / 10000) + params.taxaServicoCentavos
  const valorEscola = totalCobradoCentavos - valorArxum

  return {
    totalCobradoCentavos,
    split: [
      {
        recipientId: params.recipientEscolaId,
        amount: valorEscola,
        type: 'flat',
        options: {
          liable: true,
          chargeProcessingFee: true,
          chargeRemainderFee: false,
        },
      },
    ],
  }
}