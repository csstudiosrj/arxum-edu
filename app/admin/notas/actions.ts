'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export type Nota = {
  id: string
  aluno_id: string | null
  aluno_nome: string
  responsavel_email: string
  disciplina: string
  periodo: string
  nota: number | null
  faltas: number
  observacao: string | null
  criado_em: string
}

export type NovaNota = {
  aluno_id: string
  aluno_nome: string
  responsavel_email: string
  disciplina: string
  periodo: string
  nota: number | null
  faltas: number
  observacao: string
}

async function getEscolaId(): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin.from('escolas').select('id').eq('slug', 'colegio-horizonte').single()
  return data?.id || null
}

export async function getNotas(): Promise<Nota[]> {
  try {
    const admin = createAdminClient()
    const escolaId = await getEscolaId()
    if (!escolaId) return []

    const { data, error } = await admin
      .from('notas')
      .select('id, aluno_id, aluno_nome, responsavel_email, disciplina, periodo, nota, faltas, observacao, criado_em')
      .eq('escola_id', escolaId)
      .order('aluno_nome', { ascending: true })
      .order('disciplina', { ascending: true })

    if (error) return []
    return (data || []) as Nota[]
  } catch (e) {
    return []
  }
}

export async function getAlunosAtivos(): Promise<Array<{ id: string; nome: string; responsavel_email: string }>> {
  try {
    const admin = createAdminClient()
    const escolaId = await getEscolaId()
    if (!escolaId) return []

    const { data } = await admin
      .from('alunos')
      .select('id, nome, responsavel_email')
      .eq('escola_id', escolaId)
      .eq('status', 'ativo')
      .order('nome', { ascending: true })

    return (data || []) as Array<{ id: string; nome: string; responsavel_email: string }>
  } catch (e) {
    return []
  }
}

export async function lancarNota(data: NovaNota) {
  try {
    const admin = createAdminClient()
    const escolaId = await getEscolaId()
    if (!escolaId) return { success: false, error: 'Escola não encontrada.' }

    const { error } = await admin
      .from('notas')
      .upsert(
        {
          escola_id: escolaId,
          aluno_id: data.aluno_id,
          aluno_nome: data.aluno_nome,
          responsavel_email: data.responsavel_email,
          disciplina: data.disciplina,
          periodo: data.periodo,
          nota: data.nota,
          faltas: data.faltas,
          observacao: data.observacao || null,
          atualizado_em: new Date().toISOString(),
        },
        { onConflict: 'aluno_id,disciplina,periodo' }
      )

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/notas')
    revalidatePath('/responsavel')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao lançar nota.' }
  }
}

export async function excluirNota(id: string) {
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('notas').delete().eq('id', id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/notas')
    revalidatePath('/responsavel')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao excluir.' }
  }
}