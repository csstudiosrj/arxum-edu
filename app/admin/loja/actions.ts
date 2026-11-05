'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getEscolaDoUsuario } from '@/lib/auth/escola-atual'
import { revalidatePath } from 'next/cache'

export type Produto = {
  id: string
  nome: string
  descricao: string | null
  categoria: string
  preco_centavos: number
  estoque: number
  ativo: boolean
  criado_em: string
}

export type NovoProduto = {
  nome: string
  descricao: string
  categoria: string
  preco_centavos: number
  estoque: number
}

export type Pedido = {
  id: string
  responsavel_email: string
  responsavel_nome: string
  total_centavos: number
  status: string
  observacao: string | null
  criado_em: string
  itens: Array<{ produto_nome: string; quantidade: number; preco_unitario_centavos: number }>
}

export async function getProdutos(): Promise<Produto[]> {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return []

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('produtos')
      .select('id, nome, descricao, categoria, preco_centavos, estoque, ativo, criado_em')
      .eq('escola_id', escola.id)
      .order('criado_em', { ascending: false })

    if (error) return []
    return (data || []) as Produto[]
  } catch (e) {
    return []
  }
}

export async function getPedidos(): Promise<Pedido[]> {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return []

    const admin = createAdminClient()
    const { data: pedidos, error } = await admin
      .from('pedidos')
      .select('id, responsavel_email, responsavel_nome, total_centavos, status, observacao, criado_em')
      .eq('escola_id', escola.id)
      .order('criado_em', { ascending: false })

    if (error || !pedidos) return []

    const idsPedidos = pedidos.map((p) => p.id)

    let itens: Array<{ pedido_id: string; produto_nome: string; quantidade: number; preco_unitario_centavos: number }> = []
    if (idsPedidos.length > 0) {
      const { data } = await admin
        .from('pedido_itens')
        .select('pedido_id, produto_nome, quantidade, preco_unitario_centavos')
        .in('pedido_id', idsPedidos)
      itens = (data || []) as typeof itens
    }

    return pedidos.map((p) => ({
      id: p.id,
      responsavel_email: p.responsavel_email,
      responsavel_nome: p.responsavel_nome,
      total_centavos: p.total_centavos,
      status: p.status,
      observacao: p.observacao,
      criado_em: p.criado_em,
      itens: itens
        .filter((i) => i.pedido_id === p.id)
        .map((i) => ({
          produto_nome: i.produto_nome,
          quantidade: i.quantidade,
          preco_unitario_centavos: i.preco_unitario_centavos,
        })),
    })) as Pedido[]
  } catch (e) {
    return []
  }
}

export async function criarProduto(data: NovoProduto) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const { error } = await admin.from('produtos').insert({
      escola_id: escola.id,
      nome: data.nome,
      descricao: data.descricao || null,
      categoria: data.categoria,
      preco_centavos: data.preco_centavos,
      estoque: data.estoque,
    })

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/loja')
    revalidatePath('/loja')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao criar produto.' }
  }
}

export async function atualizarProduto(id: string, data: NovoProduto) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const { error } = await admin
      .from('produtos')
      .update({
        nome: data.nome,
        descricao: data.descricao || null,
        categoria: data.categoria,
        preco_centavos: data.preco_centavos,
        estoque: data.estoque,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('escola_id', escola.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/loja')
    revalidatePath('/loja')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao atualizar produto.' }
  }
}

export async function alternarAtivoProduto(id: string, ativo: boolean) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const { error } = await admin
      .from('produtos')
      .update({ ativo, atualizado_em: new Date().toISOString() })
      .eq('id', id)
      .eq('escola_id', escola.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/loja')
    revalidatePath('/loja')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao atualizar status.' }
  }
}

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

    // 2. Se o status mudou para 'pago', calcula a taxa da ARXUM
    if (novoStatus === 'pago') {
      const { data: taxaExistente } = await admin
        .from('taxas_geradas')
        .select('id')
        .eq('referencia_id', id)
        .eq('tipo', 'loja')
        .maybeSingle()

      if (!taxaExistente) {
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

export async function excluirProduto(id: string) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const { error } = await admin.from('produtos').delete().eq('id', id).eq('escola_id', escola.id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/loja')
    revalidatePath('/loja')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao excluir.' }
  }
}
