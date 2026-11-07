'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getEscolaDoUsuario } from '@/lib/auth/escola-atual'
import { revalidatePath } from 'next/cache'

export type ConfigAvaliacao = {
  escala: '0-10' | 'conceito' | 'pontos'
  recuperacao: 'substitutiva' | 'media'
}

export async function getConfigAvaliacao(): Promise<ConfigAvaliacao> {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { escala: '0-10', recuperacao: 'substitutiva' }

    const admin = createAdminClient()
    const { data } = await admin
      .from('escolas')
      .select('config_avaliacao')
      .eq('id', escola.id)
      .maybeSingle()

    const config = data?.config_avaliacao as ConfigAvaliacao | null
    return config || { escala: '0-10', recuperacao: 'substitutiva' }
  } catch (e) {
    return { escala: '0-10', recuperacao: 'substitutiva' }
  }
}

export async function salvarConfigAvaliacao(config: ConfigAvaliacao) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const { error } = await admin
      .from('escolas')
      .update({ config_avaliacao: config })
      .eq('id', escola.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/configuracoes/avaliacao')
    revalidatePath('/admin/notas')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao salvar configurações.' }
  }
}