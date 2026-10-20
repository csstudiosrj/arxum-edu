'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getEscolaDoUsuario } from '@/lib/auth/escola-atual'
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

export async function getEventos(): Promise<Evento[]> {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return []

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('eventos')
      .select('id, titulo, descricao, tipo, data_evento, hora_evento, publico, serie, ativo')
      .eq('escola_id', escola.id)
      .order('data_evento', { ascending: true })

    if (error) return []
    return (data || []) as Evento[]
  } catch (e) {
    return []
  }
}

export async function criarEvento(data: NovoEvento) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const { error } = await admin.from('eventos').insert({
      escola_id: escola.id,
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

export async function atualizarEvento(id: string, data: Partial<NovoEvento>) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    
    const payload: Record<string, any> = { atualizado_em: new Date().toISOString() }
    if (data.titulo !== undefined) payload.titulo = data.titulo
    if (data.descricao !== undefined) payload.descricao = data.descricao || null
    if (data.tipo !== undefined) payload.tipo = data.tipo
    if (data.data_evento !== undefined) payload.data_evento = data.data_evento
    if (data.hora_evento !== undefined) payload.hora_evento = data.hora_evento || null
    if (data.publico !== undefined) payload.publico = data.publico
    if (data.serie !== undefined) payload.serie = data.serie || null

    const { error } = await admin
      .from('eventos')
      .update(payload)
      .eq('id', id)
      .eq('escola_id', escola.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/agenda')
    revalidatePath('/responsavel')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao atualizar evento.' }
  }
}

export async function excluirEvento(id: string) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const { error } = await admin.from('eventos').delete().eq('id', id).eq('escola_id', escola.id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/agenda')
    revalidatePath('/responsavel')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao excluir.' }
  }
}