'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getEscolaDaRequisicao } from '@/lib/auth/escola-atual'
import { revalidatePath } from 'next/cache'

export type ProdutoLoja = { id: string; nome: string; descricao: string | null; categoria: string; preco_centavos: number; estoque: number; variacoes: any[] }
export type ItemCarrinho = { produto_id: string; variacao_id?: string; produto_nome: string; quantidade: number; preco_unitario_centavos: number; tamanho?: string; cor?: string; sku?: string }
export type PedidoResponsavel = { id: string; total_centavos: number; status: string; observacao: string | null; criado_em: string; itens: Array<{ produto_nome: string; quantidade: number; preco_unitario_centavos: number; tamanho?: string; cor?: string }> }

export async function getProdutosLoja(): Promise<ProdutoLoja[]> {
  try {
    const escola = await getEscolaDaRequisicao()
    if (!escola) return []
    const admin = createAdminClient()

    const { data: produtos, error } = await admin
      .from('produtos')
      .select('id, nome, descricao, categoria, preco_centavos, estoque')
      .eq('escola_id', escola.id)
      .eq('ativo', true)
      .order('nome', { ascending: true })

    if (error || !produtos) return []

    const idsProdutos = produtos.map(p => p.id)
    let variacoes: any[] = []

    if (idsProdutos.length > 0) {
      const { data: vars } = await admin
        .from('produto_variacoes')
        .select('*')
        .in('produto_id', idsProdutos)
      variacoes = (vars || [])
    }

    return produtos.map(p => ({
      ...p,
      variacoes: variacoes.filter(v => v.produto_id === p.id)
    })) as ProdutoLoja[]
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
    
    const escola = escolaBase as any // Para aceitar taxa_loja_bps
    const admin = createAdminClient()
    
    // Pega o nome do responsável
    const { data: perfil } = await admin.from('perfis').select('nome').eq('email', user.email).maybeSingle()
    const nomeResponsavel = perfil?.nome || user.email.split('@')[0]
    
    // Cálculo dos valores
    const totalCentavos = itens.reduce((s, i) => s + i.quantidade * i.preco_unitario_centavos, 0)
    
    // Cálculo da taxa da ARXUM (ex: 500 bps = 5%)
    const taxaBps = escola.taxa_loja_bps || 500
    const taxaArxumCentavos = Math.round((totalCentavos * taxaBps) / 10000)

    // 1. Cria o pedido
    const { data: pedido, error: erroPedido } = await admin.from('pedidos').insert({
      escola_id: escola.id,
      responsavel_email: user.email,
      responsavel_nome: nomeResponsavel,
      total_centavos: totalCentavos,
      taxa_arxum_centavos: taxaArxumCentavos,
      observacao: observacao || null,
      status: 'pendente'
    }).select('id').single()

    if (erroPedido || !pedido) return { success: false, error: 'Erro ao criar pedido.' }

    // 2. Salva os itens (com as variações)
    await admin.from('pedido_itens').insert(
      itens.map((i) => ({
        pedido_id: pedido.id,
        produto_id: i.produto_id,
        variacao_id: i.variacao_id || null,
        produto_nome: i.produto_nome,
        quantidade: i.quantidade,
        preco_unitario_centavos: i.preco_unitario_centavos,
        sku: i.sku || null,
        tamanho: i.tamanho || null,
        cor: i.cor || null,
      }))
    )

    // 3. Fluxo de pagamento
    let linkPagamento = null

    // Regra de Negócio: Se a escola usa Mercado Pago (Split)
    if (escola.gateway_preferido === 'mercadopago' && escola.mercadopago_user_id && process.env.MERCADOPAGO_ACCESS_TOKEN) {
      // AQUI É O SPLIT: Usa o token do Marketplace (ARXUM) e o collector_id da escola
      const body = {
        items: itens.map(i => ({ 
          id: i.produto_id, 
          title: `${i.produto_nome} ${i.tamanho ? `(${i.tamanho})` : ''} ${i.cor ? `- ${i.cor}` : ''}`.trim(), 
          quantity: i.quantidade, 
          currency_id: 'BRL', 
          unit_price: i.preco_unitario_centavos / 100 
        })),
        payer: { email: user.email, name: nomeResponsavel },
        external_reference: pedido.id,
        marketplace_fee: taxaArxumCentavos / 100, // A TAXA DA ARXUM RETIDA AQUI
        notification_url: `https://www.arxum.com.br/edu/api/webhooks/mercadopago`,
        back_urls: { success: `https://www.arxum.com.br/edu/loja/${escola.slug}`, failure: `https://www.arxum.com.br/edu/loja/${escola.slug}`, pending: `https://www.arxum.com.br/edu/loja/${escola.slug}` },
        auto_return: 'approved',
      }
      
      const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`, // Token da ARXUM
          'Content-Type': 'application/json',
          'X-Idempotency-Key': pedido.id
        },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      
      if (res.ok && data.init_point) {
        linkPagamento = data.init_point
        await admin.from('pedidos').update({ pagarme_payment_url: data.init_point, gateway: 'mercadopago' }).eq('id', pedido.id)
      }
    } 
    // Regra de Negócio: Gateway Próprio (a escola cobra e repassa depois)
    else {
      // Se a escola tiver um link de pagamento fixo ou usar outro gateway que não seja configurado diretamente aqui
      // A escola dará baixa manual no pedido ou o sistema gera um PIX próprio.
      // Neste caso, o status fica 'pendente' e a taxa fica gravada para o fechamento.
    }

    revalidatePath('/admin/loja')
    revalidatePath('/responsavel')
    return { success: true, pedidoId: pedido.id, linkPagamento }
  } catch (e) {
    console.error(e)
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
      const { data } = await admin.from('pedido_itens').select('pedido_id, produto_nome, quantidade, preco_unitario_centavos, tamanho, cor').in('pedido_id', idsPedidos)
      itens = (data || [])
    }

    return pedidos.map((p) => ({
      id: p.id, total_centavos: p.total_centavos, status: p.status, observacao: p.observacao, criado_em: p.criado_em,
      itens: itens.filter((i) => i.pedido_id === p.id).map((i) => ({ produto_nome: i.produto_nome, quantidade: i.quantidade, preco_unitario_centavos: i.preco_unitario_centavos, tamanho: i.tamanho, cor: i.cor }))
    })) as PedidoResponsavel[]
  } catch (e) { return [] }
}