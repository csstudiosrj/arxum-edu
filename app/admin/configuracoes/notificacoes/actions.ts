'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getEscolaDoUsuario } from '@/lib/auth/escola-atual'
import { revalidatePath } from 'next/cache'
import type { EventoNotificacao } from '@/lib/notificacoes-config'

export async function getConfig() {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return []
    const { getConfigNotificacoes } = await import('@/lib/notificacoes-config-server')
    return await getConfigNotificacoes(escola.id)
  } catch (e) {
    return []
  }
}

export async function salvarConfig(
  evento: EventoNotificacao,
  canais: { canal_email: boolean; canal_whatsapp: boolean; canal_push: boolean }
) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()

    const { data: existente } = await admin
      .from('notificacoes_config')
      .select('id')
      .eq('escola_id', escola.id)
      .eq('evento', evento)
      .maybeSingle()

    if (existente) {
      const { error } = await admin
        .from('notificacoes_config')
        .update({
          canal_email: canais.canal_email,
          canal_whatsapp: canais.canal_whatsapp,
          canal_push: canais.canal_push,
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', existente.id)
      if (error) return { success: false, error: error.message }
    } else {
      const { error } = await admin.from('notificacoes_config').insert({
        escola_id: escola.id,
        evento,
        canal_email: canais.canal_email,
        canal_whatsapp: canais.canal_whatsapp,
        canal_push: canais.canal_push,
      })
      if (error) return { success: false, error: error.message }
    }

    revalidatePath('/admin/configuracoes/notificacoes')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao salvar.' }
  }
}