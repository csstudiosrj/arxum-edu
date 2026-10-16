'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getEscolaDoUsuario } from '@/lib/auth/escola-atual'
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

export async function getComunicados(): Promise<Comunicado[]> {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return []

    const admin = createAdminClient()
    const { data: coms, error } = await admin
      .from('comunicados')
      .select('*')
      .eq('escola_id', escola.id)
      .order('criado_em', { ascending: false })

    if (error || !coms) return []

    const idsComs = coms.map((c) => c.id)

    let leituras: Array<{ comunicado_id: string }> = []
    if (idsComs.length > 0) {
      const { data } = await admin
        .from('comunicados_leituras')
        .select('comunicado_id')
        .in('comunicado_id', idsComs)
      leituras = (data || []) as Array<{ comunicado_id: string }>
    }

    const contagemPorCom: Record<string, number> = {}
    leituras.forEach((l) => {
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
    return []
  }
}

export async function criarComunicado(data: NovoComunicado) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
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
      escola_id: escola.id,
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
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const { error } = await admin.from('comunicados').delete().eq('id', id).eq('escola_id', escola.id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/comunicacao')
    revalidatePath('/responsavel')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao excluir.' }
  }
}