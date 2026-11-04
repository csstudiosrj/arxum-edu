'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getEscolaDoUsuario } from '@/lib/auth/escola-atual'
import { validarToken, tokenPadrao } from '@/lib/mercadopago'
import { revalidatePath } from 'next/cache'

export async function getDadosMercadoPago() {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return null

    const admin = createAdminClient()
    const { data } = await admin
      .from('escolas')
      .select('mercadopago_access_token, mercadopago_public_key, mercadopago_conta')
      .eq('id', escola.id)
      .maybeSingle()

    // Nunca devolve o token para o navegador, só se existe e um trecho final.
    const token = (data?.mercadopago_access_token || '') as string
    return {
      configurado: !!token || !!tokenPadrao(),
      usaTokenPadrao: !token && !!tokenPadrao(),
      tokenFinal: token ? token.slice(-4) : null,
      conta: (data?.mercadopago_conta || null) as string | null,
      modoTeste: token.startsWith('TEST-'),
      temPublicKey: !!data?.mercadopago_public_key || (!token && !!process.env.MERCADOPAGO_PUBLIC_KEY),
    }
  } catch {
    return null
  }
}

export async function salvarAccessToken(accessToken: string, publicKey: string) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const token = accessToken.trim()
    if (!token) return { success: false, error: 'Informe o Access Token.' }

    const pk = publicKey.trim()
    if (!pk) return { success: false, error: 'Informe a Public Key (necessária para pagamento com cartão).' }
    const testeToken = token.startsWith('TEST-')
    if (!/^(APP_USR|TEST)-/.test(pk) || pk.startsWith('TEST-') !== testeToken) {
      return { success: false, error: 'A Public Key não confere com o Access Token (use as duas de produção ou as duas de teste).' }
    }

    const check = await validarToken(token)
    if (!check.success) return { success: false, error: check.error }

    const admin = createAdminClient()
    const { error } = await admin
      .from('escolas')
      .update({
        mercadopago_access_token: token,
        mercadopago_public_key: pk,
        mercadopago_conta: check.email || check.nickname || check.userId,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', escola.id)

    if (error) return { success: false, error: 'Erro ao salvar: ' + error.message }

    revalidatePath('/admin/financeiro/mercadopago')
    return { success: true, modoTeste: check.modoTeste }
  } catch {
    return { success: false, error: 'Erro inesperado. Tente novamente.' }
  }
}

export async function removerAccessToken() {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const { error } = await admin
      .from('escolas')
      .update({ mercadopago_access_token: null, mercadopago_public_key: null, mercadopago_conta: null, atualizado_em: new Date().toISOString() })
      .eq('id', escola.id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/financeiro/mercadopago')
    return { success: true }
  } catch {
    return { success: false, error: 'Erro ao remover.' }
  }
}
