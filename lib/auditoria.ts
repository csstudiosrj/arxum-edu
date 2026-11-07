'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'

export async function registrarLog(data: {
  escola_id: string
  usuario_email: string
  usuario_nome: string
  acao: string
  entidade: string
  entidade_id?: string
  detalhes?: any
}) {
  try {
    const admin = createAdminClient()
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for')?.split(',')[0].trim() || 'Desconhecido'

    await admin.from('logs_auditoria').insert({
      escola_id: data.escola_id,
      usuario_email: data.usuario_email,
      usuario_nome: data.usuario_nome,
      acao: data.acao,
      entidade: data.entidade,
      entidade_id: data.entidade_id || null,
      detalhes: data.detalhes || null,
      ip
    })
  } catch (e) {
    console.error('Falha ao registrar log de auditoria:', e)
    // Não lança erro para não quebrar a ação principal
  }
}