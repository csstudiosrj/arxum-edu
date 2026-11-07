'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getEscolaDoUsuario } from '@/lib/auth/escola-atual'
import { revalidatePath } from 'next/cache'

export type Turma = {
  id: string
  nome: string
  serie: string
  turno: string
  ano_letivo: string
}

export type AlunoSimples = { id: string; nome: string; serie: string | null; turno: string | null; turma_id: string | null }
export type ProfessorSimples = { id: string; nome: string; email: string }
export type ProfessorTurma = { id: string; professor_id: string; nome: string; disciplina: string }

export async function getTurmas(): Promise<Turma[]> {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return []

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('turmas')
      .select('*')
      .eq('escola_id', escola.id)
      .order('nome', { ascending: true })

    if (error) return []
    return (data || []) as Turma[]
  } catch (e) { return [] }
}

export async function criarTurma(data: { nome: string; serie: string; turno: string; ano_letivo: string }) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }
    if (!data.nome.trim() || !data.serie.trim() || !data.turno.trim()) return { success: false, error: 'Preencha todos os campos.' }

    const admin = createAdminClient()
    const { error } = await admin.from('turmas').insert({
      escola_id: escola.id,
      nome: data.nome,
      serie: data.serie,
      turno: data.turno,
      ano_letivo: data.ano_letivo || '2026'
    })

    if (error) return { success: false, error: error.message }
    revalidatePath('/admin/turmas')
    return { success: true }
  } catch (e) { return { success: false, error: 'Erro ao criar turma.' } }
}

export async function getAlunosDaTurma(turmaId: string): Promise<AlunoSimples[]> {
  try {
    const admin = createAdminClient()
    const { data } = await admin.from('alunos').select('id, nome, serie, turno, turma_id').eq('turma_id', turmaId).order('nome')
    return (data || []) as AlunoSimples[]
  } catch (e) { return [] }
}

export async function getAlunosSemTurma(): Promise<AlunoSimples[]> {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return []
    const admin = createAdminClient()
    const { data } = await admin.from('alunos').select('id, nome, serie, turno, turma_id').eq('escola_id', escola.id).is('turma_id', null).eq('status', 'ativo').order('nome')
    return (data || []) as AlunoSimples[]
  } catch (e) { return [] }
}

export async function vincularAluno(alunoId: string, turmaId: string | null) {
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('alunos').update({ turma_id: turmaId }).eq('id', alunoId)
    if (error) return { success: false, error: error.message }
    revalidatePath('/admin/turmas')
    return { success: true }
  } catch (e) { return { success: false, error: 'Erro ao vincular aluno.' } }
}

export async function getProfessoresDaTurma(turmaId: string): Promise<ProfessorTurma[]> {
  try {
    const admin = createAdminClient()
    const { data } = await admin.from('professores_turmas').select('id, professor_id, disciplina, perfis(nome)').eq('turma_id', turmaId)
    return (data || []).map((p: any) => ({
      id: p.id,
      professor_id: p.professor_id,
      nome: p.perfis?.nome || 'Professor',
      disciplina: p.disciplina
    })) as ProfessorTurma[]
  } catch (e) { return [] }
}

export async function getProfessores(): Promise<ProfessorSimples[]> {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return []
    const admin = createAdminClient()
    const { data } = await admin.from('perfis').select('id, nome, email').eq('escola_id', escola.id).eq('papel', 'professor')
    return (data || []) as ProfessorSimples[]
  } catch (e) { return [] }
}

export async function vincularProfessor(turmaId: string, professorId: string, disciplina: string) {
  try {
    if (!professorId || !disciplina) return { success: false, error: 'Preencha professor e disciplina.' }
    const admin = createAdminClient()
    const { error } = await admin.from('professores_turmas').insert({
      turma_id: turmaId,
      professor_id: professorId,
      disciplina
    })
    if (error) return { success: false, error: error.code === '23505' ? 'Professor já vinculado nesta disciplina.' : error.message }
    revalidatePath('/admin/turmas')
    return { success: true }
  } catch (e) { return { success: false, error: 'Erro ao vincular professor.' } }
}

export async function desvincularProfessor(id: string) {
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('professores_turmas').delete().eq('id', id)
    if (error) return { success: false, error: error.message }
    revalidatePath('/admin/turmas')
    return { success: true }
  } catch (e) { return { success: false, error: 'Erro ao desvincular.' } }
}