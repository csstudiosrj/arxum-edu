'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getEscolaDoUsuario } from '@/lib/auth/escola-atual'

export type RelatorioData = {
  // Visão geral
  alunosAtivos: number
  alunosInativos: number
  totalAlunos: number
  turmasUnicas: number

  // Matrículas
  matriculasPorStatus: Array<{ status: string; total: number }>
  taxaConversao: number

  // Acadêmico
  mediaGeral: number | null
  distribuicaoNotas: { aprovados: number; recuperacao: number; reprovados: number; semNota: number }
  mediaPorDisciplina: Array<{ disciplina: string; media: number; total: number }>

  // Financeiro
  receitaTotal: number
  receitaEmAberto: number
  receitaVencida: number
  inadimplenciaPct: number

  // Comunicação
  totalComunicados: number
  totalLeituras: number
  engajamentoPct: number

  // Autorizações
  totalAutorizacoes: number
  totalRespostasAutorizacoes: number
  totalAutorizados: number
  engajamentoAutorizacoesPct: number

  // Ocorrências
  ocorrenciasPorTipo: Array<{ tipo: string; total: number }>
  ocorrenciasTotal: number

  // Loja
  pedidosPendentes: number
  pedidosPagos: number
  receitaLoja: number
}

export async function getRelatorioData(): Promise<RelatorioData> {
  const vazio: RelatorioData = {
    alunosAtivos: 0, alunosInativos: 0, totalAlunos: 0, turmasUnicas: 0,
    matriculasPorStatus: [], taxaConversao: 0,
    mediaGeral: null, distribuicaoNotas: { aprovados: 0, recuperacao: 0, reprovados: 0, semNota: 0 }, mediaPorDisciplina: [],
    receitaTotal: 0, receitaEmAberto: 0, receitaVencida: 0, inadimplenciaPct: 0,
    totalComunicados: 0, totalLeituras: 0, engajamentoPct: 0,
    totalAutorizacoes: 0, totalRespostasAutorizacoes: 0, totalAutorizados: 0, engajamentoAutorizacoesPct: 0,
    ocorrenciasPorTipo: [], ocorrenciasTotal: 0,
    pedidosPendentes: 0, pedidosPagos: 0, receitaLoja: 0,
  }

  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return vazio

    const escolaId = escola.id
    const admin = createAdminClient()

    // Alunos
    const { data: alunos } = await admin
      .from('alunos')
      .select('id, serie, status')
      .eq('escola_id', escolaId)

    const alunosAtivos = (alunos || []).filter((a) => a.status === 'ativo').length
    const alunosInativos = (alunos || []).filter((a) => a.status !== 'ativo').length
    const turmasUnicas = new Set((alunos || []).map((a) => a.serie).filter(Boolean)).size

    // Matrículas
    const { data: inscricoes } = await admin
      .from('inscricoes')
      .select('status')
      .eq('escola_id', escolaId)

    const statusCount: Record<string, number> = {}
    ;(inscricoes || []).forEach((i) => {
      statusCount[i.status] = (statusCount[i.status] || 0) + 1
    })
    const matriculasPorStatus = Object.entries(statusCount).map(([status, total]) => ({ status, total }))
    const totalInscricoes = inscricoes?.length || 0
    const aprovadasOuMatriculadas = (statusCount['aprovado'] || 0) + (statusCount['matriculado'] || 0)
    const taxaConversao = totalInscricoes > 0 ? Math.round((aprovadasOuMatriculadas / totalInscricoes) * 100) : 0

    // Notas
    const { data: notas } = await admin
      .from('notas')
      .select('disciplina, nota, faltas')
      .eq('escola_id', escolaId)

    const notasValidas = (notas || []).filter((n) => n.nota !== null)
    const mediaGeral = notasValidas.length > 0
      ? notasValidas.reduce((s, n) => s + (n.nota || 0), 0) / notasValidas.length
      : null

    const distribuicaoNotas = { aprovados: 0, recuperacao: 0, reprovados: 0, semNota: 0 }
    ;(notas || []).forEach((n) => {
      if (n.nota === null) distribuicaoNotas.semNota++
      else if (n.nota >= 7) distribuicaoNotas.aprovados++
      else if (n.nota >= 5) distribuicaoNotas.recuperacao++
      else distribuicaoNotas.reprovados++
    })

    const porDisciplina: Record<string, { soma: number; total: number }> = {}
    notasValidas.forEach((n) => {
      if (!porDisciplina[n.disciplina]) porDisciplina[n.disciplina] = { soma: 0, total: 0 }
      porDisciplina[n.disciplina].soma += n.nota || 0
      porDisciplina[n.disciplina].total += 1
    })
    const mediaPorDisciplina = Object.entries(porDisciplina)
      .map(([disciplina, v]) => ({ disciplina, media: v.soma / v.total, total: v.total }))
      .sort((a, b) => b.media - a.media)

    // Financeiro
    const { data: faturas } = await admin
      .from('faturas')
      .select('valor_centavos, status')
      .eq('escola_id', escolaId)

    const receitaTotal = (faturas || []).filter((f) => f.status === 'pago').reduce((s, f) => s + f.valor_centavos, 0)
    const receitaEmAberto = (faturas || []).filter((f) => f.status === 'em_aberto').reduce((s, f) => s + f.valor_centavos, 0)
    const receitaVencida = (faturas || []).filter((f) => f.status === 'vencido').reduce((s, f) => s + f.valor_centavos, 0)
    const totalFaturado = receitaTotal + receitaEmAberto + receitaVencida
    const inadimplenciaPct = totalFaturado > 0 ? Math.round((receitaVencida / totalFaturado) * 100) : 0

    // Comunicação
    const { data: coms } = await admin
      .from('comunicados')
      .select('id')
      .eq('escola_id', escolaId)
      .eq('ativo', true)

    const { data: leituras } = await admin
      .from('comunicados_leituras')
      .select('comunicado_id')

    const totalComunicados = coms?.length || 0
    const totalLeituras = (leituras || []).filter((l) => coms?.some((c) => c.id === l.comunicado_id)).length
    const totalAlunosAtivosNum = alunosAtivos || 1
    const engajamentoPct = totalComunicados > 0 ? Math.round((totalLeituras / (totalComunicados * totalAlunosAtivosNum)) * 100) : 0

    // Autorizações
    const { data: auts } = await admin
      .from('autorizacoes')
      .select('id')
      .eq('escola_id', escolaId)
      .eq('ativo', true)

    const { data: respostasAut } = await admin
      .from('autorizacoes_respostas')
      .select('autorizacao_id, resposta')

    const totalAutorizacoes = auts?.length || 0
    const respostasFiltradas = (respostasAut || []).filter((r) => auts?.some((a) => a.id === r.autorizacao_id))
    const totalRespostasAutorizacoes = respostasFiltradas.length
    const totalAutorizados = respostasFiltradas.filter((r) => r.resposta === 'autorizado').length
    const engajamentoAutorizacoesPct = totalAutorizacoes > 0 && totalAlunosAtivosNum > 0
      ? Math.round((totalRespostasAutorizacoes / (totalAutorizacoes * totalAlunosAtivosNum)) * 100)
      : 0

    // Ocorrências
    const { data: ocorrencias } = await admin
      .from('ocorrencias')
      .select('tipo')
      .eq('escola_id', escolaId)

    const ocorrenciasPorTipoMap: Record<string, number> = {}
    ;(ocorrencias || []).forEach((o) => {
      ocorrenciasPorTipoMap[o.tipo] = (ocorrenciasPorTipoMap[o.tipo] || 0) + 1
    })
    const ocorrenciasPorTipo = Object.entries(ocorrenciasPorTipoMap).map(([tipo, total]) => ({ tipo, total }))

    // Loja
    const { data: pedidos } = await admin
      .from('pedidos')
      .select('total_centavos, status')
      .eq('escola_id', escolaId)

    const pedidosPendentes = (pedidos || []).filter((p) => p.status === 'pendente').length
    const pedidosPagos = (pedidos || []).filter((p) => p.status === 'pago' || p.status === 'entregue').length
    const receitaLoja = (pedidos || []).filter((p) => p.status === 'pago' || p.status === 'entregue').reduce((s, p) => s + p.total_centavos, 0)

    return {
      alunosAtivos,
      alunosInativos,
      totalAlunos: alunos?.length || 0,
      turmasUnicas,
      matriculasPorStatus,
      taxaConversao,
      mediaGeral,
      distribuicaoNotas,
      mediaPorDisciplina,
      receitaTotal,
      receitaEmAberto,
      receitaVencida,
      inadimplenciaPct,
      totalComunicados,
      totalLeituras,
      engajamentoPct,
      totalAutorizacoes,
      totalRespostasAutorizacoes,
      totalAutorizados,
      engajamentoAutorizacoesPct,
      ocorrenciasPorTipo,
      ocorrenciasTotal: ocorrencias?.length || 0,
      pedidosPendentes,
      pedidosPagos,
      receitaLoja,
    }
  } catch (e) {
    console.error('Erro ao gerar relatório:', e)
    return vazio
  }
}