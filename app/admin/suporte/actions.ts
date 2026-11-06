'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getEscolaDoUsuario } from '@/lib/auth/escola-atual'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type TicketEscola = {
  id: string
  assunto: string
  descricao: string
  prioridade: string
  status: string
  resposta: string | null
  criado_em: string
  atualizado_em: string
}

export async function getMeusTickets(): Promise<TicketEscola[]> {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return []

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('tickets_suporte')
      .select('id, assunto, descricao, prioridade, status, resposta, criado_em, atualizado_em')
      .eq('escola_id', escola.id)
      .order('criado_em', { ascending: false })

    if (error) return []
    return (data || []) as TicketEscola[]
  } catch (e) {
    return []
  }
}

export async function abrirTicket(data: { assunto: string; descricao: string; prioridade: string }) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    if (!data.assunto.trim() || !data.descricao.trim()) {
      return { success: false, error: 'Preencha o assunto e a descrição.' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const admin = createAdminClient()
    const { error } = await admin.from('tickets_suporte').insert({
      escola_id: escola.id,
      escola_nome: escola.nome,
      assunto: data.assunto,
      descricao: data.descricao,
      prioridade: data.prioridade || 'normal',
      status: 'aberto',
      aberto_por: user?.email || 'Admin da escola',
    })

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/suporte')
    revalidatePath('/super-admin/suporte')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao abrir ticket.' }
  }
}