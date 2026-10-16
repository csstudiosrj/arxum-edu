'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getEscolaDoUsuario } from '@/lib/auth/escola-atual'
import { revalidatePath } from 'next/cache'

export type AulaAdmin = {
  id: string
  titulo: string
  descricao: string | null
  tipo: string
  conteudo_url: string | null
  duracao_minutos: number | null
  ordem: number
  publicado: boolean
}

export type ModuloAdmin = {
  id: string
  titulo: string
  descricao: string | null
  disciplina: string
  serie: string | null
  ordem: number
  publicado: boolean
  aulas: AulaAdmin[]
}

export type NovoModulo = {
  titulo: string
  descricao: string
  disciplina: string
  serie: string
}

export type NovaAula = {
  titulo: string
  descricao: string
  tipo: string
  conteudo_url: string
  duracao_minutos: number | null
}

export async function getModulos(): Promise<ModuloAdmin[]> {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return []

    const admin = createAdminClient()
    const { data: mods, error } = await admin
      .from('modulos')
      .select('id, titulo, descricao, disciplina, serie, ordem, publicado')
      .eq('escola_id', escola.id)
      .order('ordem', { ascending: true })

    if (error || !mods) return []

    const idsMods = mods.map((m) => m.id)

    let aulas: Array<{
      id: string
      modulo_id: string
      titulo: string
      descricao: string | null
      tipo: string
      conteudo_url: string | null
      duracao_minutos: number | null
      ordem: number
      publicado: boolean
    }> = []

    if (idsMods.length > 0) {
      const { data } = await admin
        .from('aulas')
        .select('id, modulo_id, titulo, descricao, tipo, conteudo_url, duracao_minutos, ordem, publicado')
        .in('modulo_id', idsMods)
        .order('ordem', { ascending: true })
      aulas = (data || []) as typeof aulas
    }

    return mods.map((m) => ({
      id: m.id,
      titulo: m.titulo,
      descricao: m.descricao,
      disciplina: m.disciplina,
      serie: m.serie,
      ordem: m.ordem,
      publicado: m.publicado,
      aulas: aulas
        .filter((a) => a.modulo_id === m.id)
        .map((a) => ({
          id: a.id,
          titulo: a.titulo,
          descricao: a.descricao,
          tipo: a.tipo,
          conteudo_url: a.conteudo_url,
          duracao_minutos: a.duracao_minutos,
          ordem: a.ordem,
          publicado: a.publicado,
        })),
    })) as ModuloAdmin[]
  } catch (e) {
    return []
  }
}

export async function criarModulo(data: NovoModulo) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const { data: ultimo } = await admin
      .from('modulos')
      .select('ordem')
      .eq('escola_id', escola.id)
      .order('ordem', { ascending: false })
      .limit(1)
      .maybeSingle()

    const proximaOrdem = (ultimo?.ordem || 0) + 1

    const { error } = await admin.from('modulos').insert({
      escola_id: escola.id,
      titulo: data.titulo,
      descricao: data.descricao || null,
      disciplina: data.disciplina,
      serie: data.serie || null,
      ordem: proximaOrdem,
    })

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/sala-virtual')
    revalidatePath('/sala-virtual')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao criar módulo.' }
  }
}

export async function excluirModulo(id: string) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const { error } = await admin.from('modulos').delete().eq('id', id).eq('escola_id', escola.id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/sala-virtual')
    revalidatePath('/sala-virtual')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao excluir.' }
  }
}

export async function criarAula(moduloId: string, data: NovaAula) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()

    // Confirma que o módulo pertence à escola
    const { data: mod } = await admin
      .from('modulos')
      .select('id')
      .eq('id', moduloId)
      .eq('escola_id', escola.id)
      .maybeSingle()

    if (!mod) return { success: false, error: 'Módulo não encontrado.' }

    const { data: ultima } = await admin
      .from('aulas')
      .select('ordem')
      .eq('modulo_id', moduloId)
      .order('ordem', { ascending: false })
      .limit(1)
      .maybeSingle()

    const proximaOrdem = (ultima?.ordem || 0) + 1

    const { error } = await admin.from('aulas').insert({
      modulo_id: moduloId,
      titulo: data.titulo,
      descricao: data.descricao || null,
      tipo: data.tipo,
      conteudo_url: data.conteudo_url || null,
      duracao_minutos: data.duracao_minutos,
      ordem: proximaOrdem,
    })

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/sala-virtual')
    revalidatePath('/sala-virtual')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao criar aula.' }
  }
}

export async function excluirAula(id: string) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()

    // Confirma que a aula pertence a um módulo da escola
    const { data: aula } = await admin
      .from('aulas')
      .select('id, modulo_id')
      .eq('id', id)
      .maybeSingle()

    if (!aula) return { success: false, error: 'Aula não encontrada.' }

    const { data: mod } = await admin
      .from('modulos')
      .select('id')
      .eq('id', aula.modulo_id)
      .eq('escola_id', escola.id)
      .maybeSingle()

    if (!mod) return { success: false, error: 'Acesso negado.' }

    const { error } = await admin.from('aulas').delete().eq('id', id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/sala-virtual')
    revalidatePath('/sala-virtual')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao excluir.' }
  }
}