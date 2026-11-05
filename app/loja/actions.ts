'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getEscolaDaRequisicao } from '@/lib/auth/escola-atual'
import { revalidatePath } from 'next/cache'

export type ProdutoLoja = { id: string; nome: string; descricao: string | null; categoria: string; preco_centavos: number; estoque: number }
export type ItemCarrinho = { produto_id: string; produto_nome: string; quantidade: number; preco_unitario_centavos: number }
export type PedidoResponsavel = { id: string; total_centavos: number; status: string; observacao: string | null; criado_em: string; itens: Array<{ produto_nome: string; quantidade: number; preco_unitario_centavos: number }> }

export async function getProdutosLoja(): Promise<ProdutoLoja[]> {
  try {
    const escola = await getEscolaDaRequisicao()
    if (!escola) return []
    const admin = createAdminClient()
    const { data, error } = await admin.from('produtos').select('id, nome, descricao, categoria, preco_centavos, estoque').eq('escola_id', escola.id).eq('ativo', true).order('nome', { ascending: true })
    if (error) return []
    return (data || []) as ProdutoLoja[]
  } catch (e) { return [] }
}

export async function criarPedido(itens: ItemCarrinho[], observacao: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return { success: false, error: 'Faça login para finalizar a compra.' }
    if (itens.length === 0) return { success: false, error: 'Carrinho vazio.' }
    
    const escolaBase = await getEscolaDaRequisicao()
    if (!escolaBase) return { success: false, error: 'Escola não encontrada.' }
    
    // Correção do TypeScript: Cast para any para aceitar a coluna nova
    const escola = escolaBase as any

    const admin = createAdminClient()
    const { data: perfil } = await admin.from('perfis').select('nome').eq('email', user.email).maybeSingle()
    const nomeResponsavel = perfil?.nome || user.email.split('@')[0]
    const totalCentavos = itens.reduce((s, i) => s + i.quantidade * i.preco_unitario_centavos, 0)

    // 1. Cria o pedido
    const { data: pedido, error: erroPedido } = await admin.from('pedidos').insert({
      escola_id: escola.id,
      responsavel_email: user.email,
      responsavel_nome: nomeResponsavel,
      total_centavos: totalCentavos,
      observacao: observacao || null,
      status: 'pendente'
    }).select('id').single()

    if (erroPedido || !pedido) return { success: false, error: 'Erro ao criar pedido.' }

    // 2. Salva os itens
    await admin.from('pedido_itens').insert(
      itens.map((i) => ({
        pedido_id: pedido.id,
        produto_id: i.produto_id,
        produto_nome: i.produto_nome,
        quantidade: i.quantidade,
        preco_unitario_centavos: i.preco_unitario_centavos,
      }))
    )

    // 3. Se a escola tiver Mercado Pago conectado, gera o link
    let linkPagamento = null
    if (escola.mercadopago_access_token) {
      const baseUrl = 'https://www.arxum.com.br'
      const body = {
        items: itens.map(i => ({ id: i.produto_id, title: i.produto_nome, quantity: i.quantidade, currency_id: 'BRL', unit_price: i.preco_unitario_centavos / 100 })),
        payer: { email: user.email, name: nomeResponsavel },
        external_reference: pedido.id,
        notification_url: `${baseUrl}/edu/api/webhooks/mercadopago`,
        back_urls: { success: `${baseUrl}/edu/loja/${escola.slug}`, failure: `${baseUrl}/edu/loja/${escola.slug}`, pending: `${baseUrl}/edu/loja/${escola.slug}` },
        auto_return: 'approved',
      }
      
      const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${escola.mercadopago_access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      
      if (res.ok && data.init_point) {
        linkPagamento = data.init_point
        await admin.from('pedidos').update({ checkout_url: data.init_point }).eq('id', pedido.id)
      }
    }

    revalidatePath('/admin/loja')
    revalidatePath('/responsavel')
    return { success: true, pedidoId: pedido.id, linkPagamento }
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
    const { data: pedidos } = await admin.from('pedidos').select('id, total_centavos, status, observacao, criado_em').eq('responsavel_email', user.email).eq('escola_id', escola.id).order('criado_em', { ascending: false })
    if (!pedidos) return []

    const idsPedidos = pedidos.map((p) => p.id)
    let itens: any[] = []
    if (idsPedidos.length > 0) {
      const { data } = await admin.from('pedido_itens').select('pedido_id, produto_nome, quantidade, preco_unitario_centavos').in('pedido_id', idsPedidos)
      itens = (data || [])
    }

    return pedidos.map((p) => ({
      id: p.id, total_centavos: p.total_centavos, status: p.status, observacao: p.observacao, criado_em: p.criado_em,
      itens: itens.filter((i) => i.pedido_id === p.id).map((i) => ({ produto_nome: i.produto_nome, quantidade: i.quantidade, preco_unitario_centavos: i.preco_unitario_centavos }))
    })) as PedidoResponsavel[]
  } catch (e) { return [] }
}
