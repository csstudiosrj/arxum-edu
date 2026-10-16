'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export type Notificacao = {
  id: string
  tipo: 'comunicado' | 'autorizacao' | 'ocorrencia' | 'fatura' | 'matricula' | 'nota' | 'evento' | 'mensagem'
  titulo: string
  descricao: string
  data: string
  href: string
  lida: boolean
}

export type ResultadoNotificacoes = {
  total: number
  itens: Notificacao[]
}

async function getEmailUsuario(): Promise<{ email: string | null; userId: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { email: user?.email || null, userId: user?.id || null }
}

export async function getNotificacoesAdmin(): Promise<ResultadoNotificacoes> {
  const vazio: ResultadoNotificacoes = { total: 0, itens: [] }
  try {
    const { userId } = await getEmailUsuario()
    if (!userId) return vazio

    const admin = createAdminClient()

    const { data: perfil } = await admin
      .from('perfis')
      .select('escola_id')
      .eq('id', userId)
      .maybeSingle()

    if (!perfil?.escola_id) return vazio
    const escolaId = perfil.escola_id

    const itens: Notificacao[] = []

    // Matrículas em análise
    const { data: matriculas } = await admin
      .from('inscricoes')
      .select('id, protocolo, aluno_nome, criado_em')
      .eq('escola_id', escolaId)
      .in('status', ['inscrito', 'em_analise'])
      .order('criado_em', { ascending: false })
      .limit(5)

    ;(matriculas || []).forEach((m) => {
      itens.push({
        id: `mat-${m.id}`,
        tipo: 'matricula',
        titulo: 'Matrícula aguardando análise',
        descricao: `${m.aluno_nome} — protocolo ${m.protocolo}`,
        data: m.criado_em,
        href: '/admin/matriculas',
        lida: false,
      })
    })

    // Ocorrências não lidas recentes
    const { data: ocorrencias } = await admin
      .from('ocorrencias')
      .select('id, aluno_nome, titulo, gravidade, criado_em')
      .eq('escola_id', escolaId)
      .eq('lida', false)
      .order('criado_em', { ascending: false })
      .limit(3)

    ;(ocorrencias || []).forEach((o) => {
      itens.push({
        id: `oco-${o.id}`,
        tipo: 'ocorrencia',
        titulo: `${o.titulo}`,
        descricao: `${o.aluno_nome} · ${o.gravidade === 'alta' ? 'Alta gravidade' : 'Registrada'}`,
        data: o.criado_em,
        href: '/admin/ocorrencias',
        lida: false,
      })
    })

    // Faturas vencidas
    const { data: faturas } = await admin
      .from('faturas')
      .select('id, aluno_nome, descricao, vencimento')
      .eq('escola_id', escolaId)
      .eq('status', 'vencido')
      .order('vencimento', { ascending: true })
      .limit(3)

    ;(faturas || []).forEach((f) => {
      itens.push({
        id: `fat-${f.id}`,
        tipo: 'fatura',
        titulo: 'Fatura vencida',
        descricao: `${f.aluno_nome} — ${f.descricao}`,
        data: f.vencimento,
        href: '/admin/financeiro',
        lida: false,
      })
    })

    // Mensagens de contato não lidas
    const { data: mensagens } = await admin
      .from('mensagens_contato')
      .select('id, nome, assunto, criado_em')
      .eq('escola_id', escolaId)
      .eq('lida', false)
      .order('criado_em', { ascending: false })
      .limit(3)

    ;(mensagens || []).forEach((m) => {
      itens.push({
        id: `msg-${m.id}`,
        tipo: 'mensagem',
        titulo: 'Nova mensagem de contato',
        descricao: `${m.nome}${m.assunto ? ` — ${m.assunto}` : ''}`,
        data: m.criado_em,
        href: '/admin/mensagens',
        lida: false,
      })
    })

    itens.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

    return { total: itens.length, itens: itens.slice(0, 10) }
  } catch (e) {
    console.error('Erro ao buscar notificações admin:', e)
    return vazio
  }
}

