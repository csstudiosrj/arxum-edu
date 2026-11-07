'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getEscolaDoUsuario } from '@/lib/auth/escola-atual'

export type LogAuditoria = {
  id: string
  usuario_email: string
  usuario_nome: string
  acao: string
  entidade: string
  entidade_id: string | null
  detalhes: any
  ip: string
  criado_em: string
}

export async function getLogsAuditoria(filtroAcao?: string): Promise<LogAuditoria[]> {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return []

    const admin = createAdminClient()
    let query = admin
      .from('logs_auditoria')
      .select('*')
      .eq('escola_id', escola.id)
      .order('criado_em', { ascending: false })
      .limit(200)

    if (filtroAcao) {
      query = query.eq('acao', filtroAcao)
    }

    const { data, error } = await query
    if (error) return []

    return (data || []) as LogAuditoria[]
  } catch (e) {
    return []
  }
}