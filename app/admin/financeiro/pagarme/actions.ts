'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getEscolaDoUsuario } from '@/lib/auth/escola-atual'
import { criarRecebedor, obterRecebedor, type DadosRecebedor } from '@/lib/pagarme'
import { revalidatePath } from 'next/cache'

export async function getDadosPagarme() {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return null

    const admin = createAdminClient()
    const { data } = await admin
      .from('escolas')
      .select('pagarme_recipient_id, pagarme_recipient_status, pagarme_kyc_url')
      .eq('id', escola.id)
      .maybeSingle()

    return data
  } catch (e) {
    return null
  }
}

export async function cadastrarRecebedor(dados: DadosRecebedor) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()

    // 1. Verifica se já tem recebedor
    const { data: escolaAtual } = await admin
      .from('escolas')
      .select('pagarme_recipient_id')
      .eq('id', escola.id)
      .single()

    if (escolaAtual?.pagarme_recipient_id) {
      return { success: false, error: 'Esta escola já possui um recebedor cadastrado.' }
    }

    // 2. Cria na Pagar.me
    const result = await criarRecebedor(dados)

    if (!result.success) {
      return { success: false, error: result.error, detalhes: result.detalhes }
    }

    // 3. Salva no banco
    const { error } = await admin
      .from('escolas')
      .update({
        pagarme_recipient_id: result.recipientId,
        pagarme_recipient_status: result.status,
        pagarme_kyc_url: result.kycUrl,
        pagarme_recipient_data: result.raw,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', escola.id)

    if (error) {
      return { success: false, error: 'Erro ao salvar dados no banco: ' + error.message }
    }

    revalidatePath('/admin/financeiro/pagarme')
    return { success: true, status: result.status, kycUrl: result.kycUrl }
  } catch (e: any) {
    console.error('Erro ao cadastrar recebedor:', e)
    return { success: false, error: 'Erro inesperado. Tente novamente.' }
  }
}

export async function sincronizarStatusRecebedor() {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const { data: escolaAtual } = await admin
      .from('escolas')
      .select('pagarme_recipient_id')
      .eq('id', escola.id)
      .single()

    if (!escolaAtual?.pagarme_recipient_id) {
      return { success: false, error: 'Nenhum recebedor cadastrado.' }
    }

    const result = await obterRecebedor(escolaAtual.pagarme_recipient_id)

    if (!result.success) {
      return { success: false, error: result.error }
    }

    await admin
      .from('escolas')
      .update({
        pagarme_recipient_status: result.status,
        pagarme_kyc_url: result.kycUrl,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', escola.id)

    revalidatePath('/admin/financeiro/pagarme')
    return { success: true, status: result.status }
  } catch (e) {
    return { success: false, error: 'Erro ao sincronizar.' }
  }
}