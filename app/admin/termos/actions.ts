'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getEscolaDoUsuario } from '@/lib/auth/escola-atual'
import { revalidatePath } from 'next/cache'

export type Termo = {
  id: string
  aluno_nome: string
  responsavel_email: string
  titulo: string
  conteudo_html: string
  status: 'pendente' | 'assinado' | 'recusado'
  assinado_em: string | null
  ip_assinatura: string | null
  hash_assinatura: string | null
  criado_em: string
}

export async function getTermosEscola(): Promise<Termo[]> {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return []

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('termos_assinatura')
      .select(`
        id, aluno_id, responsavel_email, titulo, conteudo_html, status, assinado_em, ip_assinatura, hash_assinatura, criado_em,
        alunos ( nome )
      `)
      .eq('escola_id', escola.id)
      .order('criado_em', { ascending: false })

    if (error || !data) return []

    return data.map((t: any) => ({
      id: t.id,
      aluno_nome: t.alunos?.nome || 'Aluno',
      responsavel_email: t.responsavel_email,
      titulo: t.titulo,
      conteudo_html: t.conteudo_html,
      status: t.status,
      assinado_em: t.assinado_em,
      ip_assinatura: t.ip_assinatura,
      hash_assinatura: t.hash_assinatura,
      criado_em: t.criado_em,
    })) as Termo[]
  } catch (e) {
    return []
  }
}

export async function criarTermo(data: { aluno_id: string; titulo: string; conteudo_html: string }) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    if (!data.aluno_id || !data.titulo || !data.conteudo_html) {
      return { success: false, error: 'Preencha todos os campos.' }
    }

    const admin = createAdminClient()

    const { data: aluno } = await admin
      .from('alunos')
      .select('responsavel_email')
      .eq('id', data.aluno_id)
      .eq('escola_id', escola.id)
      .maybeSingle()

    if (!aluno) return { success: false, error: 'Aluno não encontrado.' }

    const { error } = await admin.from('termos_assinatura').insert({
      escola_id: escola.id,
      aluno_id: data.aluno_id,
      responsavel_email: aluno.responsavel_email,
      titulo: data.titulo,
      conteudo_html: data.conteudo_html,
      status: 'pendente'
    })

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/termos')
    revalidatePath('/responsavel')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao criar termo.' }
  }
}

export async function excluirTermo(id: string) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const { error } = await admin
      .from('termos_assinatura')
      .delete()
      .eq('id', id)
      .eq('escola_id', escola.id)
      .eq('status', 'pendente') // Só pode excluir se não foi assinado

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/termos')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao excluir.' }
  }
}