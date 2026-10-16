'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getAlunoDoUsuario } from '@/lib/auth/aluno-atual'
import { revalidatePath } from 'next/cache'

export type NotaAluno = {
  disciplina: string
  periodo: string
  nota: number | null
  faltas: number
  observacao: string | null
}

export type EventoAluno = {
  id: string
  titulo: string
  descricao: string | null
  tipo: string
  data_evento: string
  hora_evento: string | null
}

export type ComunicadoAluno = {
  id: string
  titulo: string
  mensagem: string
  setor: string
  prioridade: string
  autor_nome: string
  criado_em: string
  lido: boolean
}

export type AulaPendente = {
  id: string
  titulo: string
  descricao: string | null
  tipo: string
  conteudo_url: string | null
  duracao_minutos: number | null
  modulo_titulo: string
  disciplina: string
  concluida: boolean
  anotacao: string | null
}

export type AulaDetalhe = AulaPendente & {
  modulo_id: string
  aulas_do_modulo: Array<{ id: string; titulo: string; concluida: boolean; ordem: number }>
}

export type VideoaulaAluno = {
  id: string
  titulo: string
  descricao: string | null
  disciplina: string
  serie: string | null
  duracao_minutos: number | null
  video_url: string
  visualizacoes: number
}

async function getAlunoContexto() {
  const aluno = await getAlunoDoUsuario()
  if (!aluno) return null
  return {
    alunoId: aluno.id,
    escolaId: aluno.escola_id,
    alunoNome: aluno.nome,
    alunoEmail: aluno.email_aluno || aluno.responsavel_email,
  }
}

export async function getMinhasNotas(): Promise<NotaAluno[]> {
  try {
    const ctx = await getAlunoContexto()
    if (!ctx) return []

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('notas')
      .select('disciplina, periodo, nota, faltas, observacao')
      .eq('aluno_id', ctx.alunoId)
      .order('disciplina', { ascending: true })

    if (error) return []
    return (data || []) as NotaAluno[]
  } catch (e) {
    return []
  }
}

export async function getMeusEventosAluno(): Promise<EventoAluno[]> {
  try {
    const ctx = await getAlunoContexto()
    if (!ctx) return []

    const admin = createAdminClient()
    const hoje = new Date().toISOString().split('T')[0]

    const { data, error } = await admin
      .from('eventos')
      .select('id, titulo, descricao, tipo, data_evento, hora_evento')
      .eq('escola_id', ctx.escolaId)
      .eq('ativo', true)
      .gte('data_evento', hoje)
      .order('data_evento', { ascending: true })
      .limit(15)

    if (error) return []
    return (data || []) as EventoAluno[]
  } catch (e) {
    return []
  }
}

export async function getMeusComunicadosAluno(): Promise<ComunicadoAluno[]> {
  try {
    const ctx = await getAlunoContexto()
    if (!ctx) return []

    const admin = createAdminClient()
    const { data: coms, error } = await admin
      .from('comunicados')
      .select('id, titulo, mensagem, setor, prioridade, autor_nome, criado_em')
      .eq('escola_id', ctx.escolaId)
      .eq('ativo', true)
      .order('criado_em', { ascending: false })
      .limit(20)

    if (error || !coms) return []

    const { data: leituras } = await admin
      .from('comunicados_leituras')
      .select('comunicado_id')
      .eq('responsavel_email', ctx.alunoEmail)

    const lidosSet = new Set((leituras || []).map((l) => l.comunicado_id))

    return coms.map((c) => ({
      id: c.id,
      titulo: c.titulo,
      mensagem: c.mensagem,
      setor: c.setor,
      prioridade: c.prioridade,
      autor_nome: c.autor_nome,
      criado_em: c.criado_em,
      lido: lidosSet.has(c.id),
    })) as ComunicadoAluno[]
  } catch (e) {
    return []
  }
}

export async function getMinhasAulas(): Promise<AulaPendente[]> {
  try {
    const ctx = await getAlunoContexto()
    if (!ctx) return []

    const admin = createAdminClient()

    const { data: mods } = await admin
      .from('modulos')
      .select('id, titulo, disciplina')
      .eq('escola_id', ctx.escolaId)
      .eq('publicado', true)

    if (!mods || mods.length === 0) return []

    const idsMods = mods.map((m) => m.id)

    const { data: aulas } = await admin
      .from('aulas')
      .select('id, modulo_id, titulo, descricao, tipo, conteudo_url, duracao_minutos')
      .in('modulo_id', idsMods)
      .eq('publicado', true)
      .order('ordem', { ascending: true })

    if (!aulas) return []

    const { data: progressos } = await admin
      .from('aulas_progresso')
      .select('aula_id, concluida, anotacao')
      .eq('responsavel_email', ctx.alunoEmail)
      .eq('aluno_nome', ctx.alunoNome)

    const progressoMap: Record<string, { concluida: boolean; anotacao: string | null }> = {}
    ;(progressos || []).forEach((p) => {
      progressoMap[p.aula_id] = { concluida: p.concluida, anotacao: p.anotacao }
    })

    return aulas.map((a) => {
      const mod = mods.find((m) => m.id === a.modulo_id)
      return {
        id: a.id,
        titulo: a.titulo,
        descricao: a.descricao,
        tipo: a.tipo,
        conteudo_url: a.conteudo_url,
        duracao_minutos: a.duracao_minutos,
        modulo_titulo: mod?.titulo || '',
        disciplina: mod?.disciplina || '',
        concluida: progressoMap[a.id]?.concluida || false,
        anotacao: progressoMap[a.id]?.anotacao || null,
      }
    }) as AulaPendente[]
  } catch (e) {
    return []
  }
}

