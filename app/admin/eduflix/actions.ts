'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getEscolaDoUsuario } from '@/lib/auth/escola-atual'
import { revalidatePath } from 'next/cache'

export type Videoaula = {
  id: string
  titulo: string
  descricao: string | null
  disciplina: string
  serie: string | null
  duracao_minutos: number | null
  video_url: string
  publicado: boolean
  visualizacoes: number
  criado_em: string
}

export type NovaVideoaula = {
  titulo: string
  descricao: string
  disciplina: string
  serie: string
  duracao_minutos: number | null
  video_url: string
}

export async function getVideoaulas(): Promise<Videoaula[]> {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return []

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('videoaulas')
      .select('id, titulo, descricao, disciplina, serie, duracao_minutos, video_url, publicado, visualizacoes, criado_em')
      .eq('escola_id', escola.id)
      .order('criado_em', { ascending: false })

    if (error) return []
    return (data || []) as Videoaula[]
  } catch (e) {
    return []
  }
}

export async function criarVideoaula(data: NovaVideoaula) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const { error } = await admin.from('videoaulas').insert({
      escola_id: escola.id,
      titulo: data.titulo,
      descricao: data.descricao || null,
      disciplina: data.disciplina,
      serie: data.serie || null,
      duracao_minutos: data.duracao_minutos,
      video_url: data.video_url,
    })

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/eduflix')
    revalidatePath('/eduflix')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao criar videoaula.' }
  }
}

export async function excluirVideoaula(id: string) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const { error } = await admin.from('videoaulas').delete().eq('id', id).eq('escola_id', escola.id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/eduflix')
    revalidatePath('/eduflix')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao excluir.' }
  }
}

export async function alternarPublicacao(id: string, publicado: boolean) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const { error } = await admin
      .from('videoaulas')
      .update({ publicado, atualizado_em: new Date().toISOString() })
      .eq('id', id)
      .eq('escola_id', escola.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/eduflix')
    revalidatePath('/eduflix')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao atualizar.' }
  }
}