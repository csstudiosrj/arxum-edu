'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

// ── MÉTRICAS ────────────────────────────────────────────────────────

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
      .select('id, nome, slug, plano, status_assinatura, criado_em')

    if (error || !escolas) return vazio

    const { data: planos } = await admin.from('planos').select('slug, preco_centavos')
    const precosPlanos: Record<string, number> = {}
    ;(planos || []).forEach((p) => { precosPlanos[p.slug] = p.preco_centavos })

    const { data: alunos } = await admin.from('alunos').select('escola_id')
    const alunosPorEscola: Record<string, number> = {}
    ;(alunos || []).forEach((a) => {
      if (a.escola_id) alunosPorEscola[a.escola_id] = (alunosPorEscola[a.escola_id] || 0) + 1
    })

    const agora = new Date()
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)

    const ativas = escolas.filter((e) => e.status_assinatura === 'ativa').length
    const trial = escolas.filter((e) => e.status_assinatura === 'trial').length
    const suspensas = escolas.filter((e) => e.status_assinatura === 'suspensa' || e.status_assinatura === 'cancelada').length

    const distMap: Record<string, { total: number; mrrCentavos: number }> = {}
    escolas.forEach((e) => {
      if (!distMap[e.plano]) distMap[e.plano] = { total: 0, mrrCentavos: 0 }
      distMap[e.plano].total += 1
      if (e.status_assinatura === 'ativa') {
        distMap[e.plano].mrrCentavos += precosPlanos[e.plano] || 0
      }
    })

    const distribuicaoPlanos = Object.entries(distMap)
      .map(([plano, v]) => ({ plano, total: v.total, mrrCentavos: v.mrrCentavos }))
      .sort((a, b) => b.total - a.total)

    const mrrCentavos = Object.values(distMap).reduce((s, v) => s + v.mrrCentavos, 0)

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

    const { data: tickets } = await admin
      .from('tickets_suporte')
      .select('id, escola_nome, assunto, prioridade, status, criado_em')
      .order('criado_em', { ascending: false })

    const ticketsAbertos = (tickets || []).filter((t) => t.status === 'aberto' || t.status === 'em_andamento').length
    const ticketsUrgentes = (tickets || []).filter((t) => t.prioridade === 'urgente' || t.prioridade === 'alta').length

    return {
      escolasAtivas: ativas,
      escolasTrial: trial,
      escolasSuspensas: suspensas,
      escolasTotal: escolas.length,
      mrrCentavos,
      alunosTotal: (alunos || []).length,
      distribuicaoPlanos,
      escolasRecentes,
      ticketsAbertos,
      ticketsUrgentes,
      ticketsRecentes: (tickets || []).slice(0, 5),
      novosEsteMes,
    }
  } catch (e) {
    console.error('Erro ao gerar métricas:', e)
    return vazio
  }
}

// ── ESCOLAS ─────────────────────────────────────────────────────────

export type EscolaSuper = {
  id: string
  nome: string
  slug: string
  plano: string
  status_assinatura: string
  data_vencimento: string | null
  observacoes_admin: string | null
  contato_responsavel: string | null
  whatsapp: string | null
  email_contato: string | null
  cidade: string | null
  estado: string | null
  criado_em: string
  alunos: number
  usuarios: number
  mrrCentavos: number
}

export async function getTodasEscolas(): Promise<EscolaSuper[]> {
  try {
    const admin = createAdminClient()

    const { data: escolas, error } = await admin
      .from('escolas')
      .select('id, nome, slug, plano, status_assinatura, data_vencimento, observacoes_admin, contato_responsavel, whatsapp, email_contato, cidade, estado, criado_em')
      .order('nome', { ascending: true })

    if (error || !escolas) return []

    const { data: planos } = await admin.from('planos').select('slug, preco_centavos')
    const precos: Record<string, number> = {}
    ;(planos || []).forEach((p) => { precos[p.slug] = p.preco_centavos })

    const { data: alunos } = await admin.from('alunos').select('escola_id')
    const { data: perfis } = await admin.from('perfis').select('escola_id')

    const alunosPorEscola: Record<string, number> = {}
    ;(alunos || []).forEach((a) => { if (a.escola_id) alunosPorEscola[a.escola_id] = (alunosPorEscola[a.escola_id] || 0) + 1 })

    const usuariosPorEscola: Record<string, number> = {}
    ;(perfis || []).forEach((p) => { if (p.escola_id) usuariosPorEscola[p.escola_id] = (usuariosPorEscola[p.escola_id] || 0) + 1 })

    return escolas.map((e) => ({
      ...e,
      alunos: alunosPorEscola[e.id] || 0,
      usuarios: usuariosPorEscola[e.id] || 0,
      mrrCentavos: e.status_assinatura === 'ativa' ? (precos[e.plano] || 0) : 0,
    })) as EscolaSuper[]
  } catch (e) {
    return []
  }
}

