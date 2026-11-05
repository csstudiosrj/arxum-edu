'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getEscolaDoUsuario } from '@/lib/auth/escola-atual'
import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'

export type Produto = { id: string; nome: string; descricao: string | null; categoria: string; preco_centavos: number; estoque: number; ativo: boolean; criado_em: string }
export type NovoProduto = { nome: string; descricao: string; categoria: string; preco_centavos: number; estoque: number }
export type Pedido = { id: string; responsavel_email: string; responsavel_nome: string; total_centavos: number; status: string; observacao: string | null; criado_em: string; itens: Array<{ produto_nome: string; quantidade: number; preco_unitario_centavos: number }> }
export type ItemCarrinho = { produto_id: string; produto_nome: string; quantidade: number; preco_unitario_centavos: number }
export type ProdutoLoja = { id: string; nome: string; descricao: string | null; categoria: string; preco_centavos: number; estoque: number }
export type PedidoResponsavel = { id: string; total_centavos: number; status: string; observacao: string | null; criado_em: string; itens: Array<{ produto_nome: string; quantidade: number; preco_unitario_centavos: number }> }

// ── FUNÇÕES DO ADMIN (Gestão da Escola) ──────────────────────────────

export async function getProdutos(): Promise<Produto[]> {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return []
    const admin = createAdminClient()
    const { data, error } = await admin.from('produtos').select('id, nome, descricao, categoria, preco_centavos, estoque, ativo, criado_em').eq('escola_id', escola.id).order('criado_em', { ascending: false })
    if (error) return []
    return (data || []) as Produto[]
  } catch (e) { return [] }
}

export async function getPedidos(): Promise<Pedido[]> {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return []
    const admin = createAdminClient()
    const { data: pedidos, error } = await admin.from('pedidos').select('id, responsavel_email, responsavel_nome, total_centavos, status, observacao, criado_em').eq('escola_id', escola.id).order('criado_em', { ascending: false })
    if (error || !pedidos) return []
    const idsPedidos = pedidos.map((p) => p.id)
    let itens: any[] = []
    if (idsPedidos.length > 0) {
      const { data } = await admin.from('pedido_itens').select('pedido_id, produto_nome, quantidade, preco_unitario_centavos').in('pedido_id', idsPedidos)
      itens = (data || [])
    }
    return pedidos.map((p) => ({
      id: p.id, responsavel_email: p.responsavel_email, responsavel_nome: p.responsavel_nome, total_centavos: p.total_centavos, status: p.status, observacao: p.observacao, criado_em: p.criado_em,
      itens: itens.filter((i) => i.pedido_id === p.id).map((i) => ({ produto_nome: i.produto_nome, quantidade: i.quantidade, preco_unitario_centavos: i.preco_unitario_centavos }))
    })) as Pedido[]
  } catch (e) { return [] }
}

export async function criarProduto(data: NovoProduto) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }
    const admin = createAdminClient()
    const { error } = await admin.from('produtos').insert({ escola_id: escola.id, nome: data.nome, descricao: data.descricao || null, categoria: data.categoria, preco_centavos: data.preco_centavos, estoque: data.estoque })
    if (error) return { success: false, error: error.message }
    revalidatePath('/admin/loja'); revalidatePath('/loja')
    return { success: true }
  } catch (e) { return { success: false, error: 'Erro ao criar produto.' } }
}

export async function atualizarProduto(id: string, data: NovoProduto) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }
    const admin = createAdminClient()
    const { error } = await admin.from('produtos').update({ nome: data.nome, descricao: data.descricao || null, categoria: data.categoria, preco_centavos: data.preco_centavos, estoque: data.estoque, atualizado_em: new Date().toISOString() }).eq('id', id).eq('escola_id', escola.id)
    if (error) return { success: false, error: error.message }
    revalidatePath('/admin/loja'); revalidatePath('/loja')
    return { success: true }
  } catch (e) { return { success: false, error: 'Erro ao atualizar produto.' } }
}

export async function alternarAtivoProduto(id: string, ativo: boolean) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }
    const admin = createAdminClient()
    const { error } = await admin.from('produtos').update({ ativo, atualizado_em: new Date().toISOString() }).eq('id', id).eq('escola_id', escola.id)
    if (error) return { success: false, error: error.message }
    revalidatePath('/admin/loja'); revalidatePath('/loja')
    return { success: true }
  } catch (e) { return { success: false, error: 'Erro ao atualizar status.' } }
}

