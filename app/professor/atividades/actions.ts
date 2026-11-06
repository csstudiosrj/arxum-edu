'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getProfessorDoUsuario } from '@/lib/auth/professor-atual'
import { revalidatePath } from 'next/cache'

export type AtividadeProfessor = {
  id: string
  titulo: string
  descricao: string | null
  prazo_entrega: string | null
  nota_maxima: number
  modulo_id: string
  modulo_titulo: string
  total_entregas: number
}

export type EntregaAluno = {
  id: string
  aluno_id: string
  aluno_nome: string
  arquivo_url: string | null
  comentario_aluno: string | null
  nota: number | null
  feedback_professor: string | null
  status: string
  entregue_em: string | null
}

export async function getAtividadesDoProfessor(): Promise<AtividadeProfessor[]> {
  try {
    const prof = await getProfessorDoUsuario()
    if (!prof) return []

    const admin = createAdminClient()
    const { data: atividades, error } = await admin
      .from('atividades')
      .select('*, modulos(titulo)')
      .eq('escola_id', prof.escola_id)
      .order('criado_em', { ascending: false })

    if (error || !atividades) return []

    // Busca a contagem de entregas
    const ids = atividades.map(a => a.id)
    const { data: entregas } = await admin
      .from('entregas_atividades')
      .select('atividade_id')
      .in('atividade_id', ids)

    const contagem: Record<string, number> = {}
    ;(entregas || []).forEach(e => {
      contagem[e.atividade_id] = (contagem[e.atividade_id] || 0) + 1
    })

    return atividades.map((a: any) => ({
      id: a.id,
      titulo: a.titulo,
      descricao: a.descricao,
      prazo_entrega: a.prazo_entrega,
      nota_maxima: a.nota_maxima,
      modulo_id: a.modulo_id,
      modulo_titulo: a.modulos?.titulo || 'Módulo removido',
      total_entregas: contagem[a.id] || 0
    })) as AtividadeProfessor[]
  } catch (e) {
    return []
  }
}

export async function getEntregasDaAtividade(atividadeId: string): Promise<EntregaAluno[]> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('entregas_atividades')
      .select('*, alunos(nome)')
      .eq('atividade_id', atividadeId)
      .order('entregue_em', { ascending: false })

    if (error || !data) return []

    return data.map((e: any) => ({
      id: e.id,
      aluno_id: e.aluno_id,
      aluno_nome: e.alunos?.nome || 'Aluno',
      arquivo_url: e.arquivo_url,
      comentario_aluno: e.comentario_aluno,
      nota: e.nota,
      feedback_professor: e.feedback_professor,
      status: e.status,
      entregue_em: e.entregue_em
    })) as EntregaAluno[]
  } catch (e) {
    return []
  }
}

export async function criarAtividadeProfessor(data: {
  modulo_id: string
  titulo: string
  descricao: string
  prazo_entrega: string
  nota_maxima: number
}) {
  try {
    const prof = await getProfessorDoUsuario()
    if (!prof) return { success: false, error: 'Sessão expirada.' }

    if (!data.titulo.trim()) return { success: false, error: 'Informe o título.' }
    if (!data.modulo_id) return { success: false, error: 'Selecione um módulo.' }

    const admin = createAdminClient()
    const { error } = await admin.from('atividades').insert({
      escola_id: prof.escola_id,
      professor_id: prof.id,
      modulo_id: data.modulo_id,
      titulo: data.titulo,
      descricao: data.descricao || null,
      prazo_entrega: data.prazo_entrega || null,
      nota_maxima: data.nota_maxima || 10
    })

    if (error) return { success: false, error: error.message }

    revalidatePath('/professor/atividades')
    revalidatePath('/aluno/atividades')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao criar atividade.' }
  }
}

export async function corrigirEntrega(entregaId: string, nota: number, feedback: string) {
  try {
    const admin = createAdminClient()
    
    const { error } = await admin
      .from('entregas_atividades')
      .update({
        nota,
        feedback_professor: feedback || null,
        status: 'corrigida',
        corrigido_em: new Date().toISOString()
      })
      .eq('id', entregaId)

    if (error) return { success: false, error: error.message }

    revalidatePath('/professor/atividades')
    revalidatePath('/aluno/atividades')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao corrigir.' }
  }
}
