'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getEscolaDaRequisicao } from '@/lib/auth/escola-atual'
import { revalidatePath } from 'next/cache'

export type ProdutoLoja = {
  id: string
  nome: string
  descricao: string | null
  categoria: string
  preco_centavos: number
  estoque: number
}

export type ItemCarrinho = {
  produto_id: string
  produto_nome: string
  quantidade: number
  preco_unitario_centavos: number
}

export type PedidoResponsavel = {
  id: string
  total_centavos: number
  status: string
  observacao: string | null
  criado_em: string
  itens: Array<{ produto_nome: string; quantidade: number; preco_unitario_centavos: number }>
}

export async function getProdutosLoja(): Promise<ProdutoLoja[]> {
  try {
    const escola = await getEscolaDaRequisicao()
    if (!escola) return []

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('produtos')
      .select('id, nome, descricao, categoria, preco_centavos, estoque')
      .eq('escola_id', escola.id)
      .eq('ativo', true)
      .order('nome', { ascending: true })

    if (error) return []
    return (data || []) as ProdutoLoja[]
  } catch (e) {
    return []
  }
}

export async function criarPedido(itens: ItemCarrinho[], observacao: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return { success: false, error: 'Faça login para finalizar a compra.' }

    if (itens.length === 0) return { success: false, error: 'Carrinho vazio.' }

    const escola = await getEscolaDaRequisicao()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()

    const { data: perfil } = await admin
      .from('perfis')
      .select('nome')
      .eq('email', user.email)
      .maybeSingle()

    const nomeResponsavel = perfil?.nome || user.email.split('@')[0]
    const totalCentavos = itens.reduce((s, i) => s + i.quantidade * i.preco_unitario_centavos, 0)

    const { data: pedido, error: erroPedido } = await admin
      .from('pedidos')
      .insert({
        escola_id: escola.id,
        responsavel_email: user.email,
        responsavel_nome: nomeResponsavel,
        total_centavos: totalCentavos,
        observacao: observacao || null,
      })
      .select('id')
      .single()

    if (erroPedido || !pedido) return { success: false, error: 'Erro ao criar pedido.' }

    const { error: erroItens } = await admin.from('pedido_itens').insert(
      itens.map((i) => ({
        pedido_id: pedido.id,
        produto_id: i.produto_id,
        produto_nome: i.produto_nome,
        quantidade: i.quantidade,
        preco_unitario_centavos: i.preco_unitario_centavos,
      }))
    )

    if (erroItens) return { success: false, error: 'Erro ao salvar itens do pedido.' }

    revalidatePath('/admin/loja')
    revalidatePath('/responsavel')
    return { success: true, pedidoId: pedido.id }
  } catch (e) {
    return { success: false, error: 'Erro ao finalizar compra.' }
  }
}

export async function getMeusPedidos(): Promise<PedidoResponsavel[]> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return []

    const escola = await getEscolaDaRequisicao()
    if (!escola) return []

    const admin = createAdminClient()
    const { data: pedidos, error } = await admin
      .from('pedidos')
      .select('id, total_centavos, status, observacao, criado_em')
      .eq('responsavel_email', user.email)
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
    })) as PedidoResponsavel[]
  } catch (e) {
    return []
  }
}