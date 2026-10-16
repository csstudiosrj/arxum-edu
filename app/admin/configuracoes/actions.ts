'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getEscolaDoUsuario, type EscolaCompleta } from '@/lib/auth/escola-atual'
import { revalidatePath } from 'next/cache'

export type DadosEscolaInput = {
  nome: string
  cnpj: string
  endereco: string
  cidade: string
  estado: string
  telefone: string
  email_contato: string
  site: string
}

export async function getDadosEscola(): Promise<EscolaCompleta | null> {
  return await getEscolaDoUsuario()
}

export async function salvarDadosEscola(data: DadosEscolaInput) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const { error } = await admin
      .from('escolas')
      .update({
        nome: data.nome,
        cnpj: data.cnpj || null,
        endereco: data.endereco || null,
        cidade: data.cidade || null,
        estado: data.estado || null,
        telefone: data.telefone || null,
        email_contato: data.email_contato || null,
        site: data.site || null,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', escola.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/configuracoes')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao salvar.' }
  }
}