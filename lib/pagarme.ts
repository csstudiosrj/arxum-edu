const PAGARME_API = 'https://api.pagar.me/core/v5'

function authHeader() {
  const key = process.env.PAGARME_API_KEY
  if (!key) return null
  return 'Basic ' + Buffer.from(`${key}:`).toString('base64')
}

export function pagarmeConfigurado(): boolean {
  return !!process.env.PAGARME_API_KEY
}

export async function criarCobrancaPix(params: {
  valorCentavos: number
  descricao: string
  nomeCliente: string
  emailCliente: string
  vencimento: string
}) {
  const auth = authHeader()
  if (!auth) {
    return { success: false, error: 'PAGARME_API_KEY não configurada.' }
  }

  try {
    const res = await fetch(`${PAGARME_API}/paymentlinks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: auth,
      },
      body: JSON.stringify({
        is_building: false,
        type: 'order',
        name: params.descricao,
        payment_settings: {
          accepted_payment_methods: ['pix'],
          credit_card_settings: null,
          pix_settings: {
            expires_in: 3600 * 24 * 7,
          },
        },
        cart_settings: {
          items: [
            {
              name: params.descricao,
              amount: params.valorCentavos,
              default_quantity: 1,
            },
          ],
        },
        customer_settings: {
          customer: {
            name: params.nomeCliente,
            email: params.emailCliente,
            type: 'individual',
          },
        },
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('[pagarme] Erro:', data)
      return { success: false, error: data?.message || 'Erro ao criar cobrança.' }
    }

    return {
      success: true,
      linkId: data.id,
      url: data.url,
    }
  } catch (e) {
    console.error('[pagarme] Erro inesperado:', e)
    return { success: false, error: 'Erro ao comunicar com Pagar.me.' }
  }
}