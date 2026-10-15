'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export type Autorizacao = {
  id: string
  titulo: string
  descricao: string | null
  tipo: string
  data_evento: string | null
  prazo_resposta: string | null
  publico: string
  ativo: boolean
  criado_em: string
  total_respostas: number
  total_autorizados: number
}

export type NovaAutorizacao = {
  titulo: string
  descricao: string
  tipo: string
  data_evento: string
  prazo_resposta: string
  publico: string
}

async function getEscolaId(): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin.from('escolas').select('id').eq('slug', 'colegio-horizonte').single()
  return data?.id || null
}

export async function getAutorizacoes(): Promise<Autorizacao[]> {
  try {
    const admin = createAdminClient()
    const escolaId = await getEscolaId()
    if (!escolaId) return []

    const { data: auts, error } = await admin
      .from('autorizacoes')
      .select('id, titulo, descricao, tipo, data_evento, prazo_resposta, publico, ativo, criado_em')
      .eq('escola_id', escolaId)
      .order('criado_em', { ascending: false })

    if (error || !auts) return []

    const { data: respostas } = await admin
      .from('autorizacoes_respostas')
      .select('autorizacao_id, resposta')

    const totalPorAut: Record<string, { total: number; autorizados: number }> = {}
    ;(respostas || []).forEach((r) => {
      if (!totalPorAut[r.autorizacao_id]) totalPorAut[r.autorizacao_id] = { total: 0, autorizados: 0 }
      totalPorAut[r.autorizacao_id].total += 1
      if (r.resposta === 'autorizado') totalPorAut[r.autorizacao_id].autorizados += 1
    })

    return auts.map((a) => ({
      id: a.id,
      titulo: a.titulo,
      descricao: a.descricao,
      tipo: a.tipo,
      data_evento: a.data_evento,
      prazo_resposta: a.prazo_resposta,
      publico: a.publico,
      ativo: a.ativo,
      criado_em: a.criado_em,
      total_respostas: totalPorAut[a.id]?.total || 0,
      total_autorizados: totalPorAut[a.id]?.autorizados || 0,
    })) as Autorizacao[]
  } catch (e) {
    return []
  }
}

export async function criarAutorizacao(data: NovaAutorizacao) {
  try {
    const admin = createAdminClient()
    const escolaId = await getEscolaId()
    if (!escolaId) return { success: false, error: 'Escola não encontrada.' }

    const { error } = await admin.from('autorizacoes').insert({
      escola_id: escolaId,
      titulo: data.titulo,
      descricao: data.descricao || null,
      tipo: data.tipo,
      data_evento: data.data_evento || null,
      prazo_resposta: data.prazo_resposta || null,
      publico: data.publico,
    })

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/autorizacoes')
    revalidatePath('/responsavel')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao criar autorização.' }
  }
}

export async function excluirAutorizacao(id: string) {
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('autorizacoes').delete().eq('id', id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/autorizacoes')
    revalidatePath('/responsavel')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao excluir.' }
  }
}

export type RespostaDetalhe = {
  aluno_nome: string
  responsavel_email: string
  resposta: string
  observacao: string | null
  respondido_em: string
}

export async function getRespostas(autorizacaoId: string): Promise<RespostaDetalhe[]> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('autorizacoes_respostas')
      .select('aluno_nome, responsavel_email, resposta, observacao, respondido_em')
      .eq('autorizacao_id', autorizacaoId)
      .order('respondido_em', { ascending: false })

    if (error) return []
    return (data || []) as RespostaDetalhe[]
  } catch (e) {
    return []
  }
}