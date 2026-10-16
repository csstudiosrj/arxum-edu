'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getEscolaDoUsuario } from '@/lib/auth/escola-atual'
import { revalidatePath } from 'next/cache'

export type Unidade = {
  id: string
  escola_id: string
  nome: string
  slug: string | null
  endereco: string | null
  cidade: string | null
  estado: string | null
  pais: string | null
  telefone: string | null
  email_contato: string | null
  responsavel_nome: string | null
  responsavel_email: string | null
  ativa: boolean
  observacoes: string | null
  criado_em: string
  total_alunos?: number
  total_usuarios?: number
}

export type NovaUnidade = {
  nome: string
  slug: string
  endereco: string
  cidade: string
  estado: string
  pais: string
  telefone: string
  email_contato: string
  responsavel_nome: string
  responsavel_email: string
  observacoes: string
}

function gerarSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50)
}

export async function getUnidades(): Promise<Unidade[]> {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return []

    const admin = createAdminClient()

    const { data: unidades, error } = await admin
      .from('unidades')
      .select('*')
      .eq('escola_id', escola.id)
      .order('criado_em', { ascending: true })

    if (error || !unidades) return []

    const { data: alunos } = await admin
      .from('alunos')
      .select('unidade_id')
      .eq('escola_id', escola.id)

    const { data: perfis } = await admin
      .from('perfis')
      .select('unidade_id')
      .eq('escola_id', escola.id)

    const alunosPorUnidade: Record<string, number> = {}
    const usuariosPorUnidade: Record<string, number> = {}

    ;(alunos || []).forEach((a) => {
      if (a.unidade_id) alunosPorUnidade[a.unidade_id] = (alunosPorUnidade[a.unidade_id] || 0) + 1
    })
    ;(perfis || []).forEach((p) => {
      if (p.unidade_id) usuariosPorUnidade[p.unidade_id] = (usuariosPorUnidade[p.unidade_id] || 0) + 1
    })

    return unidades.map((u) => ({
      ...u,
      total_alunos: alunosPorUnidade[u.id] || 0,
      total_usuarios: usuariosPorUnidade[u.id] || 0,
    })) as Unidade[]
  } catch (e) {
    console.error('Erro ao buscar unidades:', e)
    return []
  }
}

export async function criarUnidade(data: NovaUnidade) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    if (!data.nome.trim()) return { success: false, error: 'Informe o nome da unidade.' }

    const admin = createAdminClient()

    // Slug único por escola
    let slug = data.slug?.trim() || gerarSlug(data.nome)
    let contador = 0
    const slugBase = slug
    while (true) {
      const { data: existente } = await admin
        .from('unidades')
        .select('id')
        .eq('escola_id', escola.id)
        .eq('slug', slug)
        .maybeSingle()
      if (!existente) break
      contador++
      slug = `${slugBase}-${contador}`
    }

    const { error } = await admin.from('unidades').insert({
      escola_id: escola.id,
      nome: data.nome,
      slug,
      endereco: data.endereco || null,
      cidade: data.cidade || null,
      estado: data.estado || null,
      pais: data.pais || 'Brasil',
      telefone: data.telefone || null,
      email_contato: data.email_contato || null,
      responsavel_nome: data.responsavel_nome || null,
      responsavel_email: data.responsavel_email || null,
      observacoes: data.observacoes || null,
      ativa: true,
    })

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/unidades')
    return { success: true }
  } catch (e) {
    console.error('Erro ao criar unidade:', e)
    return { success: false, error: 'Erro ao criar unidade.' }
  }
}

export async function atualizarUnidade(id: string, data: Partial<NovaUnidade> & { ativa?: boolean }) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()

    const payload: Record<string, any> = { atualizado_em: new Date().toISOString() }
    if (data.nome !== undefined) payload.nome = data.nome
    if (data.endereco !== undefined) payload.endereco = data.endereco || null
    if (data.cidade !== undefined) payload.cidade = data.cidade || null
    if (data.estado !== undefined) payload.estado = data.estado || null
    if (data.pais !== undefined) payload.pais = data.pais || null
    if (data.telefone !== undefined) payload.telefone = data.telefone || null
    if (data.email_contato !== undefined) payload.email_contato = data.email_contato || null
    if (data.responsavel_nome !== undefined) payload.responsavel_nome = data.responsavel_nome || null
    if (data.responsavel_email !== undefined) payload.responsavel_email = data.responsavel_email || null
    if (data.observacoes !== undefined) payload.observacoes = data.observacoes || null
    if (data.ativa !== undefined) payload.ativa = data.ativa

    const { error } = await admin
      .from('unidades')
      .update(payload)
      .eq('id', id)
      .eq('escola_id', escola.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/unidades')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao atualizar unidade.' }
  }
}

export async function excluirUnidade(id: string) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()

    // Confirma que a unidade é da escola
    const { data: unidade } = await admin
      .from('unidades')
      .select('id')
      .eq('id', id)
      .eq('escola_id', escola.id)
      .maybeSingle()

    if (!unidade) return { success: false, error: 'Unidade não encontrada.' }

    // Conta dependentes
    const { count: cAlunos } = await admin
      .from('alunos')
      .select('*', { count: 'exact', head: true })
      .eq('unidade_id', id)

    const { count: cUsuarios } = await admin
      .from('perfis')
      .select('*', { count: 'exact', head: true })
      .eq('unidade_id', id)

    if ((cAlunos && cAlunos > 0) || (cUsuarios && cUsuarios > 0)) {
      return {
        success: false,
        error: `Existem ${cAlunos || 0} alunos e ${cUsuarios || 0} usuários vinculados. Mova-os para outra unidade ou desative esta em vez de excluir.`,
      }
    }

    const { error } = await admin
      .from('unidades')
      .delete()
      .eq('id', id)
      .eq('escola_id', escola.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/unidades')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao excluir unidade.' }
  }
}

export async function alternarAtivaUnidade(id: string, ativa: boolean) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const { error } = await admin
      .from('unidades')
      .update({ ativa, atualizado_em: new Date().toISOString() })
      .eq('id', id)
      .eq('escola_id', escola.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/unidades')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro.' }
  }
}