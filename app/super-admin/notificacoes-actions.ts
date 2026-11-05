'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export type NotificacaoSuper = {
  id: string
  tipo: 'suporte' | 'financeiro'
  titulo: string
  descricao: string
  link: string
  data: string
}

export async function getNotificacoesSuperAdmin(): Promise<NotificacaoSuper[]> {
  try {
    const admin = createAdminClient()
    const notificacoes: NotificacaoSuper[] = []

    // 1. Tickets Abertos / Em andamento (Suporte)
    const { data: tickets } = await admin
      .from('tickets_suporte')
      .select('id, escola_nome, assunto, criado_em')
      .in('status', ['aberto', 'em_andamento'])
      .order('criado_em', { ascending: false })
      .limit(5)

    if (tickets) {
      tickets.forEach(t => {
        notificacoes.push({
          id: `ticket-${t.id}`,
          tipo: 'suporte',
          titulo: 'Chamado de Suporte',
          descricao: `${t.escola_nome}: ${t.assunto}`,
          link: '/super-admin/suporte',
          data: t.criado_em
        })
      })
    }

    // 2. Faturas Vencidas (Financeiro)
    const { data: faturas } = await admin
      .from('faturamento_escolas')
      .select('id, escola_nome, valor_centavos, vencimento')
      .eq('status', 'vencido')
      .order('vencimento', { ascending: false })
      .limit(5)

    if (faturas) {
      faturas.forEach(f => {
        notificacoes.push({
          id: `fatura-${f.id}`,
          tipo: 'financeiro',
          titulo: 'Fatura Vencida',
          descricao: `${f.escola_nome} - R$ ${(f.valor_centavos / 100).toFixed(2).replace('.', ',')}`,
          link: '/super-admin/financeiro',
          data: f.vencimento + 'T12:00:00' // fallback para ordenação
        })
      })
    }

    // Ordena todas as notificações pela data (mais recentes primeiro)
    return notificacoes.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
  } catch (e) {
    console.error('Erro ao buscar notificações super admin:', e)
    return []
  }
}
