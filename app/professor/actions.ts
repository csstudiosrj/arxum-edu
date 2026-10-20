'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getProfessorDoUsuario } from '@/lib/auth/professor-atual'
import { notificarNotaLancada, notificarOcorrencia } from '@/lib/emails/notificacoes'
import { enviarSeAtivo } from '@/lib/notificacoes-config-server'
import { revalidatePath } from 'next/cache'

export type AlunoResumo = {
  id: string
  nome: string
  serie: string | null
  turno: string | null
  responsavel_email: string
}

export type NotaProfessor = {
  id: string
  aluno_id: string | null
  aluno_nome: string
  responsavel_email: string
  disciplina: string
  periodo: string
  nota: number | null
  faltas: number
  observacao: string | null
  autor_nome: string | null
  criado_em: string
}

export type OcorrenciaProfessor = {
  id: string
  aluno_nome: string
  tipo: string
  gravidade: string
  titulo: string
  descricao: string
  providencias: string | null
  autor_nome: string
  criado_em: string
}

export async function getAlunosDoProfessor(): Promise<AlunoResumo[]> {
  try {
    const prof = await getProfessorDoUsuario()
    if (!prof) return []

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('alunos')
      .select('id, nome, serie, turno, responsavel_email')
      .eq('escola_id', prof.escola_id)
      .eq('status', 'ativo')
      .order('nome', { ascending: true })

    if (error) return []
    return (data || []) as AlunoResumo[]
  } catch (e) {
    return []
  }
}

export async function getNotasDoProfessor(): Promise<NotaProfessor[]> {
  try {
    const prof = await getProfessorDoUsuario()
    if (!prof) return []

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('notas')
      .select('id, aluno_id, aluno_nome, responsavel_email, disciplina, periodo, nota, faltas, observacao, criado_em')
      .eq('escola_id', prof.escola_id)
      .order('criado_em', { ascending: false })
      .limit(100)

    if (error) return []
    return (data || []).map((n) => ({ ...n, autor_nome: null })) as NotaProfessor[]
  } catch (e) {
    return []
  }
}

