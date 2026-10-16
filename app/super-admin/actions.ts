'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export type MetricasSaaS = {
  escolasAtivas: number
  escolasTrial: number
  escolasSuspensas: number
  escolasTotal: number
  mrrCentavos: number
  alunosTotal: number
  distribuicaoPlanos: Array<{ plano: string; total: number; mrrCentavos: number }>
  escolasRecentes: Array<{ id: string; nome: string; slug: string; plano: string; alunos: number; criado_em: string }>
  ticketsAbertos: number
  ticketsUrgentes: number
  ticketsRecentes: Array<{ id: string; escola_nome: string; assunto: string; prioridade: string; status: string; criado_em: string }>
  novosEsteMes: number
}

const precosPlanos: Record<string, number> = {
  semente: 19900,
  raiz: 39900,
  copa: 69900,
  rede: 0,
}

export async function getMetricasSaaS(): Promise<MetricasSaaS> {
  const vazio: MetricasSaaS = {
    escolasAtivas: 0, escolasTrial: 0, escolasSuspensas: 0, escolasTotal: 0,
    mrrCentavos: 0, alunosTotal: 0, distribuicaoPlanos: [], escolasRecentes: [],
    ticketsAbertos: 0, ticketsUrgentes: 0, ticketsRecentes: [], novosEsteMes: 0,
  }

  try {
    const admin = createAdminClient()

    const { data: escolas, error } = await admin
      .from('escolas')
      .select('id, nome, slug, plano, criado_em')

    if (error || !escolas) return vazio

    const { data: alunos } = await admin
      .from('alunos')
      .select('escola_id')

    const alunosPorEscola: Record<string, number> = {}
    ;(alunos || []).forEach((a) => {
      if (a.escola_id) {
        alunosPorEscola[a.escola_id] = (alunosPorEscola[a.escola_id] || 0) + 1
      }
    })

    const totalAlunos = (alunos || []).length

    const agora = new Date()
    const mesAtual = agora.getMonth()
    const anoAtual = agora.getFullYear()
    const inicioMes = new Date(anoAtual, mesAtual, 1)

    const escolasAtivas = escolas.filter((e) => e.plano !== 'rede' || true).length
    const escolasTrial = 0
    const escolasSuspensas = 0

    const distribuicaoPlanosMap: Record<string, { total: number; mrrCentavos: number }> = {}
    escolas.forEach((e) => {
      if (!distribuicaoPlanosMap[e.plano]) distribuicaoPlanosMap[e.plano] = { total: 0, mrrCentavos: 0 }
      distribuicaoPlanosMap[e.plano].total += 1
      distribuicaoPlanosMap[e.plano].mrrCentavos += precosPlanos[e.plano] || 0
    })

    const distribuicaoPlanos = Object.entries(distribuicaoPlanosMap)
      .map(([plano, v]) => ({ plano, total: v.total, mrrCentavos: v.mrrCentavos }))
      .sort((a, b) => b.total - a.total)

    const mrrCentavos = Object.values(distribuicaoPlanosMap).reduce((s, v) => s + v.mrrCentavos, 0)

    const escolasRecentes = [...escolas]
      .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())
      .slice(0, 6)
      .map((e) => ({
        id: e.id,
        nome: e.nome,
        slug: e.slug,
        plano: e.plano,
        alunos: alunosPorEscola[e.id] || 0,
        criado_em: e.criado_em,
      }))

    const novosEsteMes = escolas.filter((e) => new Date(e.criado_em) >= inicioMes).length

    // Tickets
    const { data: tickets } = await admin
      .from('tickets_suporte')
      .select('id, escola_nome, assunto, prioridade, status, criado_em')
      .order('criado_em', { ascending: false })

    const ticketsAbertos = (tickets || []).filter((t) => t.status === 'aberto' || t.status === 'em_andamento').length
    const ticketsUrgentes = (tickets || []).filter((t) => t.prioridade === 'urgente' || t.prioridade === 'alta').length

    return {
      escolasAtivas,
      escolasTrial,
      escolasSuspensas,
      escolasTotal: escolas.length,
      mrrCentavos,
      alunosTotal: totalAlunos,
      distribuicaoPlanos,
      escolasRecentes,
      ticketsAbertos,
      ticketsUrgentes,
      ticketsRecentes: (tickets || []).slice(0, 5),
      novosEsteMes,
    }
  } catch (e) {
    console.error('Erro ao gerar métricas SaaS:', e)
    return vazio
  }
}

export type EscolaSuper = {
  id: string
  nome: string
  slug: string
  plano: string
  criado_em: string
  alunos: number
  faturas: number
  mrrCentavos: number
}

export async function getTodasEscolas(): Promise<EscolaSuper[]> {
  try {
    const admin = createAdminClient()

    const { data: escolas, error } = await admin
      .from('escolas')
      .select('id, nome, slug, plano, criado_em')
      .order('nome', { ascending: true })

    if (error || !escolas) return []

    const { data: alunos } = await admin.from('alunos').select('escola_id')
    const { data: faturas } = await admin.from('faturas').select('escola_id')

    const alunosPorEscola: Record<string, number> = {}
    ;(alunos || []).forEach((a) => {
      if (a.escola_id) alunosPorEscola[a.escola_id] = (alunosPorEscola[a.escola_id] || 0) + 1
    })

    const faturasPorEscola: Record<string, number> = {}
    ;(faturas || []).forEach((f) => {
      if (f.escola_id) faturasPorEscola[f.escola_id] = (faturasPorEscola[f.escola_id] || 0) + 1
    })

    return escolas.map((e) => ({
      id: e.id,
      nome: e.nome,
      slug: e.slug,
      plano: e.plano,
      criado_em: e.criado_em,
      alunos: alunosPorEscola[e.id] || 0,
      faturas: faturasPorEscola[e.id] || 0,
      mrrCentavos: precosPlanos[e.plano] || 0,
    }))
  } catch (e) {
    return []
  }
}

export async function atualizarPlanoEscola(escolaId: string, novoPlano: string) {
  try {
    const admin = createAdminClient()
    const { error } = await admin
      .from('escolas')
      .update({ plano: novoPlano, atualizado_em: new Date().toISOString() })
      .eq('id', escolaId)

    if (error) return { success: false, error: error.message }

    revalidatePath('/super-admin')
    revalidatePath('/super-admin/escolas')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao atualizar plano.' }
  }
}