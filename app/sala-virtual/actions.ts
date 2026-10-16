'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getEscolaDaRequisicao } from '@/lib/auth/escola-atual'
import { revalidatePath } from 'next/cache'

export type Aula = {
  id: string
  titulo: string
  descricao: string | null
  tipo: string
  conteudo_url: string | null
  duracao_minutos: number | null
  ordem: number
  concluida: boolean
  anotacao: string | null
}

export type Modulo = {
  id: string
  titulo: string
  descricao: string | null
  disciplina: string
  serie: string | null
  aulas: Aula[]
}

async function getEmailUsuario(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email || null
}

async function getEscolaIdRequisicao(): Promise<string | null> {
  const escola = await getEscolaDaRequisicao()
  return escola?.id || null
}

export async function getModulosComProgresso(): Promise<Modulo[]> {
  try {
    const email = await getEmailUsuario()
    if (!email) return []

    const escolaId = await getEscolaIdRequisicao()
    if (!escolaId) return []

    const admin = createAdminClient()

    const { data: aluno } = await admin
      .from('alunos')
      .select('nome')
      .eq('responsavel_email', email)
      .eq('escola_id', escolaId)
      .limit(1)
      .maybeSingle()

    const alunoNome = aluno?.nome || email

    const { data: mods, error: erroMods } = await admin
      .from('modulos')
      .select('id, titulo, descricao, disciplina, serie, ordem')
      .eq('escola_id', escolaId)
      .eq('publicado', true)
      .order('ordem', { ascending: true })

    if (erroMods || !mods) return []

    const idsMods = mods.map((m) => m.id)

    let todasAulas: Array<{
      id: string
      modulo_id: string
      titulo: string
      descricao: string | null
      tipo: string
      conteudo_url: string | null
      duracao_minutos: number | null
      ordem: number
    }> = []

    if (idsMods.length > 0) {
      const { data } = await admin
        .from('aulas')
        .select('id, modulo_id, titulo, descricao, tipo, conteudo_url, duracao_minutos, ordem')
        .in('modulo_id', idsMods)
        .eq('publicado', true)
        .order('ordem', { ascending: true })
      todasAulas = (data || []) as typeof todasAulas
    }

    const { data: progressos } = await admin
      .from('aulas_progresso')
      .select('aula_id, concluida, anotacao')
      .eq('responsavel_email', email)
      .eq('aluno_nome', alunoNome)

    const progressoPorAula: Record<string, { concluida: boolean; anotacao: string | null }> = {}
    ;(progressos || []).forEach((p) => {
      progressoPorAula[p.aula_id] = { concluida: p.concluida, anotacao: p.anotacao }
    })

    return mods.map((m) => ({
      id: m.id,
      titulo: m.titulo,
      descricao: m.descricao,
      disciplina: m.disciplina,
      serie: m.serie,
      aulas: todasAulas
        .filter((a) => a.modulo_id === m.id)
        .map((a) => ({
          id: a.id,
          titulo: a.titulo,
          descricao: a.descricao,
          tipo: a.tipo,
          conteudo_url: a.conteudo_url,
          duracao_minutos: a.duracao_minutos,
          ordem: a.ordem,
          concluida: progressoPorAula[a.id]?.concluida || false,
          anotacao: progressoPorAula[a.id]?.anotacao || null,
        })),
    })) as Modulo[]
  } catch (e) {
    console.error('Erro:', e)
    return []
  }
}

export async function salvarAnotacao(aulaId: string, anotacao: string) {
  try {
    const email = await getEmailUsuario()
    if (!email) return { success: false, error: 'Não autenticado.' }

    const escolaId = await getEscolaIdRequisicao()
    if (!escolaId) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const { data: aluno } = await admin
      .from('alunos')
      .select('nome')
      .eq('responsavel_email', email)
      .eq('escola_id', escolaId)
      .limit(1)
      .maybeSingle()

    const alunoNome = aluno?.nome || email

    const { data: existente } = await admin
      .from('aulas_progresso')
      .select('id')
      .eq('aula_id', aulaId)
      .eq('responsavel_email', email)
      .eq('aluno_nome', alunoNome)
      .maybeSingle()

    if (existente) {
      const { error } = await admin
        .from('aulas_progresso')
        .update({ anotacao, atualizado_em: new Date().toISOString() })
        .eq('id', existente.id)
      if (error) return { success: false, error: error.message }
    } else {
      const { error } = await admin.from('aulas_progresso').insert({
        aula_id: aulaId,
        responsavel_email: email,
        aluno_nome: alunoNome,
        anotacao,
      })
      if (error) return { success: false, error: error.message }
    }

    revalidatePath('/sala-virtual')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao salvar.' }
  }
}

export async function marcarConcluida(aulaId: string, concluida: boolean) {
  try {
    const email = await getEmailUsuario()
    if (!email) return { success: false, error: 'Não autenticado.' }

    const escolaId = await getEscolaIdRequisicao()
    if (!escolaId) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const { data: aluno } = await admin
      .from('alunos')
      .select('nome')
      .eq('responsavel_email', email)
      .eq('escola_id', escolaId)
      .limit(1)
      .maybeSingle()

    const alunoNome = aluno?.nome || email

    const { data: existente } = await admin
      .from('aulas_progresso')
      .select('id')
      .eq('aula_id', aulaId)
      .eq('responsavel_email', email)
      .eq('aluno_nome', alunoNome)
      .maybeSingle()

    const payload = {
      concluida,
      concluida_em: concluida ? new Date().toISOString() : null,
      atualizado_em: new Date().toISOString(),
    }

    if (existente) {
      const { error } = await admin.from('aulas_progresso').update(payload).eq('id', existente.id)
      if (error) return { success: false, error: error.message }
    } else {
      const { error } = await admin.from('aulas_progresso').insert({
        aula_id: aulaId,
        responsavel_email: email,
        aluno_nome: alunoNome,
        ...payload,
      })
      if (error) return { success: false, error: error.message }
    }

    revalidatePath('/sala-virtual')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao atualizar.' }
  }
}