export async function atualizarEscola(id: string, data: {
  plano?: string
  status_assinatura?: string
  data_vencimento?: string | null
  observacoes_admin?: string | null
  contato_responsavel?: string | null
  whatsapp?: string | null
}) {
  try {
    const admin = createAdminClient()
    const payload: Record<string, any> = { atualizado_em: new Date().toISOString() }

    if (data.plano !== undefined) payload.plano = data.plano
    if (data.status_assinatura !== undefined) payload.status_assinatura = data.status_assinatura
    if (data.data_vencimento !== undefined) payload.data_vencimento = data.data_vencimento
    if (data.observacoes_admin !== undefined) payload.observacoes_admin = data.observacoes_admin
    if (data.contato_responsavel !== undefined) payload.contato_responsavel = data.contato_responsavel
    if (data.whatsapp !== undefined) payload.whatsapp = data.whatsapp

    const { error } = await admin.from('escolas').update(payload).eq('id', id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/super-admin')
    revalidatePath('/super-admin/escolas')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao atualizar escola.' }
  }
}

export async function excluirEscola(id: string) {
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('escolas').delete().eq('id', id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/super-admin')
    revalidatePath('/super-admin/escolas')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao excluir escola.' }
  }
}

// ── PLANOS ──────────────────────────────────────────────────────────

export type Plano = {
  id: string
  slug: string
  nome: string
  descricao: string | null
  preco_centavos: number
  max_alunos: number | null
  max_unidades: number | null
  recursos: string[]
  destaque: boolean
  ativo: boolean
  ordem: number
  total_escolas?: number
}

export async function getPlanos(): Promise<Plano[]> {
  try {
    const admin = createAdminClient()

    const { data, error } = await admin
      .from('planos')
      .select('*')
      .order('ordem', { ascending: true })

    if (error || !data) return []

    const { data: escolas } = await admin.from('escolas').select('plano')
    const contagem: Record<string, number> = {}
    ;(escolas || []).forEach((e) => { contagem[e.plano] = (contagem[e.plano] || 0) + 1 })

    return data.map((p) => ({
      ...p,
      recursos: Array.isArray(p.recursos) ? p.recursos : [],
      total_escolas: contagem[p.slug] || 0,
    })) as Plano[]
  } catch (e) {
    return []
  }
}

export async function criarPlano(data: {
  slug: string
  nome: string
  descricao: string
  preco_centavos: number
  max_alunos: number | null
  max_unidades: number | null
  recursos: string[]
  destaque: boolean
}) {
  try {
    const admin = createAdminClient()

    if (!data.slug.trim()) return { success: false, error: 'Informe o slug.' }
    if (!data.nome.trim()) return { success: false, error: 'Informe o nome.' }

    const { data: existente } = await admin.from('planos').select('id').eq('slug', data.slug).maybeSingle()
    if (existente) return { success: false, error: 'Já existe um plano com esse slug.' }

    const { data: maxOrdem } = await admin.from('planos').select('ordem').order('ordem', { ascending: false }).limit(1).maybeSingle()
    const proximaOrdem = (maxOrdem?.ordem || 0) + 1

    const { error } = await admin.from('planos').insert({
      slug: data.slug,
      nome: data.nome,
      descricao: data.descricao || null,
      preco_centavos: data.preco_centavos,
      max_alunos: data.max_alunos,
      max_unidades: data.max_unidades,
      recursos: data.recursos,
      destaque: data.destaque,
      ordem: proximaOrdem,
    })

    if (error) return { success: false, error: error.message }

    revalidatePath('/super-admin/planos')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao criar plano.' }
  }
}

export async function atualizarPlano(id: string, data: {
  nome: string
  descricao: string
  preco_centavos: number
  max_alunos: number | null
  max_unidades: number | null
  recursos: string[]
  destaque: boolean
  ativo: boolean
}) {
  try {
    const admin = createAdminClient()
    const { error } = await admin
      .from('planos')
      .update({
        nome: data.nome,
        descricao: data.descricao || null,
        preco_centavos: data.preco_centavos,
        max_alunos: data.max_alunos,
        max_unidades: data.max_unidades,
        recursos: data.recursos,
        destaque: data.destaque,
        ativo: data.ativo,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/super-admin/planos')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao atualizar plano.' }
  }
}

export async function excluirPlano(id: string) {
  try {
    const admin = createAdminClient()

    const { data: plano } = await admin.from('planos').select('slug').eq('id', id).maybeSingle()
    if (!plano) return { success: false, error: 'Plano não encontrado.' }

    const { count } = await admin.from('escolas').select('*', { count: 'exact', head: true }).eq('plano', plano.slug)
    if (count && count > 0) {
      return { success: false, error: `Existem ${count} escolas usando esse plano. Mude o plano delas antes de excluir.` }
    }

    const { error } = await admin.from('planos').delete().eq('id', id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/super-admin/planos')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao excluir plano.' }
  }
}

// ── FATURAMENTO ─────────────────────────────────────────────────────

export type Faturamento = {
  id: string
  escola_id: string | null
  escola_nome: string
  descricao: string
  valor_centavos: number
  vencimento: string
  status: string
  plano: string | null
  periodo_referencia: string | null
  pago_em: string | null
  observacoes: string | null
  criado_em: string
}

export async function getFaturamento(): Promise<Faturamento[]> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('faturamento_escolas')
      .select('*')
      .order('vencimento', { ascending: false })

    if (error) return []
    return (data || []) as Faturamento[]
  } catch (e) {
    return []
  }
}