export async function getNotificacoesResponsavel(): Promise<ResultadoNotificacoes> {
  const vazio: ResultadoNotificacoes = { total: 0, itens: [] }
  try {
    const { email } = await getEmailUsuario()
    if (!email) return vazio

    const admin = createAdminClient()
    const itens: Notificacao[] = []

    // Comunicados não lidos
    const { data: coms } = await admin
      .from('comunicados')
      .select('id, titulo, setor, criado_em')
      .eq('ativo', true)
      .order('criado_em', { ascending: false })
      .limit(10)

    const idsCom = (coms || []).map((c) => c.id)
    let lidosSet = new Set<string>()
    if (idsCom.length > 0) {
      const { data: leituras } = await admin
        .from('comunicados_leituras')
        .select('comunicado_id')
        .eq('responsavel_email', email)
        .in('comunicado_id', idsCom)
      lidosSet = new Set((leituras || []).map((l) => l.comunicado_id))
    }

    ;(coms || []).filter((c) => !lidosSet.has(c.id)).slice(0, 5).forEach((c) => {
      itens.push({
        id: `com-${c.id}`,
        tipo: 'comunicado',
        titulo: c.titulo,
        descricao: `Comunicado de ${c.setor}`,
        data: c.criado_em,
        href: '/responsavel',
        lida: false,
      })
    })

    // Autorizações pendentes
    const { data: auts } = await admin
      .from('autorizacoes')
      .select('id, titulo, criado_em')
      .eq('ativo', true)
      .order('criado_em', { ascending: false })
      .limit(10)

    const { data: respostas } = await admin
      .from('autorizacoes_respostas')
      .select('autorizacao_id')
      .eq('responsavel_email', email)

    const respondidasSet = new Set((respostas || []).map((r) => r.autorizacao_id))

    ;(auts || []).filter((a) => !respondidasSet.has(a.id)).slice(0, 5).forEach((a) => {
      itens.push({
        id: `aut-${a.id}`,
        tipo: 'autorizacao',
        titulo: 'Autorização pendente',
        descricao: a.titulo,
        data: a.criado_em,
        href: '/responsavel',
        lida: false,
      })
    })

    // Ocorrências não lidas
    const { data: ocos } = await admin
      .from('ocorrencias')
      .select('id, aluno_nome, titulo, criado_em')
      .eq('responsavel_email', email)
      .eq('lida', false)
      .order('criado_em', { ascending: false })
      .limit(5)

    ;(ocos || []).forEach((o) => {
      itens.push({
        id: `oco-${o.id}`,
        tipo: 'ocorrencia',
        titulo: 'Ocorrência registrada',
        descricao: `${o.aluno_nome} — ${o.titulo}`,
        data: o.criado_em,
        href: '/responsavel',
        lida: false,
      })
    })

    // Faturas em aberto/vencidas
    const hoje = new Date().toISOString().split('T')[0]
    const { data: faturas } = await admin
      .from('faturas')
      .select('id, aluno_nome, descricao, vencimento, status')
      .eq('responsavel_email', email)
      .in('status', ['em_aberto', 'vencido'])
      .order('vencimento', { ascending: true })
      .limit(5)

    ;(faturas || []).forEach((f) => {
      itens.push({
        id: `fat-${f.id}`,
        tipo: 'fatura',
        titulo: f.status === 'vencido' ? 'Fatura vencida' : 'Fatura em aberto',
        descricao: `${f.descricao} · vence ${new Date(f.vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}`,
        data: f.vencimento,
        href: '/responsavel',
        lida: false,
      })
    })

    itens.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

    return { total: itens.length, itens: itens.slice(0, 12) }
  } catch (e) {
    console.error('Erro ao buscar notificações responsável:', e)
    return vazio
  }
}

