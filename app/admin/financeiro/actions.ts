'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getEscolaDoUsuario } from '@/lib/auth/escola-atual'
import { notificarFaturaGerada } from '@/lib/emails/notificacoes'
import { enviarSeAtivo } from '@/lib/notificacoes-config-server'
import { criarOuAtualizarCliente, criarPedido, calcularSplitFatura } from '@/lib/pagarme'
import { revalidatePath } from 'next/cache'

export type Fatura = {
  id: string
  aluno_nome: string
  responsavel_email: string
  descricao: string
  valor_centavos: number
  vencimento: string
  status: string
  criado_em: string
  pagarme_qr_code_url: string | null
}

export type NovaFatura = {
  aluno_nome: string
  responsavel_email: string
  descricao: string
  valor_centavos: number
  vencimento: string
}

function formatarMoeda(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatarDataBR(iso: string): string {
  try {
    return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR')
  } catch {
    return iso
  }
}

export async function getFaturas(): Promise<Fatura[]> {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return []

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('faturas')
      .select('id, aluno_nome, responsavel_email, descricao, valor_centavos, vencimento, status, criado_em, pagarme_qr_code_url')
      .eq('escola_id', escola.id)
      .order('vencimento', { ascending: false })

    if (error) return []
    return (data || []) as Fatura[]
  } catch (e) {
    return []
  }
}

export async function criarFatura(data: NovaFatura) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const { data: escolaPagarme } = await admin
      .from('escolas')
      .select('pagarme_recipient_id, taxa_fatura_bps')
      .eq('id', escola.id)
      .single()

    if (!escolaPagarme?.pagarme_recipient_id) {
      return { success: false, error: 'A escola precisa configurar a Conta de Recebimento (Pagar.me) antes de gerar faturas.' }
    }

    // Cria/Atualiza cliente
    const clientePagarme = await criarOuAtualizarCliente({
      nome: data.aluno_nome + ' (Responsável)',
      email: data.responsavel_email,
    })

    if (!clientePagarme.success) {
      return { success: false, error: 'Erro ao criar cliente no Pagar.me: ' + clientePagarme.error }
    }

    // Gera o Pedido com Split
    const taxaArxum = escolaPagarme.taxa_fatura_bps || 200
    const split = calcularSplitFatura({
      taxaArxumBps: taxaArxum,
      recipientEscolaId: escolaPagarme.pagarme_recipient_id,
    })

    const pedidoPagarme = await criarPedido({
      code: `fat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      clienteId: clientePagarme.customerId,
      itens: [{ amount: data.valor_centavos, description: data.descricao, quantity: 1 }],
      metodo: { tipo: 'pix', expiresInSeconds: 3600 * 24 * 7 },
      split,
      metadata: { escola_id: escola.id, responsavel_email: data.responsavel_email }
    })

    if (!pedidoPagarme.success) {
      return { success: false, error: 'Erro ao gerar PIX no Pagar.me: ' + pedidoPagarme.error }
    }

    const { error } = await admin.from('faturas').insert({
      escola_id: escola.id,
      aluno_nome: data.aluno_nome,
      responsavel_email: data.responsavel_email,
      descricao: data.descricao,
      valor_centavos: data.valor_centavos,
      vencimento: data.vencimento,
      pagarme_order_id: pedidoPagarme.orderId,
      pagarme_qr_code: pedidoPagarme.qrCode,
      pagarme_qr_code_url: pedidoPagarme.qrCodeUrl,
      pagarme_status: pedidoPagarme.status,
    })

    if (error) return { success: false, error: error.message }

    try {
      if (data.responsavel_email) {
        enviarSeAtivo({
          escolaId: escola.id,
          evento: 'fatura',
          enviar: () =>
            notificarFaturaGerada({
              para: data.responsavel_email,
              escolaNome: escola.nome,
              escolaSlug: escola.slug,
              alunoNome: data.aluno_nome,
              descricao: data.descricao,
              valor: formatarMoeda(data.valor_centavos),
              vencimento: formatarDataBR(data.vencimento),
            }),
        }).catch((e) => console.error('[email fatura]', data.responsavel_email, e))
      }
    } catch (e) {}

    revalidatePath('/admin/financeiro')
    revalidatePath('/responsavel')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e) {
    console.error('Erro ao criar fatura:', e)
    return { success: false, error: 'Erro inesperado ao criar fatura.' }
  }
}

export async function atualizarStatusFatura(id: string, novoStatus: string) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const { error } = await admin
      .from('faturas')
      .update({ status: novoStatus, atualizado_em: new Date().toISOString() })
      .eq('id', id)
      .eq('escola_id', escola.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/financeiro')
    revalidatePath('/responsavel')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao atualizar.' }
  }
}

export async function excluirFatura(id: string) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const { error } = await admin.from('faturas').delete().eq('id', id).eq('escola_id', escola.id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/financeiro')
    revalidatePath('/responsavel')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao excluir.' }
  }
}

export async function getAlunosParaFatura(): Promise<Array<{ nome: string; responsavel_email: string }>> {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return []

    const admin = createAdminClient()
    const { data } = await admin
      .from('alunos')
      .select('nome, responsavel_email')
      .eq('escola_id', escola.id)
      .eq('status', 'ativo')
      .order('nome', { ascending: true })

    return (data || []) as Array<{ nome: string; responsavel_email: string }>
  } catch (e) {
    return []
  }
}