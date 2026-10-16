'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getEscolaDoUsuario, getEscolaDaRequisicao } from '@/lib/auth/escola-atual'
import {
  normalizarConteudo,
  normalizarPaginas,
  type ConteudoHome,
  type ConteudoPaginas,
} from './defaults'
import { revalidatePath } from 'next/cache'

// ── HOME ────────────────────────────────────────────────────────────

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

// ── PÁGINAS INTERNAS ────────────────────────────────────────────────

export async function getConteudoPaginasAdmin(): Promise<ConteudoPaginas> {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return normalizarPaginas(null)

    const admin = createAdminClient()
    const { data } = await admin
      .from('escolas')
      .select('conteudo_paginas')
      .eq('id', escola.id)
      .maybeSingle()

    return normalizarPaginas(data?.conteudo_paginas)
  } catch (e) {
    return normalizarPaginas(null)
  }
}

export async function getConteudoPaginasPublico(): Promise<ConteudoPaginas> {
  try {
    const escola = await getEscolaDaRequisicao()
    if (!escola) return normalizarPaginas(null)

    const admin = createAdminClient()
    const { data } = await admin
      .from('escolas')
      .select('conteudo_paginas')
      .eq('id', escola.id)
      .maybeSingle()

    return normalizarPaginas(data?.conteudo_paginas)
  } catch (e) {
    return normalizarPaginas(null)
  }
}

export async function salvarConteudoPaginas(conteudo: ConteudoPaginas) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const { error } = await admin
      .from('escolas')
      .update({ conteudo_paginas: conteudo, atualizado_em: new Date().toISOString() })
      .eq('id', escola.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/site')
    revalidatePath('/escola')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao salvar.' }
  }
}

// ── CONTATO ─────────────────────────────────────────────────────────

export type MensagemInput = {
  nome: string
  email: string
  telefone: string
  assunto: string
  mensagem: string
}

export async function enviarMensagemContato(data: MensagemInput) {
  try {
    const escola = await getEscolaDaRequisicao()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const { error } = await admin.from('mensagens_contato').insert({
      escola_id: escola.id,
      nome: data.nome,
      email: data.email,
      telefone: data.telefone || null,
      assunto: data.assunto || null,
      mensagem: data.mensagem,
    })

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/mensagens')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao enviar mensagem.' }
  }
}

// ── MENSAGENS (ADMIN) ───────────────────────────────────────────────

export type Mensagem = {
  id: string
  nome: string
  email: string
  telefone: string | null
  assunto: string | null
  mensagem: string
  lida: boolean
  respondida: boolean
  criado_em: string
}

export async function getMensagens(): Promise<Mensagem[]> {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return []

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('mensagens_contato')
      .select('id, nome, email, telefone, assunto, mensagem, lida, respondida, criado_em')
      .eq('escola_id', escola.id)
      .order('criado_em', { ascending: false })

    if (error) return []
    return (data || []) as Mensagem[]
  } catch (e) {
    return []
  }
}

export async function marcarMensagemLida(id: string, lida: boolean) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const { error } = await admin
      .from('mensagens_contato')
      .update({ lida })
      .eq('id', id)
      .eq('escola_id', escola.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/mensagens')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao atualizar.' }
  }
}

export async function marcarMensagemRespondida(id: string) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const { error } = await admin
      .from('mensagens_contato')
      .update({ respondida: true, lida: true })
      .eq('id', id)
      .eq('escola_id', escola.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/mensagens')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao atualizar.' }
  }
}

export async function excluirMensagem(id: string) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const { error } = await admin
      .from('mensagens_contato')
      .delete()
      .eq('id', id)
      .eq('escola_id', escola.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/mensagens')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao excluir.' }
  }
}