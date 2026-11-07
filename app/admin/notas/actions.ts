'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getEscolaDoUsuario } from '@/lib/auth/escola-atual'
import { notificarNotaLancada } from '@/lib/emails/notificacoes'
import { enviarSeAtivo } from '@/lib/notificacoes-config-server'
import { revalidatePath } from 'next/cache'

export type Nota = {
  id: string
  aluno_id: string | null
  aluno_nome: string
  responsavel_email: string
  disciplina: string
  periodo: string
  nota: number | null
  nota_final: number | null
  ajuste_manual: number | null
  justificativa_ajuste: string | null
  faltas: number
  observacao: string | null
  criado_em: string
}

export type NovaNota = {
  aluno_id: string
  aluno_nome: string
  responsavel_email: string
  disciplina: string
  periodo: string
  nota: number | null
  faltas: number
  observacao: string
}

export async function getNotas(): Promise<Nota[]> {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return []

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('notas')
      .select('id, aluno_id, aluno_nome, responsavel_email, disciplina, periodo, nota, nota_final, ajuste_manual, justificativa_ajuste, faltas, observacao, criado_em')
      .eq('escola_id', escola.id)
      .order('aluno_nome', { ascending: true })
      .order('disciplina', { ascending: true })

    if (error) return []
    return (data || []) as Nota[]
  } catch (e) {
    return []
  }
}

export async function getAlunosAtivos(): Promise<Array<{ id: string; nome: string; responsavel_email: string }>> {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return []

    const admin = createAdminClient()
    const { data } = await admin
      .from('alunos')
      .select('id, nome, responsavel_email')
      .eq('escola_id', escola.id)
      .eq('status', 'ativo')
      .order('nome')

    return data || []
  } catch (e) {
    return []
  }
}