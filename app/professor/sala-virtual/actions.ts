'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getProfessorDoUsuario } from '@/lib/auth/professor-atual'
import { revalidatePath } from 'next/cache'

export type AulaProfessor = {
  id: string
  titulo: string
  descricao: string | null
  tipo: string
  conteudo_url: string | null
  duracao_minutos: number | null
  ordem: number
  publicado: boolean
}

export type ModuloProfessor = {
  id: string
  titulo: string
  descricao: string | null
  disciplina: string
  serie: string | null
  ordem: number
  publicado: boolean
  professor_id: string | null
  proprio: boolean
  aulas: AulaProfessor[]
}

export type NovoModuloProfessor = {
  titulo: string
  descricao: string
  disciplina: string
  serie: string
}

export type NovaAulaProfessor = {
  titulo: string
  descricao: string
  tipo: string
  conteudo_url: string
  duracao_minutos: number | null
}

async function getUserId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id || null
}

export async function getModulosDoProfessor(): Promise<ModuloProfessor[]> {
  try {
    const prof = await getProfessorDoUsuario()
    if (!prof) return []

    const userId = await getUserId()
    if (!userId) return []

    const admin = createAdminClient()
    const { data: mods, error } = await admin
      .from('modulos')
      .select('id, titulo, descricao, disciplina, serie, ordem, publicado, professor_id')
      .eq('escola_id', prof.escola_id)
      .or(`professor_id.is.null,professor_id.eq.${userId}`)
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
      professor_id: m.professor_id,
      proprio: m.professor_id === userId,
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
    })) as ModuloProfessor[]
  } catch (e) {
    console.error('Erro ao buscar módulos do professor:', e)
    return []
  }
}

export async function criarModuloProfessor(data: NovoModuloProfessor) {
  try {
    const prof = await getProfessorDoUsuario()
    if (!prof) return { success: false, error: 'Sessão expirada.' }

    const userId = await getUserId()
    if (!userId) return { success: false, error: 'Sessão expirada.' }

    if (!data.titulo.trim()) return { success: false, error: 'Informe o título do módulo.' }

    const disciplinas = prof.disciplinas || []
    if (disciplinas.length > 0 && !disciplinas.includes(data.disciplina)) {
      return { success: false, error: 'Você só pode criar módulos das suas disciplinas.' }
    }

    const admin = createAdminClient()
    const { data: ultimo } = await admin
      .from('modulos')
      .select('ordem')
      .eq('escola_id', prof.escola_id)
      .order('ordem', { ascending: false })
      .limit(1)
      .maybeSingle()

    const proximaOrdem = (ultimo?.ordem || 0) + 1

    const { error } = await admin.from('modulos').insert({
      escola_id: prof.escola_id,
      professor_id: userId,
      titulo: data.titulo,
      descricao: data.descricao || null,
      disciplina: data.disciplina,
      serie: data.serie || null,
      ordem: proximaOrdem,
    })

    if (error) return { success: false, error: error.message }

    revalidatePath('/professor/sala-virtual')
    revalidatePath('/admin/sala-virtual')
    revalidatePath('/sala-virtual')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao criar módulo.' }
  }
}

export async function excluirModuloProfessor(id: string) {
  try {
    const prof = await getProfessorDoUsuario()
    if (!prof) return { success: false, error: 'Sessão expirada.' }

    const userId = await getUserId()
    if (!userId) return { success: false, error: 'Sessão expirada.' }

    const admin = createAdminClient()

    // Só pode excluir módulo próprio
    const { data: mod } = await admin
      .from('modulos')
      .select('id, professor_id')
      .eq('id', id)
      .eq('escola_id', prof.escola_id)
      .maybeSingle()

    if (!mod) return { success: false, error: 'Módulo não encontrado.' }
    if (mod.professor_id !== userId) {
      return { success: false, error: 'Você só pode excluir módulos criados por você.' }
    }

    const { error } = await admin.from('modulos').delete().eq('id', id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/professor/sala-virtual')
    revalidatePath('/admin/sala-virtual')
    revalidatePath('/sala-virtual')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao excluir módulo.' }
  }
}

export async function criarAulaProfessor(moduloId: string, data: NovaAulaProfessor) {
  try {
    const prof = await getProfessorDoUsuario()
    if (!prof) return { success: false, error: 'Sessão expirada.' }

    const userId = await getUserId()
    if (!userId) return { success: false, error: 'Sessão expirada.' }

    if (!data.titulo.trim()) return { success: false, error: 'Informe o título da aula.' }

    const admin = createAdminClient()

    // Confirma que o módulo é da escola e visível a ele
    const { data: mod } = await admin
      .from('modulos')
      .select('id, professor_id')
      .eq('id', moduloId)
      .eq('escola_id', prof.escola_id)
      .maybeSingle()

    if (!mod) return { success: false, error: 'Módulo não encontrado.' }
    if (mod.professor_id && mod.professor_id !== userId) {
      return { success: false, error: 'Você não tem acesso a este módulo.' }
    }

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

    revalidatePath('/professor/sala-virtual')
    revalidatePath('/admin/sala-virtual')
    revalidatePath('/sala-virtual')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao criar aula.' }
  }
}

export async function excluirAulaProfessor(id: string) {
  try {
    const prof = await getProfessorDoUsuario()
    if (!prof) return { success: false, error: 'Sessão expirada.' }

    const userId = await getUserId()
    if (!userId) return { success: false, error: 'Sessão expirada.' }

    const admin = createAdminClient()

    // Confirma que a aula está em um módulo visível ao professor
    const { data: aula } = await admin
      .from('aulas')
      .select('id, modulo_id')
      .eq('id', id)
      .maybeSingle()

    if (!aula) return { success: false, error: 'Aula não encontrada.' }

    const { data: mod } = await admin
      .from('modulos')
      .select('id, professor_id')
      .eq('id', aula.modulo_id)
      .eq('escola_id', prof.escola_id)
      .maybeSingle()

    if (!mod) return { success: false, error: 'Acesso negado.' }
    if (mod.professor_id && mod.professor_id !== userId) {
      return { success: false, error: 'Você não tem acesso a este módulo.' }
    }

    const { error } = await admin.from('aulas').delete().eq('id', id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/professor/sala-virtual')
    revalidatePath('/admin/sala-virtual')
    revalidatePath('/sala-virtual')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao excluir aula.' }
  }
}