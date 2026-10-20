'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getEscolaDoUsuario } from '@/lib/auth/escola-atual'
import { notificarOcorrencia } from '@/lib/emails/notificacoes'
import { enviarSeAtivo } from '@/lib/notificacoes-config-server'
import { revalidatePath } from 'next/cache'

export type Ocorrencia = {
  id: string
  aluno_id: string | null
  aluno_nome: string
  responsavel_email: string
  tipo: string
  gravidade: string
  titulo: string
  descricao: string
  providencias: string | null
  autor_nome: string
  lida: boolean
  lida_em: string | null
  criado_em: string
}

export type NovaOcorrencia = {
  aluno_id: string
  aluno_nome: string
  responsavel_email: string
  tipo: string
  gravidade: string
  titulo: string
  descricao: string
  providencias: string
}

export async function getOcorrencias(): Promise<Ocorrencia[]> {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return []

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('ocorrencias')
      .select('id, aluno_id, aluno_nome, responsavel_email, tipo, gravidade, titulo, descricao, providencias, autor_nome, lida, lida_em, criado_em')
      .eq('escola_id', escola.id)
      .order('criado_em', { ascending: false })

    if (error) return []
    return (data || []) as Ocorrencia[]
  } catch (e) {
    return []
  }
}

export async function getAlunosParaOcorrencia(): Promise<Array<{ id: string; nome: string; responsavel_email: string }>> {
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

export async function criarOcorrencia(data: NovaOcorrencia) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const supabaseAuth = await createClient()
    const { data: { user } } = await supabaseAuth.auth.getUser()

    let autor = 'Coordenação'
    if (user?.email) {
      const { data: perfil } = await admin
        .from('perfis')
        .select('nome')
        .eq('email', user.email)
        .maybeSingle()
      autor = perfil?.nome || user.email.split('@')[0]
    }

    const { error } = await admin.from('ocorrencias').insert({
      escola_id: escola.id,
      aluno_id: data.aluno_id,
      aluno_nome: data.aluno_nome,
      responsavel_email: data.responsavel_email,
      tipo: data.tipo,
      gravidade: data.gravidade,
      titulo: data.titulo,
      descricao: data.descricao,
      providencias: data.providencias || null,
      autor_nome: autor,
    })

    if (error) return { success: false, error: error.message }

    try {
      if (data.responsavel_email) {
        enviarSeAtivo({
          escolaId: escola.id,
          evento: 'ocorrencia',
          enviar: () =>
            notificarOcorrencia({
              para: data.responsavel_email,
              escolaNome: escola.nome,
              escolaSlug: escola.slug,
              alunoNome: data.aluno_nome,
              titulo: data.titulo,
              tipo: data.tipo,
              gravidade: data.gravidade,
              descricao: data.descricao,
            }),
        }).catch((e) => console.error('[email ocorrencia]', data.responsavel_email, e))
      }
    } catch (e) {
      console.error('Erro ao disparar e-mail de ocorrência:', e)
    }

    revalidatePath('/admin/ocorrencias')
    revalidatePath('/responsavel')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao criar ocorrência.' }
  }
}

export async function atualizarOcorrencia(id: string, data: Partial<NovaOcorrencia>) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

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
      .eq('escola_id', escola.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/ocorrencias')
    revalidatePath('/responsavel')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao atualizar ocorrência.' }
  }
}

export async function excluirOcorrencia(id: string) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const { error } = await admin.from('ocorrencias').delete().eq('id', id).eq('escola_id', escola.id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/ocorrencias')
    revalidatePath('/responsavel')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao excluir.' }
  }
}