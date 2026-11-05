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
        
        // 1. Se for pagamento de fatura avulsa (Mensalidade)
        if (pagamento.external_reference) {
          const faturaId = pagamento.external_reference
          
          const { data: fatura } = await admin.from('faturas').select('id, escola_id, valor_centavos, aluno_nome, descricao').eq('id', faturaId).maybeSingle()

          if (fatura) {
            // Atualiza a fatura
            await admin.from('faturas').update({
              status: 'pago',
              pago_em: new Date().toISOString(),
              gateway_status: 'approved'
            }).eq('id', fatura.id)

            // GERA A TAXA DA ARXUM (Mensalidade via PIX/Boleto)
            const { data: escolaData } = await admin.from('escolas').select('mercadopago_access_token, nome').eq('id', fatura.escola_id).single()
            const { data: monetizacao } = await admin.from('configuracoes_monetizacao').select('taxa_mensalidade_padrao_bps, taxa_mensalidade_mp_bps').limit(1).maybeSingle()

            const temMpConectado = !!escolaData?.mercadopago_access_token
            const taxaBps = temMpConectado ? (monetizacao?.taxa_mensalidade_mp_bps || 0) : (monetizacao?.taxa_mensalidade_padrao_bps || 0)
            const valorTaxaCentavos = Math.round(fatura.valor_centavos * (taxaBps / 10000))

            if (valorTaxaCentavos > 0) {
              await admin.from('taxas_geradas').insert({
                escola_id: fatura.escola_id,
                tipo: 'mensalidade',
                referencia_id: fatura.id,
                valor_base_centavos: fatura.valor_centavos,
                percentual_aplicado_bps: taxaBps,
                taxa_centavos: valorTaxaCentavos,
                status: temMpConectado ? 'split_automatico' : 'pendente'
              })
            }

            await criarNotificacaoSuper(
              'financeiro', 
              'Pagamento Recebido', 
              `${escolaData?.nome || 'Escola'} pagou a fatura de ${fatura.descricao}.`, 
              '/super-admin/financeiro'
            )
          }
        }
        
        // 2. Se for pagamento de Assinatura Recorrente (Preapproval)
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

            await criarNotificacaoSuper(
              'financeiro', 
              'Assinatura Renovada', 
              `A assinatura recorrente de ${escola.nome} foi cobrada com sucesso.`, 
              '/super-admin/financeiro'
            )
          }
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