export async function atualizarStatusPedido(id: string, novoStatus: string) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }
    const admin = createAdminClient()
    
    const { data: pedido, error } = await admin.from('pedidos').update({ status: novoStatus, atualizado_em: new Date().toISOString() }).eq('id', id).eq('escola_id', escola.id).select('responsavel_email, responsavel_nome, total_centavos').single()
    if (error) return { success: false, error: error.message }

    // Envio de E-mail Automático ao mudar status
    const slugsEmail: Record<string, string> = { pago: 'pedido_pago', enviado: 'pedido_enviado', disponivel_retirada: 'pedido_retirada' }
    const templateSlug = slugsEmail[novoStatus]

    if (templateSlug && process.env.RESEND_API_KEY) {
      const { data: template } = await admin.from('email_templates').select('*').eq('slug', templateSlug).single()
      if (template && pedido.responsavel_email) {
        const resend = new Resend(process.env.RESEND_API_KEY)
        let html = template.corpo_html
        let assunto = template.assunto
        const vars: Record<string, string> = { '{{nome_escola}}': escola.nome, '{{nome_responsavel}}': pedido.responsavel_nome, '{{valor}}': `R$ ${(pedido.total_centavos / 100).toFixed(2).replace('.', ',')}` }
        Object.entries(vars).forEach(([k, v]) => { html = html.split(k).join(v); assunto = assunto.split(k).join(v) })
        await resend.emails.send({ from: 'ARXUM Edu <financeiro@arxum.com.br>', to: pedido.responsavel_email, subject: assunto, html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5ecee; border-radius: 12px; overflow: hidden;"><div style="background-color: #0d9488; padding: 24px; text-align: center;"><h1 style="color: white; margin: 0;">ARXUM Edu</h1></div><div style="padding: 32px;">${html}</div></div>` })
      }
    }

    revalidatePath('/admin/loja'); revalidatePath('/responsavel')
    return { success: true }
  } catch (e) { return { success: false, error: 'Erro ao atualizar.' } }
}

export async function excluirProduto(id: string) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }
    const admin = createAdminClient()
    const { error } = await admin.from('produtos').delete().eq('id', id).eq('escola_id', escola.id)
    if (error) return { success: false, error: error.message }
    revalidatePath('/admin/loja'); revalidatePath('/loja')
    return { success: true }
  } catch (e) { return { success: false, error: 'Erro ao excluir.' } }
}

// ── FUNÇÕES DO RESPONSÁVEL (Vitrine Pública) ──────────────────────────

export async function getProdutosLoja(): Promise<ProdutoLoja[]> {
  try {
    const escola = await getEscolaDoUsuario()
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
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }
    const admin = createAdminClient()
    const { data: perfil } = await admin.from('perfis').select('nome').eq('email', user.email).maybeSingle()
    const nomeResponsavel = perfil?.nome || user.email.split('@')[0]
    const totalCentavos = itens.reduce((s, i) => s + i.quantidade * i.preco_unitario_centavos, 0)

    const { data: pedido, error: erroPedido } = await admin.from('pedidos').insert({ escola_id: escola.id, responsavel_email: user.email, responsavel_nome: nomeResponsavel, total_centavos: totalCentavos, observacao: observacao || null, status: 'pendente' }).select('id').single()
    if (erroPedido || !pedido) return { success: false, error: 'Erro ao criar pedido.' }

    await admin.from('pedido_itens').insert(itens.map((i) => ({ pedido_id: pedido.id, produto_id: i.produto_id, produto_nome: i.produto_nome, quantidade: i.quantidade, preco_unitario_centavos: i.preco_unitario_centavos })))

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
      const res = await fetch('https://api.mercadopago.com/checkout/preferences', { method: 'POST', headers: { 'Authorization': `Bearer ${escola.mercadopago_access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (res.ok && data.init_point) {
        linkPagamento = data.init_point
        await admin.from('pedidos').update({ checkout_url: data.init_point }).eq('id', pedido.id)
      }
    }

    revalidatePath('/admin/loja'); revalidatePath('/responsavel')
    return { success: true, pedidoId: pedido.id, linkPagamento }
  } catch (e) { return { success: false, error: 'Erro ao finalizar compra.' } }
}

export async function getMeusPedidos(): Promise<PedidoResponsavel[]> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return []
    const escola = await getEscolaDoUsuario()
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
