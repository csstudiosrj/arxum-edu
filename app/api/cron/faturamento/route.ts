import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Segurança do Cron
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const admin = createAdminClient()
  const hoje = new Date()
  
  try {
    // 1. Busca escolas com vencimento para hoje
    const { data: escolas } = await admin
      .from('escolas')
      .select('id, nome, plano, ciclo_cobranca_taxas')
      .eq('status_assinatura', 'ativa')
      .eq('data_vencimento', hoje.toISOString().split('T')[0])

    if (!escolas || escolas.length === 0) return NextResponse.json({ ok: true, geradas: 0 })

    let faturasGeradas = 0

    for (const escola of escolas) {
      // Pega preço base do plano
      const { data: plano } = await admin.from('planos').select('preco_centavos').eq('slug', escola.plano).single()
      const valorBase = plano?.preco_centavos || 0

      let totalTaxas = 0
      let idsTaxas: string[] = []

      // Se for para juntar as taxas, calcula tudo
      if (escola.ciclo_cobranca_taxas === 'junto_assinatura') {
        const { data: taxas } = await admin.from('taxas_geradas').select('id, taxa_centavos').eq('escola_id', escola.id).eq('status', 'pendente')
        if (taxas) {
          totalTaxas = taxas.reduce((acc, t) => acc + t.taxa_centavos, 0)
          idsTaxas = taxas.map(t => t.id)
        }
      }

      // Calcula add-ons (alunos * preco_addon)
      const { count: totalAlunos } = await admin.from('alunos').select('*', { count: 'exact', head: true }).eq('escola_id', escola.id).eq('status', 'ativo')
      const { data: addons } = await admin.from('escolas_addons').select('addons(preco_por_aluno_centavos)').eq('escola_id', escola.id).eq('ativo', true)
      
      let totalAddons = 0
      if (addons) {
        addons.forEach((a: any) => {
          const preco = Array.isArray(a.addons) ? a.addons[0]?.preco_por_aluno_centavos : a.addons?.preco_por_aluno_centavos
          if (preco) totalAddons += preco * (totalAlunos || 0)
        })
      }

      const valorTotal = valorBase + totalTaxas + totalAddons
      if (valorTotal <= 0) continue

      const descricao = escola.ciclo_cobranca_taxas === 'junto_assinatura' && totalTaxas > 0
        ? `Mensalidade + Taxas e Add-ons - ${hoje.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`
        : `Mensalidade Plano ${escola.plano} - ${hoje.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`

      // Cria a fatura
      const { data: fatura } = await admin.from('faturamento_escolas').insert({
        escola_id: escola.id,
        escola_nome: escola.nome,
        descricao,
        valor_centavos: valorTotal,
        vencimento: hoje.toISOString().split('T')[0],
        periodo_referencia: hoje.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
        status: 'em_aberto',
        aviso_d3_enviado: false,
        aviso_d1_enviado: false
      }).select('id').single()

      if (fatura) {
        faturasGeradas++
        
        // Marca as taxas como faturadas
        if (idsTaxas.length > 0) {
          await admin.from('taxas_geradas').update({ status: 'faturado' }).in('id', idsTaxas)
        }

        // (Opcional) Aqui você pode disparar um e-mail ou notificação avisando que a fatura foi gerada.
      }
    }

    return NextResponse.json({ ok: true, geradas: faturasGeradas })
  } catch (e: any) {
    console.error('Erro no cron de faturamento:', e)
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
