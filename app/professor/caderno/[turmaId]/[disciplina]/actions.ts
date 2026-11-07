'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getProfessorDoUsuario } from '@/lib/auth/professor-atual'
import { revalidatePath } from 'next/cache'

export type AlunoTurma = {
  id: string
  nome: string
}

export type Avaliacao = {
  id: string
  titulo: string
  peso: number
  nota_maxima: number
}

export type NotaParcial = {
  aluno_id: string
  avaliacao_id: string
  nota: number | null
}

export type DadosCaderno = {
  turmaNome: string
  escolaId: string
  alunos: AlunoTurma[]
  avaliacoes: Avaliacao[]
  notas: NotaParcial[]
  notasOficiais: Record<string, { nota_final: number | null, ajuste: number | null, justificativa: string | null }>
}

export async function getDadosCaderno(turmaId: string, disciplina: string, periodo: string): Promise<DadosCaderno | null> {
  try {
    const prof = await getProfessorDoUsuario()
    if (!prof) return null

    const admin = createAdminClient()

    // 1. Dados da Turma
    const { data: turma } = await admin.from('turmas').select('nome').eq('id', turmaId).single()
    if (!turma) return null

    // 2. Alunos da Turma
    const { data: alunos } = await admin
      .from('alunos')
      .select('id, nome')
      .eq('turma_id', turmaId)
      .eq('status', 'ativo')
      .order('nome')
    
    // 3. Avaliações do Período
    const { data: avaliacoes } = await admin
      .from('avaliacoes')
      .select('id, titulo, peso, nota_maxima')
      .eq('turma_id', turmaId)
      .eq('disciplina', disciplina)
      .eq('periodo', periodo)
      .order('criado_em')

    // 4. Notas Parciais
    const idsAvaliacoes = (avaliacoes || []).map(a => a.id)
    let notas: NotaParcial[] = []
    if (idsAvaliacoes.length > 0) {
      const { data } = await admin
        .from('avaliacoes_notas')
        .select('aluno_id, avaliacao_id, nota')
        .in('avaliacao_id', idsAvaliacoes)
      notas = (data || []) as NotaParcial[]
    }

    // 5. Notas Oficiais (para saber o que já foi enviado)
    const idsAlunos = (alunos || []).map(a => a.id)
    let notasOficiais: Record<string, any> = {}
    if (idsAlunos.length > 0) {
      const { data } = await admin
        .from('notas')
        .select('aluno_id, nota_final, ajuste_manual, justificativa_ajuste')
        .eq('disciplina', disciplina)
        .eq('periodo', periodo)
        .in('aluno_id', idsAlunos)
      
      ;(data || []).forEach(n => {
        notasOficiais[n.aluno_id] = {
          nota_final: n.nota_final,
          ajuste: n.ajuste_manual,
          justificativa: n.justificativa_ajuste
        }
      })
    }

    return {
      turmaNome: turma.nome,
      escolaId: prof.escola_id,
      alunos: (alunos || []) as AlunoTurma[],
      avaliacoes: (avaliacoes || []) as Avaliacao[],
      notas,
      notasOficiais
    }
  } catch (e) {
    return null
  }
}

export async function criarAvaliacao(data: {
  turmaId: string
  disciplina: string
  periodo: string
  titulo: string
  peso: number
  nota_maxima: number
}) {
  try {
    const prof = await getProfessorDoUsuario()
    if (!prof) return { success: false, error: 'Sessão expirada.' }
    if (!data.titulo.trim()) return { success: false, error: 'Informe o título.' }

    const admin = createAdminClient()
    const { error } = await admin.from('avaliacoes').insert({
      escola_id: prof.escola_id,
      turma_id: data.turmaId,
      professor_id: prof.id,
      disciplina: data.disciplina,
      periodo: data.periodo,
      titulo: data.titulo,
      peso: data.peso,
      nota_maxima: data.nota_maxima
    })

    if (error) return { success: false, error: error.message }

    revalidatePath(`/professor/caderno/${data.turmaId}/${data.disciplina}`)
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao criar avaliação.' }
  }
}

export async function salvarNotaParcial(avaliacaoId: string, alunoId: string, nota: number | null) {
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('avaliacoes_notas').upsert({
      avaliacao_id: avaliacaoId,
      aluno_id: alunoId,
      nota,
      atualizado_em: new Date().toISOString()
    }, { onConflict: 'avaliacao_id, aluno_id' })

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao salvar nota.' }
  }
}

export async function lancarNoDiarioOficial(data: {
  turmaId: string
  disciplina: string
  periodo: string
  notas: Array<{
    aluno_id: string
    aluno_nome: string
    responsavel_email: string
    nota_calculada: number
    nota_final: number
    ajuste_manual: number
    justificativa: string
  }>
}) {
  try {
    const prof = await getProfessorDoUsuario()
    if (!prof) return { success: false, error: 'Sessão expirada.' }

    const admin = createAdminClient()

    // Prepara o lote para o upsert na tabela 'notas'
    const payload = data.notas.map(n => ({
      escola_id: prof.escola_id,
      aluno_id: n.aluno_id,
      aluno_nome: n.aluno_nome,
      responsavel_email: n.responsavel_email,
      disciplina: data.disciplina,
      periodo: data.periodo,
      faltas: 0, // Faltas são gerenciadas no módulo de chamada
      nota: n.nota_calculada, // Guarda o cálculo exato
      nota_final: n.nota_final, // A nota que vale
      ajuste_manual: n.ajuste_manual,
      justificativa_ajuste: n.justificativa || null,
      atualizado_em: new Date().toISOString()
    }))

    const { error } = await admin.from('notas').upsert(payload, { 
      onConflict: 'aluno_id,disciplina,periodo' 
    })

    if (error) return { success: false, error: error.message }

    revalidatePath(`/professor/caderno/${data.turmaId}/${data.disciplina}`)
    revalidatePath('/admin/notas')
    revalidatePath('/aluno/boletim')
    revalidatePath('/responsavel')
    
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao lançar notas no diário.' }
  }
}

export async function getAlunosComEmail(turmaId: string) {
  try {
    const admin = createAdminClient()
    const { data } = await admin.from('alunos').select('id, nome, responsavel_email').eq('turma_id', turmaId)
    return data || []
  } catch (e) {
    return []
  }
}