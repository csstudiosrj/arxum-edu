'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export type ConfiguracoesMonetizacao = {
  id: string
  taxa_mensalidade_padrao_bps: number
  taxa_mensalidade_mp_bps: number
  taxa_loja_padrao_bps: number
  taxa_loja_mp_bps: number
}

export async function getConfiguracoesMonetizacao(): Promise<ConfiguracoesMonetizacao | null> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('configuracoes_monetizacao')
      .select('*')
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return data
  } catch (e) {
    console.error('Erro ao buscar configurações de monetização:', e)
    return null
  }
}

export async function salvarConfiguracoesMonetizacao(data: {
  taxa_mensalidade_padrao_bps: number
  taxa_mensalidade_mp_bps: number
  taxa_loja_padrao_bps: number
  taxa_loja_mp_bps: number
}) {
  try {
    const admin = createAdminClient()
    
    // Verifica se já existe uma linha
    const { data: existente } = await admin.from('configuracoes_monetizacao').select('id').limit(1).maybeSingle()

    if (existente) {
      const { error } = await admin.from('configuracoes_monetizacao').update({
        ...data,
        atualizado_em: new Date().toISOString()
      }).eq('id', existente.id)
      if (error) return { success: false, error: error.message }
    } else {
      const { error } = await admin.from('configuracoes_monetizacao').insert({
        ...data,
        atualizado_em: new Date().toISOString()
      })
      if (error) return { success: false, error: error.message }
    }

    revalidatePath('/super-admin/monetizacao')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao salvar configurações.' }
  }
}
