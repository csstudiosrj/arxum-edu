'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getEscolaDoUsuario } from '@/lib/auth/escola-atual'
import { revalidatePath } from 'next/cache'

export type Fatura = {
  id: string
  escola_id: string
  aluno_id: string | null
  aluno_nome: string
  responsavel_email: string
  descricao: string
  valor_centavos: number
  vencimento: string
  status: string
  pago_em: string | null
  criado_em: string
  pagarme_qr_code?: string | null
  pagarme_qr_code_url?: string | null
  gateway?: string | null
  gateway_payment_id?: string | null
  gateway_status?: string | null
  metodo_pagamento?: string | null
  pix_copia_cola?: string | null
  pix_qr_imagem?: string | null
  pix_expira_em?: string | null
  boleto_linha?: string | null
  boleto_url?: string | null
}

export async function getFaturas(): Promise<Fatura[]> {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return []

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('faturas')
      .select('*')
      .eq('escola_id', escola.id)
      .order('criado_em', { ascending: false })

    if (error) return []
    return (data || []) as Fatura[]
  } catch (e) {
    return []
  }
}

export async function getAlunosParaFatura(): Promise<Array<{ id: string; nome: string; responsavel_email: string }>> {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return []

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('alunos')
      .select('id, nome, responsavel_email')
      .eq('escola_id', escola.id)
      .eq('status', 'ativo')
      .order('nome', { ascending: true })

    if (error) return []
    return (data || []) as Array<{ id: string; nome: string; responsavel_email: string }>
  } catch (e) {
    return []
  }
}

export async function criarFatura(data: {
  aluno_nome: string
  responsavel_email: string
  descricao: string
  valor_centavos: number
  vencimento: string
}) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    
    // Buscar o ID do aluno para vincular
    const { data: aluno } = await admin
      .from('alunos')
      .select('id')
      .eq('escola_id', escola.id)
      .eq('responsavel_email', data.responsavel_email)
      .limit(1)
      .maybeSingle()

    const { error } = await admin.from('faturas').insert({
      escola_id: escola.id,
      aluno_id: aluno?.id || null,
      aluno_nome: data.aluno_nome,
      responsavel_email: data.responsavel_email,
      descricao: data.descricao,
      valor_centavos: data.valor_centavos,
      vencimento: data.vencimento,
      status: 'em_aberto'
    })

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/financeiro')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao criar fatura.' }
  }
}

export async function excluirFatura(id: string) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const { error } = await admin
      .from('faturas')
      .delete()
      .eq('id', id)
      .eq('escola_id', escola.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/financeiro')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao excluir fatura.' }
  }
}
