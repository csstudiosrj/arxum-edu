'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getEscolaDoUsuario } from '@/lib/auth/escola-atual'
import { revalidatePath } from 'next/cache'

// ... (Mantenha os tipos Produto, NovoProduto, Pedido iguais)

export async function getProdutos(): Promise<Produto[]> { /* ... mantenha igual ... */ }
export async function getPedidos(): Promise<Pedido[]> { /* ... mantenha igual ... */ }
export async function criarProduto(data: NovoProduto) { /* ... mantenha igual ... */ }
export async function atualizarProduto(id: string, data: NovoProduto) { /* ... mantenha igual ... */ }
export async function alternarAtivoProduto(id: string, ativo: boolean) { /* ... mantenha igual ... */ }
export async function excluirProduto(id: string) { /* ... mantenha igual ... */ }

// 👇 ATUALIZADO AQUI 👇
export async function atualizarStatusPedido(id: string, novoStatus: string) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    
    // 1. Atualiza o status do pedido
    const { data: pedido, error } = await admin
      .from('pedidos')
      .update({ status: novoStatus, atualizado_em: new Date().toISOString() })
      .eq('id', id)
      .eq('escola_id', escola.id)
      .select('total_centavos')
      .single()

    if (error) return { success: false, error: error.message }

    // 2. Se o status mudou para 'pago', calcula e registra a taxa da ARXUM
    if (novoStatus === 'pago') {
      // Verifica se a taxa já não foi gerada para este pedido
      const { data: taxaExistente } = await admin
        .from('taxas_geradas')
        .select('id')
        .eq('referencia_id', id)
        .eq('tipo', 'loja')
        .maybeSingle()

      if (!taxaExistente) {
        // Busca a escola e as configurações de monetização
        const { data: escolaData } = await admin
          .from('escolas')
          .select('mercadopago_access_token')
          .eq('id', escola.id)
          .single()

        const { data: monetizacao } = await admin
          .from('configuracoes_monetizacao')
          .select('taxa_loja_padrao_bps, taxa_loja_mp_bps')
          .limit(1)
          .maybeSingle()

        const temMpConectado = !!escolaData?.mercadopago_access_token
        const taxaBps = temMpConectado 
          ? (monetizacao?.taxa_loja_mp_bps || 0) 
          : (monetizacao?.taxa_loja_padrao_bps || 0)

        const valorTaxaCentavos = Math.round(pedido.total_centavos * (taxaBps / 10000))

        if (valorTaxaCentavos > 0) {
          await admin.from('taxas_geradas').insert({
            escola_id: escola.id,
            tipo: 'loja',
            referencia_id: id,
            valor_base_centavos: pedido.total_centavos,
            percentual_aplicado_bps: taxaBps,
            taxa_centavos: valorTaxaCentavos,
            status: temMpConectado ? 'split_automatico' : 'pendente'
          })
        }
      }
    }

    revalidatePath('/admin/loja')
    revalidatePath('/responsavel')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao atualizar.' }
  }
}
