'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getEscolaDoUsuario } from '@/lib/auth/escola-atual'
import { revalidatePath } from 'next/cache'

export type VideoAdmin = {
  id: string
  titulo: string
  descricao: string | null
  disciplina: string | null
  serie: string | null
  tipo: 'video' | 'live'
  video_url: string | null
  capa_url: string | null
  link_live: string | null
  data_live: string | null
  duracao_minutos: number | null
  visualizacoes: number
  publicado: boolean
  criado_em: string
}

export async function getVideosAdmin(): Promise<VideoAdmin[]> {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return []

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('videoaulas')
      .select('*')
      .eq('escola_id', escola.id)
      .order('criado_em', { ascending: false })

    if (error) return []
    return (data || []) as VideoAdmin[]
  } catch (e) {
    return []
  }
}

export async function criarVideoAdmin(data: {
  titulo: string
  descricao: string
  disciplina: string
  serie: string
  tipo: 'video' | 'live'
  video_url: string
  capa_url: string
  link_live: string
  data_live: string
  duracao_minutos: number | null
}) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    if (!data.titulo.trim()) return { success: false, error: 'Informe o título.' }

    const admin = createAdminClient()
    
    if (data.tipo === 'video' && !data.video_url) return { success: false, error: 'Envie o arquivo de vídeo.' }
    if (data.tipo === 'live' && !data.link_live) return { success: false, error: 'Informe o link da transmissão.' }

    const { error } = await admin.from('videoaulas').insert({
      escola_id: escola.id,
      titulo: data.titulo,
      descricao: data.descricao || null,
      disciplina: data.disciplina || null,
      serie: data.serie || null,
      tipo: data.tipo,
      video_url: data.video_url || null,
      capa_url: data.capa_url || null,
      link_live: data.link_live || null,
      data_live: data.data_live || null,
      duracao_minutos: data.duracao_minutos,
      publicado: false
    })

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/eduflix')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao criar vídeo.' }
  }
}

export async function alternarPublicacaoVideo(id: string, publicado: boolean) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Sessão expirada.' }

    const admin = createAdminClient()
    const { error } = await admin
      .from('videoaulas')
      .update({ publicado })
      .eq('id', id)
      .eq('escola_id', escola.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/eduflix')
    revalidatePath('/aluno/eduflix')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao atualizar status.' }
  }
}

export async function excluirVideo(id: string) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Sessão expirada.' }

    const admin = createAdminClient()
    const { error } = await admin
      .from('videoaulas')
      .delete()
      .eq('id', id)
      .eq('escola_id', escola.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/eduflix')
    revalidatePath('/aluno/eduflix')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao excluir vídeo.' }
  }
}