export async function getAulaDetalhe(aulaId: string): Promise<AulaDetalhe | null> {
  try {
    const ctx = await getAlunoContexto()
    if (!ctx) return null

    const admin = createAdminClient()

    const { data: aula } = await admin
      .from('aulas')
      .select('id, modulo_id, titulo, descricao, tipo, conteudo_url, duracao_minutos')
      .eq('id', aulaId)
      .eq('publicado', true)
      .maybeSingle()

    if (!aula) return null

    const { data: mod } = await admin
      .from('modulos')
      .select('id, titulo, disciplina, escola_id, publicado')
      .eq('id', aula.modulo_id)
      .eq('escola_id', ctx.escolaId)
      .eq('publicado', true)
      .maybeSingle()

    if (!mod) return null

    const { data: todasAulas } = await admin
      .from('aulas')
      .select('id, titulo, ordem, publicado')
      .eq('modulo_id', mod.id)
      .eq('publicado', true)
      .order('ordem', { ascending: true })

    const { data: progressos } = await admin
      .from('aulas_progresso')
      .select('aula_id, concluida, anotacao')
      .eq('responsavel_email', ctx.alunoEmail)
      .eq('aluno_nome', ctx.alunoNome)

    const progressoMap: Record<string, { concluida: boolean; anotacao: string | null }> = {}
    ;(progressos || []).forEach((p) => {
      progressoMap[p.aula_id] = { concluida: p.concluida, anotacao: p.anotacao }
    })

    return {
      id: aula.id,
      titulo: aula.titulo,
      descricao: aula.descricao,
      tipo: aula.tipo,
      conteudo_url: aula.conteudo_url,
      duracao_minutos: aula.duracao_minutos,
      modulo_id: mod.id,
      modulo_titulo: mod.titulo,
      disciplina: mod.disciplina,
      concluida: progressoMap[aula.id]?.concluida || false,
      anotacao: progressoMap[aula.id]?.anotacao || null,
      aulas_do_modulo: (todasAulas || []).map((a) => ({
        id: a.id,
        titulo: a.titulo,
        ordem: a.ordem,
        concluida: progressoMap[a.id]?.concluida || false,
      })),
    }
  } catch (e) {
    return null
  }
}

export async function salvarAnotacaoAluno(aulaId: string, anotacao: string) {
  try {
    const ctx = await getAlunoContexto()
    if (!ctx) return { success: false, error: 'Sessão expirada.' }

    const admin = createAdminClient()

    const { data: existente } = await admin
      .from('aulas_progresso')
      .select('id')
      .eq('aula_id', aulaId)
      .eq('responsavel_email', ctx.alunoEmail)
      .eq('aluno_nome', ctx.alunoNome)
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
        responsavel_email: ctx.alunoEmail,
        aluno_nome: ctx.alunoNome,
        anotacao,
      })
      if (error) return { success: false, error: error.message }
    }

    revalidatePath(`/aluno/aulas/${aulaId}`)
    revalidatePath('/aluno/aulas')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao salvar.' }
  }
}

export async function marcarAulaConcluida(aulaId: string, concluida: boolean) {
  try {
    const ctx = await getAlunoContexto()
    if (!ctx) return { success: false, error: 'Sessão expirada.' }

    const admin = createAdminClient()

    const { data: existente } = await admin
      .from('aulas_progresso')
      .select('id')
      .eq('aula_id', aulaId)
      .eq('responsavel_email', ctx.alunoEmail)
      .eq('aluno_nome', ctx.alunoNome)
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
        responsavel_email: ctx.alunoEmail,
        aluno_nome: ctx.alunoNome,
        ...payload,
      })
      if (error) return { success: false, error: error.message }
    }

    revalidatePath(`/aluno/aulas/${aulaId}`)
    revalidatePath('/aluno/aulas')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao atualizar.' }
  }
}

export async function getVideoaulasAluno(): Promise<VideoaulaAluno[]> {
  try {
    const ctx = await getAlunoContexto()
    if (!ctx) return []

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('videoaulas')
      .select('id, titulo, descricao, disciplina, serie, duracao_minutos, video_url, visualizacoes')
      .eq('escola_id', ctx.escolaId)
      .eq('publicado', true)
      .order('criado_em', { ascending: false })

    if (error) return []
    return (data || []) as VideoaulaAluno[]
  } catch (e) {
    return []
  }
}

export async function marcarComunicadoLidoAluno(comunicadoId: string) {
  try {
    const ctx = await getAlunoContexto()
    if (!ctx) return { success: false }

    const admin = createAdminClient()
    const { error } = await admin.from('comunicados_leituras').insert({
      comunicado_id: comunicadoId,
      responsavel_email: ctx.alunoEmail,
    })

    if (error && error.code !== '23505') return { success: false }
    revalidatePath('/aluno')
    return { success: true }
  } catch (e) {
    return { success: false }
  }
}