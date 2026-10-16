'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getEscolaDoUsuario } from '@/lib/auth/escola-atual'

export type DashboardData = {
  escolaNome: string
  totalAlunos: number
  matriculasPendentes: number
  faturasEmAberto: number
  comunicadosNaoLidos: number
  matriculasRecentes: Array<{
    id: string
    aluno_nome: string
    aluno_serie: string | null
    responsavel_nome: string
    status: string
    criado_em: string
  }>
}

export async function getDashboardData(): Promise<DashboardData> {
  const vazio: DashboardData = {
    escolaNome: 'Minha escola',
    totalAlunos: 0,
    matriculasPendentes: 0,
    faturasEmAberto: 0,
    comunicadosNaoLidos: 0,
    matriculasRecentes: [],
  }

  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return vazio

    const admin = createAdminClient()

    // Total de alunos ativos
    const { count: totalAlunos } = await admin
      .from('alunos')
      .select('*', { count: 'exact', head: true })
      .eq('escola_id', escola.id)
      .eq('status', 'ativo')

    // Matrículas pendentes
    const { count: matriculasPendentes } = await admin
      .from('inscricoes')
      .select('*', { count: 'exact', head: true })
      .eq('escola_id', escola.id)
      .in('status', ['inscrito', 'em_analise', 'entrevista'])

    // Faturas em aberto
    const { count: faturasEmAberto } = await admin
      .from('faturas')
      .select('*', { count: 'exact', head: true })
      .eq('escola_id', escola.id)
      .in('status', ['em_aberto', 'vencido'])

    // Comunicados ativos
    const { data: comunicados } = await admin
      .from('comunicados')
      .select('id')
      .eq('escola_id', escola.id)
      .eq('ativo', true)

    const idsComunicados = (comunicados || []).map((c) => c.id)

    let comunicadosNaoLidos = 0
    if (idsComunicados.length > 0) {
      const { data: leituras } = await admin
        .from('comunicados_leituras')
        .select('comunicado_id')
        .in('comunicado_id', idsComunicados)

      const leiturasUnicas = new Set((leituras || []).map((l) => l.comunicado_id))
      comunicadosNaoLidos = idsComunicados.length - leiturasUnicas.size
      if (comunicadosNaoLidos < 0) comunicadosNaoLidos = 0
    }

    // Últimas matrículas
    const { data: recentes } = await admin
      .from('inscricoes')
      .select('id, aluno_nome, aluno_serie, responsavel_nome, status, criado_em')
      .eq('escola_id', escola.id)
      .order('criado_em', { ascending: false })
      .limit(6)

    return {
      escolaNome: escola.nome,
      totalAlunos: totalAlunos || 0,
      matriculasPendentes: matriculasPendentes || 0,
      faturasEmAberto: faturasEmAberto || 0,
      comunicadosNaoLidos,
      matriculasRecentes: (recentes || []) as DashboardData['matriculasRecentes'],
    }
  } catch (e) {
    console.error('Erro ao buscar dados do dashboard:', e)
    return vazio
  }
}