export async function lancarNotaProfessor(data: {
  aluno_id: string
  aluno_nome: string
  responsavel_email: string
  disciplina: string
  periodo: string
  nota: number | null
  faltas: number
  observacao: string
}) {
  try {
    const prof = await getProfessorDoUsuario()
    if (!prof) return { success: false, error: 'Sessão expirada.' }

    const admin = createAdminClient()
    const { error } = await admin
      .from('notas')
      .upsert(
        {
          escola_id: prof.escola_id,
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

    try {
      if (data.responsavel_email) {
        enviarSeAtivo({
          escolaId: prof.escola_id,
          evento: 'nota',
          enviar: () =>
            notificarNotaLancada({
              para: data.responsavel_email,
              escolaNome: prof.escola_nome,
              escolaSlug: prof.escola_slug,
              alunoNome: data.aluno_nome,
              disciplina: data.disciplina,
              periodo: data.periodo,
              nota: data.nota,
              faltas: data.faltas,
            }),
        }).catch((e) => console.error('[email nota professor]', data.responsavel_email, e))
      }
    } catch (e) {
      console.error('Erro ao disparar e-mail de nota:', e)
    }

    revalidatePath('/professor/notas')
    revalidatePath('/admin/notas')
    revalidatePath('/aluno/boletim')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao lançar nota.' }
  }
}

export async function excluirNotaProfessor(id: string) {
  try {
    const prof = await getProfessorDoUsuario()
    if (!prof) return { success: false, error: 'Sessão expirada.' }

    const admin = createAdminClient()
    const { error } = await admin
      .from('notas')
      .delete()
      .eq('id', id)
      .eq('escola_id', prof.escola_id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/professor/notas')
    revalidatePath('/admin/notas')
    revalidatePath('/aluno/boletim')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao excluir nota.' }
  }
}

export async function getOcorrenciasDoProfessor(): Promise<OcorrenciaProfessor[]> {
  try {
    const prof = await getProfessorDoUsuario()
    if (!prof) return []

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('ocorrencias')
      .select('id, aluno_nome, tipo, gravidade, titulo, descricao, providencias, autor_nome, criado_em')
      .eq('escola_id', prof.escola_id)
      .order('criado_em', { ascending: false })
      .limit(50)

    if (error) return []
    return (data || []) as OcorrenciaProfessor[]
  } catch (e) {
    return []
  }
}

export async function criarOcorrenciaProfessor(data: {
  aluno_id: string
  aluno_nome: string
  responsavel_email: string
  tipo: string
  gravidade: string
  titulo: string
  descricao: string
  providencias: string
}) {
  try {
    const prof = await getProfessorDoUsuario()
    if (!prof) return { success: false, error: 'Sessão expirada.' }

    const admin = createAdminClient()
    const { error } = await admin.from('ocorrencias').insert({
      escola_id: prof.escola_id,
      aluno_id: data.aluno_id,
      aluno_nome: data.aluno_nome,
      responsavel_email: data.responsavel_email,
      tipo: data.tipo,
      gravidade: data.gravidade,
      titulo: data.titulo,
      descricao: data.descricao,
      providencias: data.providencias || null,
      autor_nome: prof.nome,
    })

    if (error) return { success: false, error: error.message }

    try {
      if (data.responsavel_email) {
        enviarSeAtivo({
          escolaId: prof.escola_id,
          evento: 'ocorrencia',
          enviar: () =>
            notificarOcorrencia({
              para: data.responsavel_email,
              escolaNome: prof.escola_nome,
              escolaSlug: prof.escola_slug,
              alunoNome: data.aluno_nome,
              titulo: data.titulo,
              tipo: data.tipo,
              gravidade: data.gravidade,
              descricao: data.descricao,
            }),
        }).catch((e) => console.error('[email ocorrencia professor]', data.responsavel_email, e))
      }
    } catch (e) {
      console.error('Erro ao disparar e-mail de ocorrência:', e)
    }

    revalidatePath('/professor/ocorrencias')
    revalidatePath('/admin/ocorrencias')
    revalidatePath('/responsavel')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao registrar ocorrência.' }
  }
}

export async function atualizarOcorrenciaProfessor(id: string, data: Partial<{
  tipo: string
  gravidade: string
  titulo: string
  descricao: string
  providencias: string
}>) {
  try {
    const prof = await getProfessorDoUsuario()
    if (!prof) return { success: false, error: 'Sessão expirada.' }

    const admin = createAdminClient()
    const payload: Record<string, any> = { atualizado_em: new Date().toISOString() }
    
    if (data.tipo) payload.tipo = data.tipo
    if (data.gravidade) payload.gravidade = data.gravidade
    if (data.titulo) payload.titulo = data.titulo
    if (data.descricao) payload.descricao = data.descricao
    if (data.providencias !== undefined) payload.providencias = data.providencias || null

    const { error } = await admin
      .from('ocorrencias')
      .update(payload)
      .eq('id', id)
      .eq('escola_id', prof.escola_id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/professor/ocorrencias')
    revalidatePath('/admin/ocorrencias')
    revalidatePath('/responsavel')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao atualizar ocorrência.' }
  }
}

export async function excluirOcorrenciaProfessor(id: string) {
  try {
    const prof = await getProfessorDoUsuario()
    if (!prof) return { success: false, error: 'Sessão expirada.' }

    const admin = createAdminClient()
    const { error } = await admin
      .from('ocorrencias')
      .delete()
      .eq('id', id)
      .eq('escola_id', prof.escola_id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/professor/ocorrencias')
    revalidatePath('/admin/ocorrencias')
    revalidatePath('/responsavel')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao excluir ocorrência.' }
  }
}