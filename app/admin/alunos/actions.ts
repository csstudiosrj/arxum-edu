'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export type Aluno = {
  id: string
  nome: string
  serie: string | null
  turno: string | null
  responsavel_nome: string
  responsavel_email: string
  responsavel_telefone: string | null
  status: string
  criado_em: string
}

export async function getAlunos(): Promise<Aluno[]> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('alunos')
      .select('id, nome, serie, turno, responsavel_nome, responsavel_email, responsavel_telefone, status, criado_em')
      .order('nome', { ascending: true })

    if (error) {
      console.error('Erro ao buscar alunos:', error)
      return []
    }
    return (data || []) as Aluno[]
  } catch (e) {
    console.error('Erro inesperado:', e)
    return []
  }
}