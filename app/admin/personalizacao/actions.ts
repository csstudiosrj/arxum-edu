'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getEscolaDoUsuario } from '@/lib/auth/escola-atual'
import { revalidatePath } from 'next/cache'

export type AddonDisponivel = {
  id: string
  slug: string
  nome: string
  descricao: string | null
  preco_centavos: number
  ativo_para_escola: boolean
}

export async function getAddonsDaEscola(): Promise<AddonDisponivel[]> {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return []

    const admin = createAdminClient()

    const { data: addons } = await admin
      .from('addons')
      .select('id, slug, nome, descricao, preco_centavos')
      .eq('ativo', true)
      .order('ordem', { ascending: true })

    if (!addons) return []

    const { data: ativos } = await admin
      .from('escolas_addons')
      .select('addon_slug, ativo')
      .eq('escola_id', escola.id)
      .eq('ativo', true)

    const ativosSet = new Set((ativos || []).map((a) => a.addon_slug))

    return addons.map((a) => ({
      ...a,
      ativo_para_escola: ativosSet.has(a.slug),
    }))
  } catch (e) {
    return []
  }
}

export async function ativarAddon(slug: string) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()

    const { data: existente } = await admin
      .from('escolas_addons')
      .select('id')
      .eq('escola_id', escola.id)
      .eq('addon_slug', slug)
      .maybeSingle()

    if (existente) {
      const { error } = await admin
        .from('escolas_addons')
        .update({ ativo: true, ativo_desde: new Date().toISOString().split('T')[0], desativado_em: null })
        .eq('id', existente.id)
      if (error) return { success: false, error: error.message }
    } else {
      const { error } = await admin.from('escolas_addons').insert({
        escola_id: escola.id,
        addon_slug: slug,
        ativo: true,
      })
      if (error) return { success: false, error: error.message }
    }

    // Se for branding, ativa a flag na escola
    if (slug === 'branding') {
      await admin.from('escolas').update({ branding_portais: true }).eq('id', escola.id)
    }

    revalidatePath('/admin/personalizacao')
    revalidatePath('/admin/configuracoes')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao ativar add-on.' }
  }
}

export async function desativarAddon(slug: string) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()

    const { error } = await admin
      .from('escolas_addons')
      .update({ ativo: false, desativado_em: new Date().toISOString().split('T')[0] })
      .eq('escola_id', escola.id)
      .eq('addon_slug', slug)

    if (error) return { success: false, error: error.message }

    if (slug === 'branding') {
      await admin.from('escolas').update({ branding_portais: false }).eq('id', escola.id)
    }

    revalidatePath('/admin/personalizacao')
    revalidatePath('/admin/configuracoes')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao desativar add-on.' }
  }
}

export async function salvarIdentidade(data: {
  logo_url: string | null
  cor_primaria: string
}) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const { error } = await admin
      .from('escolas')
      .update({
        logo_url: data.logo_url,
        cor_primaria: data.cor_primaria,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', escola.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/personalizacao')
    revalidatePath('/admin/configuracoes')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao salvar identidade.' }
  }
}