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
}

async function getEscolaIdAluno(): Promise<{ alunoId: string; escolaId: string } | null> {
  const aluno = await getAlunoDoUsuario()
  if (!aluno) return null
  return { alunoId: aluno.id, escolaId: aluno.escola_id }
}

export async function getMinhasNotas(): Promise<NotaAluno[]> {
  try {
    const ids = await getEscolaIdAluno()
    if (!ids) return []

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('notas')
      .select('disciplina, periodo, nota, faltas, observacao')
      .eq('aluno_id', ids.alunoId)
      .order('disciplina', { ascending: true })

    if (error) return []
    return (data || []) as NotaAluno[]
  } catch (e) {
    return []
  }
}

export async function getMeusEventosAluno(): Promise<EventoAluno[]> {
  try {
    const ids = await getEscolaIdAluno()
    if (!ids) return []

    const admin = createAdminClient()
    const hoje = new Date().toISOString().split('T')[0]

    const { data, error } = await admin
      .from('eventos')
      .select('id, titulo, descricao, tipo, data_evento, hora_evento')
      .eq('escola_id', ids.escolaId)
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
    const ids = await getEscolaIdAluno()
    if (!ids) return []

    const aluno = await getAlunoDoUsuario()
    if (!aluno) return []

    const admin = createAdminClient()
    const { data: coms, error } = await admin
      .from('comunicados')
      .select('id, titulo, mensagem, setor, prioridade, autor_nome, criado_em')
      .eq('escola_id', ids.escolaId)
      .eq('ativo', true)
      .order('criado_em', { ascending: false })
      .limit(20)

    if (error || !coms) return []

    const { data: leituras } = await admin
      .from('comunicados_leituras')
      .select('comunicado_id')
      .eq('responsavel_email', aluno.email_aluno || aluno.responsavel_email)

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
    const ids = await getEscolaIdAluno()
    if (!ids) return []

    const admin = createAdminClient()
    const aluno = await getAlunoDoUsuario()
    if (!aluno) return []

    const { data: mods } = await admin
      .from('modulos')
      .select('id, titulo, disciplina')
      .eq('escola_id', ids.escolaId)
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
      .select('aula_id, concluida')
      .eq('responsavel_email', aluno.email_aluno || aluno.responsavel_email)
      .eq('aluno_nome', aluno.nome)

    const progressoMap: Record<string, boolean> = {}
    ;(progressos || []).forEach((p) => {
      progressoMap[p.aula_id] = p.concluida
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
        concluida: progressoMap[a.id] || false,
      }
    }) as AulaPendente[]
  } catch (e) {
    return []
  }
}

export async function marcarComunicadoLidoAluno(comunicadoId: string) {
  try {
    const aluno = await getAlunoDoUsuario()
    if (!aluno) return { success: false }

    const admin = createAdminClient()
    const { error } = await admin.from('comunicados_leituras').insert({
      comunicado_id: comunicadoId,
      responsavel_email: aluno.email_aluno || aluno.responsavel_email,
    })

    if (error && error.code !== '23505') return { success: false }
    revalidatePath('/aluno')
    return { success: true }
  } catch (e) {
    return { success: false }
  }
}