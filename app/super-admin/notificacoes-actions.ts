'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export type NotificacaoSuper = {
  id: string
  tipo: string
  titulo: string
  descricao: string
  link_destino: string
  lida: boolean
  criado_em: string
}

export async function getNotificacoesSuperAdmin(): Promise<NotificacaoSuper[]> {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('notificacoes_super_admin')
      .select('*')
      .order('criado_em', { ascending: false })
      .limit(15)

    return data || []
  } catch (e) {
    return []
  }
}

export async function marcarNotificacaoLida(id: string) {
  try {
    const admin = createAdminClient()
    await admin.from('notificacoes_super_admin').update({ lida: true }).eq('id', id)
    revalidatePath('/super-admin')
    return { success: true }
  } catch (e) {
    return { success: false }
  }
}

// Função para criar notificações de outros lugares do sistema (ex: Webhook ou Suporte)
export async function criarNotificacaoSuper(tipo: string, titulo: string, descricao: string, link: string) {
  const admin = createAdminClient()
  await admin.from('notificacoes_super_admin').insert({
    tipo, titulo, descricao, link_destino: link
  })
}