export async function getNotificacoesAluno(): Promise<ResultadoNotificacoes> {
  const vazio: ResultadoNotificacoes = { total: 0, itens: [] }
  try {
    const { email, userId } = await getEmailUsuario()
    if (!email || !userId) return vazio

    const admin = createAdminClient()

    // Busca o aluno
    const { data: aluno } = await admin
      .from('alunos')
      .select('id, escola_id, nome')
      .eq('usuario_id', userId)
      .maybeSingle()

    if (!aluno) return vazio

    const itens: Notificacao[] = []

    // Comunicados não lidos
    const { data: coms } = await admin
      .from('comunicados')
      .select('id, titulo, setor, criado_em')
      .eq('escola_id', aluno.escola_id)
      .eq('ativo', true)
      .order('criado_em', { ascending: false })
      .limit(10)

    const idsCom = (coms || []).map((c) => c.id)
    let lidosSet = new Set<string>()
    if (idsCom.length > 0) {
      const { data: leituras } = await admin
        .from('comunicados_leituras')
        .select('comunicado_id')
        .eq('responsavel_email', email)
        .in('comunicado_id', idsCom)
      lidosSet = new Set((leituras || []).map((l) => l.comunicado_id))
    }

    ;(coms || []).filter((c) => !lidosSet.has(c.id)).slice(0, 5).forEach((c) => {
      itens.push({
        id: `com-${c.id}`,
        tipo: 'comunicado',
        titulo: c.titulo,
        descricao: `Comunicado de ${c.setor}`,
        data: c.criado_em,
        href: '/aluno/comunicados',
        lida: false,
      })
    })

    // Próximas provas (eventos tipo prova nos próximos 7 dias)
    const em7dias = new Date()
    em7dias.setDate(em7dias.getDate() + 7)
    const hoje = new Date().toISOString().split('T')[0]
    const limite = em7dias.toISOString().split('T')[0]

    const { data: provas } = await admin
      .from('eventos')
      .select('id, titulo, data_evento, hora_evento')
      .eq('escola_id', aluno.escola_id)
      .eq('ativo', true)
      .eq('tipo', 'prova')
      .gte('data_evento', hoje)
      .lte('data_evento', limite)
      .order('data_evento', { ascending: true })
      .limit(5)

    ;(provas || []).forEach((p) => {
      itens.push({
        id: `pro-${p.id}`,
        tipo: 'evento',
        titulo: 'Prova se aproximando',
        descricao: `${p.titulo}${p.hora_evento ? ` às ${p.hora_evento}` : ''}`,
        data: p.data_evento,
        href: '/aluno/agenda',
        lida: false,
      })
    })

    itens.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

    return { total: itens.length, itens: itens.slice(0, 10) }
  } catch (e) {
    console.error('Erro ao buscar notificações aluno:', e)
    return vazio
  }
}

export async function getNotificacoesProfessor(): Promise<ResultadoNotificacoes> {
  const vazio: ResultadoNotificacoes = { total: 0, itens: [] }
  try {
    const { userId, email } = await getEmailUsuario()
    if (!userId) return vazio

    const admin = createAdminClient()
    const { data: perfil } = await admin
      .from('perfis')
      .select('escola_id, nome')
      .eq('id', userId)
      .maybeSingle()

    if (!perfil?.escola_id) return vazio

    const itens: Notificacao[] = []

    // Próximos eventos da escola
    const hoje = new Date().toISOString().split('T')[0]
    const { data: eventos } = await admin
      .from('eventos')
      .select('id, titulo, data_evento, hora_evento')
      .eq('escola_id', perfil.escola_id)
      .eq('ativo', true)
      .gte('data_evento', hoje)
      .order('data_evento', { ascending: true })
      .limit(5)

    ;(eventos || []).forEach((e) => {
      itens.push({
        id: `evt-${e.id}`,
        tipo: 'evento',
        titulo: e.titulo,
        descricao: `${new Date(e.data_evento + 'T12:00:00').toLocaleDateString('pt-BR')}${e.hora_evento ? ` às ${e.hora_evento}` : ''}`,
        data: e.data_evento,
        href: '/professor',
        lida: false,
      })
    })

    // Ocorrências recentes registradas por outros (visão geral)
    const { data: ocos } = await admin
      .from('ocorrencias')
      .select('id, aluno_nome, titulo, criado_em')
      .eq('escola_id', perfil.escola_id)
      .order('criado_em', { ascending: false })
      .limit(3)

    ;(ocos || []).forEach((o) => {
      itens.push({
        id: `oco-${o.id}`,
        tipo: 'ocorrencia',
        titulo: 'Ocorrência recente',
        descricao: `${o.aluno_nome} — ${o.titulo}`,
        data: o.criado_em,
        href: '/professor/ocorrencias',
        lida: false,
      })
    })

    itens.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

    return { total: itens.length, itens: itens.slice(0, 10) }
  } catch (e) {
    console.error('Erro ao buscar notificações professor:', e)
    return vazio
  }
}