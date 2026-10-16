import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  CONFIG_PADRAO,
  EVENTOS_META,
  type ConfigEvento,
  type EventoNotificacao,
} from '@/lib/notificacoes-config'

export async function getConfigNotificacoes(escolaId: string): Promise<ConfigEvento[]> {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('notificacoes_config')
      .select('evento, canal_email, canal_whatsapp, canal_push')
      .eq('escola_id', escolaId)

    const mapa = new Map<string, ConfigEvento>()
    ;(data || []).forEach((c) => mapa.set(c.evento, c as ConfigEvento))

    return EVENTOS_META.map((meta) => {
      const salvo = mapa.get(meta.evento)
      return (
        salvo || {
          evento: meta.evento,
          canal_email: true,
          canal_whatsapp: false,
          canal_push: false,
        }
      )
    })
  } catch (e) {
    return CONFIG_PADRAO
  }
}

export async function canalEmailAtivo(
  escolaId: string,
  evento: EventoNotificacao
): Promise<boolean> {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('notificacoes_config')
      .select('canal_email')
      .eq('escola_id', escolaId)
      .eq('evento', evento)
      .maybeSingle()
    if (!data) return true
    return !!data.canal_email
  } catch (e) {
    return true
  }
}

// Wrapper: só executa a função `enviar` se o canal de e-mail
// estiver ligado para o evento naquela escola.
export async function enviarSeAtivo(params: {
  escolaId: string
  evento: EventoNotificacao
  enviar: () => Promise<{ success: boolean; error?: string }>
}): Promise<{ success: boolean; skipped?: boolean; error?: string }> {
  const ativo = await canalEmailAtivo(params.escolaId, params.evento)
  if (!ativo) return { success: true, skipped: true }
  return params.enviar()
}