export async function getEscolasParaFatura(): Promise<Array<{ id: string; nome: string; plano: string }>> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('escolas')
      .select('id, nome, plano')
      .eq('status_assinatura', 'ativa')
      .order('nome', { ascending: true })

    if (error) return []
    return (data || []) as Array<{ id: string; nome: string; plano: string }>
  } catch (e) {
    return []
  }
}

export async function criarFaturamento(data: {
  escola_id: string
  descricao: string
  valor_centavos: number
  vencimento: string
  periodo_referencia: string
  observacoes: string
}) {
  try {
    const admin = createAdminClient()

    const { data: escola } = await admin
      .from('escolas')
      .select('nome, plano')
      .eq('id', data.escola_id)
      .maybeSingle()

    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const { error } = await admin.from('faturamento_escolas').insert({
      escola_id: data.escola_id,
      escola_nome: escola.nome,
      descricao: data.descricao,
      valor_centavos: data.valor_centavos,
      vencimento: data.vencimento,
      plano: escola.plano,
      periodo_referencia: data.periodo_referencia || null,
      observacoes: data.observacoes || null,
    })

    if (error) return { success: false, error: error.message }

    revalidatePath('/super-admin/faturamento')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao criar faturamento.' }
  }
}

export async function atualizarStatusFaturamento(id: string, novoStatus: string) {
  try {
    const admin = createAdminClient()
    const payload: Record<string, any> = {
      status: novoStatus,
      atualizado_em: new Date().toISOString(),
    }
    if (novoStatus === 'pago') {
      payload.pago_em = new Date().toISOString()
    }
    const { error } = await admin.from('faturamento_escolas').update(payload).eq('id', id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/super-admin/faturamento')
    revalidatePath('/super-admin')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao atualizar.' }
  }
}

export async function excluirFaturamento(id: string) {
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('faturamento_escolas').delete().eq('id', id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/super-admin/faturamento')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao excluir.' }
  }
}

// ── SUPORTE ─────────────────────────────────────────────────────────

export type Ticket = {
  id: string
  escola_id: string | null
  escola_nome: string
  assunto: string
  descricao: string | null
  prioridade: string
  status: string
  categoria: string
  aberto_por: string | null
  atribuido_a: string | null
  resposta: string | null
  resolvido_em: string | null
  criado_em: string
  atualizado_em: string
}

export async function getTickets(): Promise<Ticket[]> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('tickets_suporte')
      .select('*')
      .order('criado_em', { ascending: false })

    if (error) return []
    return (data || []) as Ticket[]
  } catch (e) {
    return []
  }
}

export async function criarTicket(data: {
  escola_id: string
  assunto: string
  descricao: string
  prioridade: string
  categoria: string
}) {
  try {
    const admin = createAdminClient()

    const { data: escola } = await admin
      .from('escolas')
      .select('nome')
      .eq('id', data.escola_id)
      .maybeSingle()

    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const { error } = await admin.from('tickets_suporte').insert({
      escola_id: data.escola_id,
      escola_nome: escola.nome,
      assunto: data.assunto,
      descricao: data.descricao || null,
      prioridade: data.prioridade,
      categoria: data.categoria,
      aberto_por: 'ARXUM',
    })

    if (error) return { success: false, error: error.message }

    revalidatePath('/super-admin/suporte')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao criar ticket.' }
  }
}

export async function atualizarTicket(id: string, data: {
  status?: string
  prioridade?: string
  resposta?: string
  atribuido_a?: string | null
}) {
  try {
    const admin = createAdminClient()
    const payload: Record<string, any> = { atualizado_em: new Date().toISOString() }

    if (data.status !== undefined) {
      payload.status = data.status
      if (data.status === 'resolvido' || data.status === 'fechado') {
        payload.resolvido_em = new Date().toISOString()
      }
    }
    if (data.prioridade !== undefined) payload.prioridade = data.prioridade
    if (data.resposta !== undefined) payload.resposta = data.resposta
    if (data.atribuido_a !== undefined) payload.atribuido_a = data.atribuido_a

    const { error } = await admin.from('tickets_suporte').update(payload).eq('id', id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/super-admin/suporte')
    revalidatePath('/super-admin')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao atualizar ticket.' }
  }
}

export async function excluirTicket(id: string) {
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('tickets_suporte').delete().eq('id', id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/super-admin/suporte')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao excluir.' }
  }
}