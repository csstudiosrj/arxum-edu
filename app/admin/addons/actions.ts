'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getEscolaDoUsuario } from '@/lib/auth/escola-atual'
import { revalidatePath } from 'next/cache'

export type AddonEscola = {
  slug: string
  nome: string
  descricao: string | null
  preco_centavos: number
  preco_por_aluno_centavos: number
  ativo: boolean
}

export async function getAddonsDaEscola(): Promise<{ addons: AddonEscola[], totalAlunos: number }> {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { addons: [], totalAlunos: 0 }

    const admin = createAdminClient()

    // 1. Pega os add-ons globais ativos
    const { data: addonsGlobais } = await admin.from('addons').select('*').eq('ativo', true).order('nome')

    // 2. Pega os add-ons que a escola já ativou
    const { data: addonsEscola } = await admin.from('escolas_addons').select('addon_slug, ativo').eq('escola_id', escola.id)

    // 3. Conta os alunos ativos
    const { count: totalAlunos } = await admin.from('alunos').select('*', { count: 'exact', head: true }).eq('escola_id', escola.id).eq('status', 'ativo')

    if (!addonsGlobais) return { addons: [], totalAlunos: 0 }

    const mapAddons = addonsGlobais.map((a: any) => {
      const ativacao = addonsEscola?.find((ea: any) => ea.addon_slug === a.slug)
      return {
        slug: a.slug,
        nome: a.nome,
        descricao: a.descricao,
        preco_centavos: a.preco_centavos || 0,
        preco_por_aluno_centavos: a.preco_por_aluno_centavos || 0,
        ativo: ativacao?.ativo || false
      }
    })

    return { addons: mapAddons, totalAlunos: totalAlunos || 0 }
  } catch (e) {
    return { addons: [], totalAlunos: 0 }
  }
}

export async function alternarAddon(slug: string, ativar: boolean) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()

    const { data: existente } = await admin.from('escolas_addons').select('id').eq('escola_id', escola.id).eq('addon_slug', slug).maybeSingle()

    if (existente) {
      await admin.from('escolas_addons').update({ 
        ativo: ativar, 
        ativo_desde: ativar ? new Date().toISOString().split('T')[0] : null, 
        desativado_em: ativar ? null : new Date().toISOString().split('T')[0] 
      }).eq('id', existente.id)
    } else if (ativar) {
      await admin.from('escolas_addons').insert({ escola_id: escola.id, addon_slug: slug, ativo: true })
    }

    revalidatePath('/admin/addons')
    revalidatePath('/admin/configuracoes')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao alterar add-on.' }
  }
}
