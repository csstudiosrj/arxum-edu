'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export type Evento = {
  id: string
  titulo: string
  descricao: string | null
  tipo: string
  data_evento: string
  hora_evento: string | null
  publico: string
  serie: string | null
  ativo: boolean
}

export type NovoEvento = {
  titulo: string
  descricao: string
  tipo: string
  data_evento: string
  hora_evento: string
  publico: string
  serie: string
}

async function getEscolaId(): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin.from('escolas').select('id').eq('slug', 'colegio-horizonte').single()
  return data?.id || null
}

export async function getEventos(): Promise<Evento[]> {
  try {
    const admin = createAdminClient()
    const escolaId = await getEscolaId()
    if (!escolaId) return []

    const { data, error } = await admin
      .from('eventos')
      .select('id, titulo, descricao, tipo, data_evento, hora_evento, publico, serie, ativo')
      .eq('escola_id', escolaId)
      .order('data_evento', { ascending: true })

    if (error) return []
    return (data || []) as Evento[]
  } catch (e) {
    return []
  }
}

export async function criarEvento(data: NovoEvento) {
  try {
    const admin = createAdminClient()
    const escolaId = await getEscolaId()
    if (!escolaId) return { success: false, error: 'Escola não encontrada.' }

    const { error } = await admin.from('eventos').insert({
      escola_id: escolaId,
      titulo: data.titulo,
      descricao: data.descricao || null,
      tipo: data.tipo,
      data_evento: data.data_evento,
      hora_evento: data.hora_evento || null,
      publico: data.publico,
      serie: data.serie || null,
    })

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/agenda')
    revalidatePath('/responsavel')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao criar evento.' }
  }
}

export async function excluirEvento(id: string) {
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('eventos').delete().eq('id', id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/agenda')
    revalidatePath('/responsavel')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao excluir.' }
  }
}