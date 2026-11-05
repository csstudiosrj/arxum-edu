import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { criarNotificacaoSuper } from '@/app/super-admin/notificacoes-actions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (body.type === 'payment' || body.action?.includes('payment')) {
      const paymentId = body.data?.id
      if (!paymentId) return NextResponse.json({ ok: true })

      const token = process.env.MERCADOPAGO_ACCESS_TOKEN
      if (!token) return NextResponse.json({ ok: false }, { status: 500 })

      const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const pagamento = await res.json()

      if (pagamento.status === 'approved') {
        const admin = createAdminClient()
        const ref = pagamento.external_reference

        // 1. É uma cobrança de Assinatura ARXUM (Super Admin)?
        // A assinatura recorrente manda o preapproval_id no metadata.
        if (pagamento.metadata?.preapproval_id) {
          const preapprovalId = pagamento.metadata.preapproval_id
          const { data: escola } = await admin.from('escolas').select('id, nome, plano').eq('mercadopago_preapproval_id', preapprovalId).single()
          
          if (escola) {
            const { data: plano } = await admin.from('planos').select('preco_centavos').eq('slug', escola.plano).single()
            const valorCentavos = plano?.preco_centavos || (pagamento.transaction_amount * 100)
            
            await admin.from('faturamento_escolas').insert({
              escola_id: escola.id,
              escola_nome: escola.nome,
              descricao: 'Assinatura ARXUM (Recorrente)',
              valor_centavos: valorCentavos,
              vencimento: new Date().toISOString().split('T')[0],
              periodo_referencia: new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
              status: 'pago',
              gateway: 'mercadopago',
              gateway_payment_id: pagamento.id.toString(),
              gateway_status: 'approved',
              pago_em: new Date().toISOString(),
              data_pagamento: new Date().toISOString(),
              aviso_d3_enviado: true,
              aviso_d1_enviado: true
            })

            await criarNotificacaoSuper('financeiro', 'Assinatura Renovada', `A assinatura de ${escola.nome} foi cobrada com sucesso.`, '/super-admin/financeiro')
          }
          return NextResponse.json({ ok: true })
        }

        if (!ref) return NextResponse.json({ ok: true })

        // 2. É uma fatura da ARXUM (gerada manualmente pelo Super Admin)?
        const { data: faturaArxum } = await admin.from('faturamento_escolas').select('id, escola_nome').eq('id', ref).maybeSingle()
        if (faturaArxum) {
          await admin.from('faturamento_escolas').update({
            status: 'pago', pago_em: new Date().toISOString(), data_pagamento: new Date().toISOString(), gateway_status: 'approved'
          }).eq('id', faturaArxum.id)
          
          await criarNotificacaoSuper('financeiro', 'Pagamento Recebido', `A escola ${faturaArxum.escola_nome} pagou a fatura ARXUM.`, '/super-admin/financeiro')
          return NextResponse.json({ ok: true })
        }

        // 3. É uma Mensalidade de Aluno? (Tabela faturas)
        const { data: faturaAluno } = await admin.from('faturas').select('id, escola_id, valor_centavos, aluno_nome, descricao').eq('id', ref).maybeSingle()
        if (faturaAluno) {
          await admin.from('faturas').update({
            status: 'pago', pago_em: new Date().toISOString(), gateway_status: 'approved'
          }).eq('id', faturaAluno.id)

          // Gera a taxa ARXUM
          const { data: escolaData } = await admin.from('escolas').select('mercadopago_access_token, nome').eq('id', faturaAluno.escola_id).single()
          const { data: monetizacao } = await admin.from('configuracoes_monetizacao').select('taxa_mensalidade_padrao_bps, taxa_mensalidade_mp_bps').limit(1).maybeSingle()

          const temMp = !!escolaData?.mercadopago_access_token
          const taxaBps = temMp ? (monetizacao?.taxa_mensalidade_mp_bps || 0) : (monetizacao?.taxa_mensalidade_padrao_bps || 0)
          const valorTaxa = Math.round(faturaAluno.valor_centavos * (taxaBps / 10000))

          if (valorTaxa > 0) {
            await admin.from('taxas_geradas').insert({
              escola_id: faturaAluno.escola_id, tipo: 'mensalidade', referencia_id: faturaAluno.id,
              valor_base_centavos: faturaAluno.valor_centavos, percentual_aplicado_bps: taxaBps, taxa_centavos: valorTaxa,
              status: temMp ? 'split_automatico' : 'pendente'
            })
          }

          await criarNotificacaoSuper('financeiro', 'Mensalidade Paga', `${escolaData?.nome} recebeu o pagamento de ${faturaAluno.aluno_nome}.`, '/super-admin/financeiro')
          return NextResponse.json({ ok: true })
        }

        // 4. É uma compra na Loja? (Tabela pedidos)
        const { data: pedido } = await admin.from('pedidos').select('id, escola_id, total_centavos').eq('id', ref).maybeSingle()
        if (pedido) {
          // Atualiza o pedido para pago
          await admin.from('pedidos').update({ status: 'pago', atualizado_em: new Date().toISOString() }).eq('id', pedido.id)

          // Dá baixa no estoque
          const { data: itens } = await admin.from('pedido_itens').select('produto_id, quantidade').eq('pedido_id', pedido.id)
          if (itens) {
            for (const item of itens) {
              if (item.produto_id) {
                const { data: prod } = await admin.from('produtos').select('estoque').eq('id', item.produto_id).single()
                if (prod) {
                  await admin.from('produtos').update({ estoque: Math.max(0, prod.estoque - item.quantidade) }).eq('id', item.produto_id)
                }
              }
            }
          }

          // Gera a taxa ARXUM
          const { data: escolaData } = await admin.from('escolas').select('mercadopago_access_token, nome').eq('id', pedido.escola_id).single()
          const { data: monetizacao } = await admin.from('configuracoes_monetizacao').select('taxa_loja_padrao_bps, taxa_loja_mp_bps').limit(1).maybeSingle()

          const temMp = !!escolaData?.mercadopago_access_token
          const taxaBps = temMp ? (monetizacao?.taxa_loja_mp_bps || 0) : (monetizacao?.taxa_loja_padrao_bps || 0)
          const valorTaxa = Math.round(pedido.total_centavos * (taxaBps / 10000))

          if (valorTaxa > 0) {
            await admin.from('taxas_geradas').insert({
              escola_id: pedido.escola_id, tipo: 'loja', referencia_id: pedido.id,
              valor_base_centavos: pedido.total_centavos, percentual_aplicado_bps: taxaBps, taxa_centavos: valorTaxa,
              status: temMp ? 'split_automatico' : 'pendente'
            })
          }

          await criarNotificacaoSuper('financeiro', 'Venda na Loja', `A escola ${escolaData?.nome} realizou uma venda.`, '/super-admin/financeiro')
          return NextResponse.json({ ok: true })
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Erro no webhook:', e)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
