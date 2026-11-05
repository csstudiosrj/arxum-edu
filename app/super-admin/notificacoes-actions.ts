'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export type NotificacaoSuper = {
  id: string
  tipo: 'suporte' | 'financeiro'
  titulo: string
  descricao: string
  link: string
}

export async function getNotificacoesSuperAdmin(): Promise<NotificacaoSuper[]> {
  try {
    const admin = createAdminClient()
    const notificacoes: NotificacaoSuper[] = []

    // 1. Tickets Abertos
    const { data: tickets } = await admin
      .from('tickets_suporte')
      .select('id, escola_nome, assunto')
      .in('status', ['aberto', 'em_andamento'])
      .order('criado_em', { ascending: false })
      .limit(5)

    if (tickets) {
      tickets.forEach(t => {
        notificacoes.push({
          id: `ticket-${t.id}`,
          tipo: 'suporte',
          titulo: 'Novo chamado de suporte',
          descricao: `${t.escola_nome}: ${t.assunto}`,
          link: '/super-admin/suporte'
        })
      })
    }

    // 2. Faturas Vencidas
    const { data: faturas } = await admin
      .from('faturamento_escolas')
      .select('id, escola_nome, valor_centavos')
      .eq('status', 'vencido')
      .order('vencimento', { ascending: true })
      .limit(5)

    if (faturas) {
      faturas.forEach(f => {
        notificacoes.push({
          id: `fatura-${f.id}`,
          tipo: 'financeiro',
          titulo: 'Fatura vencida',
          descricao: `${f.escola_nome} - R$ ${(f.valor_centavos / 100).toFixed(2).replace('.', ',')}`,
          link: '/super-admin/financeiro'
        })
      })
    }

    return notificacoes
  } catch (e) {
    return []
  }
}
