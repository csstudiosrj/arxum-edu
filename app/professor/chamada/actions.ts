'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getProfessorDoUsuario } from '@/lib/auth/professor-atual'
import { revalidatePath } from 'next/cache'

export type AlunoChamada = {
  id: string
  nome: string
  serie: string | null
  turno: string | null
}

export type RegistroChamada = {
  aluno_id: string
  aluno_nome: string
  status: 'presente' | 'falta'
}

export async function getAlunosParaChamada(): Promise<AlunoChamada[]> {
  try {
    const prof = await getProfessorDoUsuario()
    if (!prof) return []

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('alunos')
      .select('id, nome, serie, turno')
      .eq('escola_id', prof.escola_id)
      .eq('status', 'ativo')
      .order('nome', { ascending: true })

    if (error) return []
    return (data || []) as AlunoChamada[]
  } catch (e) {
    return []
  }
}

export async function getChamadaDoDia(disciplina: string, dataAula: string): Promise<Record<string, 'presente' | 'falta'>> {
  try {
    const prof = await getProfessorDoUsuario()
    if (!prof) return {}

    const admin = createAdminClient()
    const { data } = await admin
      .from('chamadas')
      .select('aluno_id, status')
      .eq('escola_id', prof.escola_id)
      .eq('disciplina', disciplina)
      .eq('data_aula', dataAula)

    const mapa: Record<string, 'presente' | 'falta'> = {}
    ;(data || []).forEach((c) => {
      mapa[c.aluno_id] = c.status as 'presente' | 'falta'
    })
    return mapa
  } catch (e) {
    return {}
  }
}

export async function salvarChamada(disciplina: string, dataAula: string, registros: RegistroChamada[]) {
  try {
    const prof = await getProfessorDoUsuario()
    if (!prof) return { success: false, error: 'Sessão expirada.' }

    if (!disciplina) return { success: false, error: 'Selecione a disciplina.' }
    if (!dataAula) return { success: false, error: 'Informe a data.' }
    if (registros.length === 0) return { success: false, error: 'Nenhum registro para salvar.' }

    const admin = createAdminClient()

    // Mapeia para o formato da tabela
    const payload = registros.map((r) => ({
      escola_id: prof.escola_id,
      aluno_id: r.aluno_id,
      aluno_nome: r.aluno_nome,
      disciplina,
      data_aula: dataAula,
      status: r.status,
      professor_id: prof.id,
      professor_nome: prof.nome,
      atualizado_em: new Date().toISOString(),
    }))

    // Faz o upsert para não duplicar caso o professor edite a chamada no mesmo dia
    const { error } = await admin
      .from('chamadas')
      .upsert(payload, { onConflict: 'aluno_id,disciplina,data_aula' })

    if (error) return { success: false, error: error.message }

    revalidatePath('/professor/chamada')
    revalidatePath('/responsavel') // Se o pai for ver a frequência depois
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao salvar chamada.' }
  }
}