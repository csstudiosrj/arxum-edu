'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getEscolaDoUsuario } from '@/lib/auth/escola-atual'
import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'

export type Variacao = {
  id?: string
  sku: string
  tamanho: string
  cor: string
  estoque: number
}

export type Produto = {
  id: string
  nome: string
  descricao: string | null
  categoria: string
  preco_centavos: number
  estoque: number
  ativo: boolean
  criado_em: string
  variacoes?: Variacao[]
}

export type NovoProduto = {
  nome: string
  descricao: string
  categoria: string
  preco_centavos: number
  estoque: number
  variacoes: Variacao[]
}

export type Pedido = {
  id: string
  responsavel_email: string
  responsavel_nome: string
  total_centavos: number
  status: string
  observacao: string | null
  criado_em: string
  itens: Array<{ produto_nome: string; quantidade: number; preco_unitario_centavos: number; tamanho?: string; cor?: string }>
}

export async function getProdutos(): Promise<Produto[]> {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return []
    const admin = createAdminClient()
    
    const { data: produtos, error } = await admin
      .from('produtos')
      .select('id, nome, descricao, categoria, preco_centavos, estoque, ativo, criado_em')
      .eq('escola_id', escola.id)
      .order('criado_em', { ascending: false })

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
    })) as Produto[]
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
      const { data } = await admin.from('pedido_itens').select('pedido_id, produto_nome, quantidade, preco_unitario_centavos, tamanho, cor').in('pedido_id', idsPedidos)
      itens = (data || [])
    }
    
    return pedidos.map((p) => ({
      id: p.id, responsavel_email: p.responsavel_email, responsavel_nome: p.responsavel_nome, total_centavos: p.total_centavos, status: p.status, observacao: p.observacao, criado_em: p.criado_em,
      itens: itens.filter((i) => i.pedido_id === p.id).map((i) => ({ produto_nome: i.produto_nome, quantidade: i.quantidade, preco_unitario_centavos: i.preco_unitario_centavos, tamanho: i.tamanho, cor: i.cor }))
    })) as Pedido[]
  } catch (e) { return [] }
}

export async function criarProduto(data: NovoProduto) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }
    const admin = createAdminClient()

    // 1. Calcula o estoque total baseado nas variações (se houver) ou no valor direto
    const estoqueTotal = data.variacoes.length > 0 
      ? data.variacoes.reduce((acc, v) => acc + v.estoque, 0) 
      : data.estoque

    const { data: novo, error } = await admin.from('produtos').insert({ 
      escola_id: escola.id, 
      nome: data.nome, 
      descricao: data.descricao || null, 
      categoria: data.categoria, 
      preco_centavos: data.preco_centavos, 
      estoque: estoqueTotal 
    }).select('id').single()

    if (error || !novo) return { success: false, error: error?.message }

    // 2. Salva as variações
    if (data.variacoes.length > 0) {
      await admin.from('produto_variacoes').insert(
        data.variacoes.map(v => ({
          produto_id: novo.id,
          sku: v.sku || null,
          tamanho: v.tamanho || null,
          cor: v.cor || null,
          estoque: v.estoque
        }))
      )
    }

    revalidatePath('/admin/loja'); revalidatePath('/loja')
    return { success: true }
  } catch (e) { return { success: false, error: 'Erro ao criar produto.' } }
}

export async function atualizarProduto(id: string, data: NovoProduto) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }
    const admin = createAdminClient()

    const estoqueTotal = data.variacoes.length > 0 
      ? data.variacoes.reduce((acc, v) => acc + v.estoque, 0) 
      : data.estoque

    const { error } = await admin.from('produtos').update({ 
      nome: data.nome, 
      descricao: data.descricao || null, 
      categoria: data.categoria, 
      preco_centavos: data.preco_centavos, 
      estoque: estoqueTotal, 
      atualizado_em: new Date().toISOString() 
    }).eq('id', id).eq('escola_id', escola.id)

    if (error) return { success: false, error: error.message }

    // Estratégia de variações: apaga as antigas e recria (mais simples para o MVP)
    await admin.from('produto_variacoes').delete().eq('produto_id', id)
    if (data.variacoes.length > 0) {
      await admin.from('produto_variacoes').insert(
        data.variacoes.map(v => ({
          produto_id: id,
          sku: v.sku || null,
          tamanho: v.tamanho || null,
          cor: v.cor || null,
          estoque: v.estoque
        }))
      )
    }

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
        await resend.emails.send({ 
          from: 'ARXUM Edu <financeiro@arxum.com.br>', 
          to: pedido.responsavel_email, 
          subject: assunto, 
          html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5ecee; border-radius: 12px; overflow: hidden;"><div style="background-color: #0d9488; padding: 24px; text-align: center;"><h1 style="color: white; margin: 0;">ARXUM Edu</h1></div><div style="padding: 32px;">${html}</div></div>` 
        })
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