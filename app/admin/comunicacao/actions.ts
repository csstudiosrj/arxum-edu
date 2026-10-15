'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type Comunicado = {
  id: string
  titulo: string
  mensagem: string
  setor: string
  prioridade: string
  autor_nome: string
  ativo: boolean
  criado_em: string
  total_leituras: number
}

export type NovoComunicado = {
  titulo: string
  mensagem: string
  setor: string
  prioridade: string
}

async function getEscolaId(): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin.from('escolas').select('id').eq('slug', 'colegio-horizonte').single()
  return data?.id || null
}

export async function getComunicados(): Promise<Comunicado[]> {
  try {
    const admin = createAdminClient()
    const escolaId = await getEscolaId()
    if (!escolaId) return []

    const { data: coms, error } = await admin
      .from('comunicados')
      .select('*')
      .eq('escola_id', escolaId)
      .order('criado_em', { ascending: false })

    if (error || !coms) return []

    const { data: leituras } = await admin
      .from('comunicados_leituras')
      .select('comunicado_id')

    const contagemPorCom: Record<string, number> = {}
    ;(leituras || []).forEach((l) => {
      contagemPorCom[l.comunicado_id] = (contagemPorCom[l.comunicado_id] || 0) + 1
    })

    return coms.map((c) => ({
      id: c.id,
      titulo: c.titulo,
      mensagem: c.mensagem,
      setor: c.setor,
      prioridade: c.prioridade,
      autor_nome: c.autor_nome,
      ativo: c.ativo,
      criado_em: c.criado_em,
      total_leituras: contagemPorCom[c.id] || 0,
    })) as Comunicado[]
  } catch (e) {
    console.error('Erro:', e)
    return []
  }
}

export async function criarComunicado(data: NovoComunicado) {
  try {
    const admin = createAdminClient()
    const escolaId = await getEscolaId()
    if (!escolaId) return { success: false, error: 'Escola não encontrada.' }

    const supabaseAuth = await createClient()
    const { data: { user } } = await supabaseAuth.auth.getUser()

    let autor = 'Administração'
    if (user?.email) {
      const { data: perfil } = await admin
        .from('perfis')
        .select('nome')
        .eq('email', user.email)
        .maybeSingle()
      autor = perfil?.nome || user.email.split('@')[0]
    }

    const { error } = await admin.from('comunicados').insert({
      escola_id: escolaId,
      titulo: data.titulo,
      mensagem: data.mensagem,
      setor: data.setor,
      prioridade: data.prioridade,
      autor_nome: autor,
    })

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/comunicacao')
    revalidatePath('/responsavel')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao criar comunicado.' }
  }
}

export async function excluirComunicado(id: string) {
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('comunicados').delete().eq('id', id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/comunicacao')
    revalidatePath('/responsavel')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao excluir.' }
  }
}