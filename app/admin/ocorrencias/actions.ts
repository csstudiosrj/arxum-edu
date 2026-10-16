'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
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

async function getEscolaId(): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin.from('escolas').select('id').eq('slug', 'colegio-horizonte').single()
  return data?.id || null
}

export async function getOcorrencias(): Promise<Ocorrencia[]> {
  try {
    const admin = createAdminClient()
    const escolaId = await getEscolaId()
    if (!escolaId) return []

    const { data, error } = await admin
      .from('ocorrencias')
      .select('id, aluno_id, aluno_nome, responsavel_email, tipo, gravidade, titulo, descricao, providencias, autor_nome, lida, lida_em, criado_em')
      .eq('escola_id', escolaId)
      .order('criado_em', { ascending: false })

    if (error) return []
    return (data || []) as Ocorrencia[]
  } catch (e) {
    return []
  }
}

export async function getAlunosParaOcorrencia(): Promise<Array<{ id: string; nome: string; responsavel_email: string }>> {
  try {
    const admin = createAdminClient()
    const escolaId = await getEscolaId()
    if (!escolaId) return []

    const { data } = await admin
      .from('alunos')
      .select('id, nome, responsavel_email')
      .eq('escola_id', escolaId)
      .eq('status', 'ativo')
      .order('nome', { ascending: true })

    return (data || []) as Array<{ id: string; nome: string; responsavel_email: string }>
  } catch (e) {
    return []
  }
}

export async function criarOcorrencia(data: NovaOcorrencia) {
  try {
    const admin = createAdminClient()
    const escolaId = await getEscolaId()
    if (!escolaId) return { success: false, error: 'Escola não encontrada.' }

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
      escola_id: escolaId,
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

    revalidatePath('/admin/ocorrencias')
    revalidatePath('/responsavel')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao criar ocorrência.' }
  }
}

export async function excluirOcorrencia(id: string) {
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('ocorrencias').delete().eq('id', id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/ocorrencias')
    revalidatePath('/responsavel')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao excluir.' }
  }
}