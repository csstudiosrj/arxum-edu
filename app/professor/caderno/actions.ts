'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getProfessorDoUsuario } from '@/lib/auth/professor-atual'

export type MinhaTurma = {
  id: string
  nome: string
  serie: string
  turno: string
  disciplina: string
}

export async function getMinhasTurmas(): Promise<MinhaTurma[]> {
  try {
    const prof = await getProfessorDoUsuario()
    if (!prof) return []

    const admin = createAdminClient()
    
    // Busca as turmas vinculadas a este professor
    const { data, error } = await admin
      .from('professores_turmas')
      .select(`
        disciplina,
        turmas ( id, nome, serie, turno )
      `)
      .eq('professor_id', prof.id)

    if (error || !data) return []

    return data.map((item: any) => ({
      id: item.turmas.id,
      nome: item.turmas.nome,
      serie: item.turmas.serie,
      turno: item.turmas.turno,
      disciplina: item.disciplina
    })) as MinhaTurma[]
  } catch (e) {
    return []
  }
}