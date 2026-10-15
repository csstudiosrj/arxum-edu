'use server'

import { createAdminClient } from '@/lib/supabase/admin'
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

async function getEscolaId(): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin.from('escolas').select('id').eq('slug', 'colegio-horizonte').single()
  return data?.id || null
}

export async function getProdutos(): Promise<Produto[]> {
  try {
    const admin = createAdminClient()
    const escolaId = await getEscolaId()
    if (!escolaId) return []

    const { data, error } = await admin
      .from('produtos')
      .select('id, nome, descricao, categoria, preco_centavos, estoque, ativo, criado_em')
      .eq('escola_id', escolaId)
      .order('criado_em', { ascending: false })

    if (error) return []
    return (data || []) as Produto[]
  } catch (e) {
    return []
  }
}

export async function getPedidos(): Promise<Pedido[]> {
  try {
    const admin = createAdminClient()
    const escolaId = await getEscolaId()
    if (!escolaId) return []

    const { data: pedidos, error } = await admin
      .from('pedidos')
      .select('id, responsavel_email, responsavel_nome, total_centavos, status, observacao, criado_em')
      .eq('escola_id', escolaId)
      .order('criado_em', { ascending: false })

    if (error || !pedidos) return []

    const { data: itens } = await admin
      .from('pedido_itens')
      .select('pedido_id, produto_nome, quantidade, preco_unitario_centavos')
      .in('pedido_id', pedidos.map((p) => p.id))

    return pedidos.map((p) => ({
      id: p.id,
      responsavel_email: p.responsavel_email,
      responsavel_nome: p.responsavel_nome,
      total_centavos: p.total_centavos,
      status: p.status,
      observacao: p.observacao,
      criado_em: p.criado_em,
      itens: (itens || [])
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
    const admin = createAdminClient()
    const escolaId = await getEscolaId()
    if (!escolaId) return { success: false, error: 'Escola não encontrada.' }

    const { error } = await admin.from('produtos').insert({
      escola_id: escolaId,
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

export async function atualizarStatusPedido(id: string, novoStatus: string) {
  try {
    const admin = createAdminClient()
    const { error } = await admin
      .from('pedidos')
      .update({ status: novoStatus, atualizado_em: new Date().toISOString() })
      .eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/loja')
    revalidatePath('/responsavel')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao atualizar.' }
  }
}

export async function excluirProduto(id: string) {
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('produtos').delete().eq('id', id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/loja')
    revalidatePath('/loja')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao excluir.' }
  }
}