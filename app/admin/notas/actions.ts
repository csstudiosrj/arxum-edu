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
      .select('id, aluno_id, aluno_nome, responsavel_email, disciplina, periodo, nota, faltas, observacao, criado_em')
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
      .order('nome', { ascending: true })

    return (data || []) as Array<{ id: string; nome: string; responsavel_email: string }>
  } catch (e) {
    return []
  }
}

export async function lancarNota(data: NovaNota) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const { error } = await admin
      .from('notas')
      .upsert(
        {
          escola_id: escola.id,
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

    // Notifica o responsável — respeitando a config da escola.
    try {
      if (data.responsavel_email) {
        enviarSeAtivo({
          escolaId: escola.id,
          evento: 'nota',
          enviar: () =>
            notificarNotaLancada({
              para: data.responsavel_email,
              escolaNome: escola.nome,
              escolaSlug: escola.slug,
              alunoNome: data.aluno_nome,
              disciplina: data.disciplina,
              periodo: data.periodo,
              nota: data.nota,
              faltas: data.faltas,
            }),
        }).catch((e) => console.error('[email nota]', data.responsavel_email, e))
      }
    } catch (e) {
      console.error('Erro ao disparar e-mail de nota:', e)
    }

    revalidatePath('/admin/notas')
    revalidatePath('/responsavel')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao lançar nota.' }
  }
}

export async function excluirNota(id: string) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const { error } = await admin.from('notas').delete().eq('id', id).eq('escola_id', escola.id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/notas')
    revalidatePath('/responsavel')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao excluir.' }
  }
}