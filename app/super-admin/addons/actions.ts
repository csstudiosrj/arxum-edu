'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export type AddonAdmin = {
  id: string
  slug: string
  nome: string
  descricao: string | null
  preco_centavos: number
  ativo: boolean
  ordem: number
  total_escolas: number
  receita_centavos: number
}

export async function getAddonsAdmin(): Promise<AddonAdmin[]> {
  try {
    const admin = createAdminClient()

    const { data: addons } = await admin
      .from('addons')
      .select('*')
      .order('ordem', { ascending: true })

    if (!addons) return []

    const { data: ativacoes } = await admin
      .from('escolas_addons')
      .select('addon_slug, ativo')
      .eq('ativo', true)

    return addons.map((a) => {
      const ativos = (ativacoes || []).filter((e) => e.addon_slug === a.slug)
      const total = ativos.length
      return {
        id: a.id,
        slug: a.slug,
        nome: a.nome,
        descricao: a.descricao,
        preco_centavos: a.preco_centavos,
        ativo: a.ativo,
        ordem: a.ordem,
        total_escolas: total,
        receita_centavos: total * a.preco_centavos,
      }
    }) as AddonAdmin[]
  } catch (e) {
    return []
  }
}

export async function criarAddon(data: {
  slug: string
  nome: string
  descricao: string
  preco_centavos: number
}) {
  try {
    const admin = createAdminClient()

    if (!data.slug.trim()) return { success: false, error: 'Informe o slug.' }
    if (!data.nome.trim()) return { success: false, error: 'Informe o nome.' }

    const slugFormatado = data.slug.toLowerCase().replace(/[^a-z0-9_]/g, '_')

    const { data: existente } = await admin.from('addons').select('id').eq('slug', slugFormatado).maybeSingle()
    if (existente) return { success: false, error: 'Já existe um add-on com esse slug.' }

    const { data: maxOrdem } = await admin.from('addons').select('ordem').order('ordem', { ascending: false }).limit(1).maybeSingle()
    const proximaOrdem = (maxOrdem?.ordem || 0) + 1

    const { error } = await admin.from('addons').insert({
      slug: slugFormatado,
      nome: data.nome,
      descricao: data.descricao || null,
      preco_centavos: data.preco_centavos,
      ordem: proximaOrdem,
    })

    if (error) return { success: false, error: error.message }

    revalidatePath('/super-admin/addons')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao criar add-on.' }
  }
}

export async function atualizarAddon(id: string, data: {
  nome: string
  descricao: string
  preco_centavos: number
  ativo: boolean
}) {
  try {
    const admin = createAdminClient()
    const { error } = await admin
      .from('addons')
      .update({
        nome: data.nome,
        descricao: data.descricao || null,
        preco_centavos: data.preco_centavos,
        ativo: data.ativo,
      })
      .eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/super-admin/addons')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao atualizar add-on.' }
  }
}

export async function excluirAddon(id: string) {
  try {
    const admin = createAdminClient()

    const { data: addon } = await admin.from('addons').select('slug').eq('id', id).maybeSingle()
    if (!addon) return { success: false, error: 'Add-on não encontrado.' }

    const { count } = await admin
      .from('escolas_addons')
      .select('*', { count: 'exact', head: true })
      .eq('addon_slug', addon.slug)
      .eq('ativo', true)

    if (count && count > 0) {
      return { success: false, error: `${count} escolas usam esse add-on. Desative nelas antes de excluir.` }
    }

    const { error } = await admin.from('addons').delete().eq('id', id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/super-admin/addons')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao excluir add-on.' }
  }
}