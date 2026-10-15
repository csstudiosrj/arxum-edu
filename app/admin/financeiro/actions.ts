'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export type Fatura = {
  id: string
  aluno_nome: string
  responsavel_email: string
  descricao: string
  valor_centavos: number
  vencimento: string
  status: string
  criado_em: string
}

export type NovaFatura = {
  aluno_nome: string
  responsavel_email: string
  descricao: string
  valor_centavos: number
  vencimento: string
}

async function getEscolaId(): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin.from('escolas').select('id').eq('slug', 'colegio-horizonte').single()
  return data?.id || null
}

export async function getFaturas(): Promise<Fatura[]> {
  try {
    const admin = createAdminClient()
    const escolaId = await getEscolaId()
    if (!escolaId) return []

    const { data, error } = await admin
      .from('faturas')
      .select('id, aluno_nome, responsavel_email, descricao, valor_centavos, vencimento, status, criado_em')
      .eq('escola_id', escolaId)
      .order('vencimento', { ascending: false })

    if (error) return []
    return (data || []) as Fatura[]
  } catch (e) {
    return []
  }
}

export async function criarFatura(data: NovaFatura) {
  try {
    const admin = createAdminClient()
    const escolaId = await getEscolaId()
    if (!escolaId) return { success: false, error: 'Escola não encontrada.' }

    const { data: aluno } = await admin
      .from('alunos')
      .select('id')
      .eq('nome', data.aluno_nome)
      .eq('responsavel_email', data.responsavel_email)
      .maybeSingle()

    const { error } = await admin.from('faturas').insert({
      escola_id: escolaId,
      aluno_id: aluno?.id || null,
      aluno_nome: data.aluno_nome,
      responsavel_email: data.responsavel_email,
      descricao: data.descricao,
      valor_centavos: data.valor_centavos,
      vencimento: data.vencimento,
    })

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/financeiro')
    revalidatePath('/responsavel')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao criar fatura.' }
  }
}

export async function atualizarStatusFatura(id: string, novoStatus: string) {
  try {
    const admin = createAdminClient()
    const { error } = await admin
      .from('faturas')
      .update({ status: novoStatus, atualizado_em: new Date().toISOString() })
      .eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/financeiro')
    revalidatePath('/responsavel')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao atualizar.' }
  }
}

export async function excluirFatura(id: string) {
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('faturas').delete().eq('id', id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/financeiro')
    revalidatePath('/responsavel')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao excluir.' }
  }
}

export async function getAlunosParaFatura(): Promise<Array<{ nome: string; responsavel_email: string }>> {
  try {
    const admin = createAdminClient()
    const escolaId = await getEscolaId()
    if (!escolaId) return []

    const { data } = await admin
      .from('alunos')
      .select('nome, responsavel_email')
      .eq('escola_id', escolaId)
      .eq('status', 'ativo')
      .order('nome', { ascending: true })

    return (data || []) as Array<{ nome: string; responsavel_email: string }>
  } catch (e) {
    return []
  }
}