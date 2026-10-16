'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getEscolaDoUsuario, getEscolaDaRequisicao } from '@/lib/auth/escola-atual'
import { normalizarConteudo, type ConteudoHome } from './defaults'
import { revalidatePath } from 'next/cache'

export async function getConteudoHomeAdmin(): Promise<ConteudoHome> {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return normalizarConteudo(null)

    const admin = createAdminClient()
    const { data } = await admin
      .from('escolas')
      .select('conteudo_home')
      .eq('id', escola.id)
      .maybeSingle()

    return normalizarConteudo(data?.conteudo_home)
  } catch (e) {
    console.error('Erro ao buscar conteúdo:', e)
    return normalizarConteudo(null)
  }
}

export async function getConteudoHomePublico(): Promise<ConteudoHome> {
  try {
    const escola = await getEscolaDaRequisicao()
    if (!escola) return normalizarConteudo(null)

    const admin = createAdminClient()
    const { data } = await admin
      .from('escolas')
      .select('conteudo_home')
      .eq('id', escola.id)
      .maybeSingle()

    return normalizarConteudo(data?.conteudo_home)
  } catch (e) {
    return normalizarConteudo(null)
  }
}

export async function salvarConteudoHome(conteudo: ConteudoHome) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const { error } = await admin
      .from('escolas')
      .update({ conteudo_home: conteudo, atualizado_em: new Date().toISOString() })
      .eq('id', escola.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/site')
    revalidatePath('/escola')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao salvar.' }
  }
}

export async function atualizarFontePar(fontePar: string) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const { error } = await admin
      .from('escolas')
      .update({ fonte_par: fontePar, atualizado_em: new Date().toISOString() })
      .eq('id', escola.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/site')
    revalidatePath('/escola')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao atualizar fonte.' }
  }
}