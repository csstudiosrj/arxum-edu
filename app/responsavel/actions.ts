'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export type DocumentosMatricula = {
  rg_aluno?: { url: string; nome: string } | null
  cpf_responsavel?: { url: string; nome: string } | null
  comprovante_residencia?: { url: string; nome: string } | null
  historico_escolar?: { url: string; nome: string } | null
}

export type InscricaoResponsavel = {
  id: string
  protocolo: string
  aluno_nome: string
  aluno_serie: string | null
  aluno_turno: string | null
  status: string
  documentos: DocumentosMatricula | null
  criado_em: string
  atualizado_em: string
}

export type ComunicadoResponsavel = {
  id: string
  titulo: string
  mensagem: string
  setor: string
  prioridade: string
  autor_nome: string
  criado_em: string
  lido: boolean
}

export type FaturaResponsavel = {
  id: string
  aluno_nome: string
  descricao: string
  valor_centavos: number
  vencimento: string
  status: string
  pago_em: string | null
}

export type EventoResponsavel = {
  id: string
  titulo: string
  descricao: string | null
  tipo: string
  data_evento: string
  hora_evento: string | null
  publico: string
  serie: string | null
}

export type AutorizacaoResponsavel = {
  id: string
  titulo: string
  descricao: string | null
  tipo: string
  data_evento: string | null
  prazo_resposta: string | null
  resposta: string | null
  observacao: string | null
}

export type NotaBoletim = {
  disciplina: string
  periodo: string
  nota: number | null
  faltas: number
}

export type BoletimAluno = {
  aluno_nome: string
  notas: NotaBoletim[]
  media: number | null
  total_faltas: number
}

async function getEmailUsuario(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email || null
}

async function getNomePrimeiroAluno(email: string): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('alunos')
    .select('nome')
    .eq('responsavel_email', email)
    .limit(1)
    .maybeSingle()
  return data?.nome || null
}

export async function getMinhasInscricoes(): Promise<InscricaoResponsavel[]> {
  try {
    const email = await getEmailUsuario()
    if (!email) return []

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('inscricoes')
      .select('id, protocolo, aluno_nome, aluno_serie, aluno_turno, status, documentos, criado_em, atualizado_em')
      .eq('responsavel_email', email)
      .order('criado_em', { ascending: false })

    if (error) return []
    return (data || []) as InscricaoResponsavel[]
  } catch (e) {
    return []
  }
}

export async function getMeusComunicados(): Promise<ComunicadoResponsavel[]> {
  try {
    const email = await getEmailUsuario()
    if (!email) return []

    const admin = createAdminClient()
    const { data: coms, error } = await admin
      .from('comunicados')
      .select('id, titulo, mensagem, setor, prioridade, autor_nome, criado_em')
      .eq('ativo', true)
      .order('criado_em', { ascending: false })
      .limit(20)

    if (error || !coms) return []

    const { data: leituras } = await admin
      .from('comunicados_leituras')
      .select('comunicado_id')
      .eq('responsavel_email', email)

    const lidosSet = new Set((leituras || []).map((l) => l.comunicado_id))

    return coms.map((c) => ({
      id: c.id,
      titulo: c.titulo,
      mensagem: c.mensagem,
      setor: c.setor,
      prioridade: c.prioridade,
      autor_nome: c.autor_nome,
      criado_em: c.criado_em,
      lido: lidosSet.has(c.id),
    })) as ComunicadoResponsavel[]
  } catch (e) {
    return []
  }
}

export async function getMinhasFaturas(): Promise<FaturaResponsavel[]> {
  try {
    const email = await getEmailUsuario()
    if (!email) return []

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('faturas')
      .select('id, aluno_nome, descricao, valor_centavos, vencimento, status, pago_em')
      .eq('responsavel_email', email)
      .order('vencimento', { ascending: false })

    if (error) return []
    return (data || []) as FaturaResponsavel[]
  } catch (e) {
    return []
  }
}

export async function getMeusEventos(): Promise<EventoResponsavel[]> {
  try {
    const email = await getEmailUsuario()
    if (!email) return []

    const admin = createAdminClient()
    const { data: escola } = await admin.from('escolas').select('id').eq('slug', 'colegio-horizonte').single()
    if (!escola) return []

    const { data: inscricoes } = await admin
      .from('inscricoes')
      .select('aluno_serie')
      .eq('responsavel_email', email)

    const series = (inscricoes || []).map((i) => i.aluno_serie).filter(Boolean) as string[]
    const hoje = new Date().toISOString().split('T')[0]

    const { data, error } = await admin
      .from('eventos')
      .select('id, titulo, descricao, tipo, data_evento, hora_evento, publico, serie')
      .eq('escola_id', escola.id)
      .eq('ativo', true)
      .gte('data_evento', hoje)
      .order('data_evento', { ascending: true })
      .limit(10)

    if (error) return []

    return ((data || []) as EventoResponsavel[]).filter((e) => {
      if (e.publico === 'todos') return true
      if (e.serie && series.some((s) => s.toLowerCase().includes(e.serie!.toLowerCase()))) return true
      if (e.serie && series.some((s) => e.serie!.toLowerCase().includes(s.toLowerCase()))) return true
      return false
    })
  } catch (e) {
    return []
  }
}

export async function getMinhasAutorizacoes(): Promise<AutorizacaoResponsavel[]> {
  try {
    const email = await getEmailUsuario()
    if (!email) return []

    const admin = createAdminClient()
    const { data: escola } = await admin.from('escolas').select('id').eq('slug', 'colegio-horizonte').single()
    if (!escola) return []

    const { data: auts, error } = await admin
      .from('autorizacoes')
      .select('id, titulo, descricao, tipo, data_evento, prazo_resposta')
      .eq('escola_id', escola.id)
      .eq('ativo', true)
      .order('criado_em', { ascending: false })
      .limit(20)

    if (error || !auts) return []

    const { data: respostas } = await admin
      .from('autorizacoes_respostas')
      .select('autorizacao_id, resposta, observacao')
      .eq('responsavel_email', email)

    const respostaPorAut: Record<string, { resposta: string; observacao: string | null }> = {}
    ;(respostas || []).forEach((r) => {
      respostaPorAut[r.autorizacao_id] = { resposta: r.resposta, observacao: r.observacao }
    })

    return auts.map((a) => ({
      id: a.id,
      titulo: a.titulo,
      descricao: a.descricao,
      tipo: a.tipo,
      data_evento: a.data_evento,
      prazo_resposta: a.prazo_resposta,
      resposta: respostaPorAut[a.id]?.resposta || null,
      observacao: respostaPorAut[a.id]?.observacao || null,
    })) as AutorizacaoResponsavel[]
  } catch (e) {
    return []
  }
}

export async function getMeuBoletim(): Promise<BoletimAluno[]> {
  try {
    const email = await getEmailUsuario()
    if (!email) return []

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('notas')
      .select('aluno_nome, disciplina, periodo, nota, faltas')
      .eq('responsavel_email', email)

    if (error || !data) return []

    const porAluno: Record<string, BoletimAluno> = {}
    data.forEach((n) => {
      if (!porAluno[n.aluno_nome]) {
        porAluno[n.aluno_nome] = { aluno_nome: n.aluno_nome, notas: [], media: null, total_faltas: 0 }
      }
      porAluno[n.aluno_nome].notas.push({
        disciplina: n.disciplina,
        periodo: n.periodo,
        nota: n.nota,
        faltas: n.faltas,
      })
      porAluno[n.aluno_nome].total_faltas += n.faltas || 0
    })

    return Object.values(porAluno).map((b) => {
      const notasValidas = b.notas.filter((n) => n.nota !== null)
      const media = notasValidas.length > 0 ? notasValidas.reduce((s, n) => s + (n.nota || 0), 0) / notasValidas.length : null
      return { ...b, media }
    })
  } catch (e) {
    return []
  }
}

export async function responderAutorizacao(autorizacaoId: string, resposta: 'autorizado' | 'recusado', observacao: string) {
  try {
    const email = await getEmailUsuario()
    if (!email) return { success: false, error: 'Não autenticado.' }

    const nomeAluno = await getNomePrimeiroAluno(email)
    if (!nomeAluno) return { success: false, error: 'Nenhum aluno vinculado a este e-mail.' }

    const admin = createAdminClient()

    const { data: existente } = await admin
      .from('autorizacoes_respostas')
      .select('id')
      .eq('autorizacao_id', autorizacaoId)
      .eq('responsavel_email', email)
      .eq('aluno_nome', nomeAluno)
      .maybeSingle()

    if (existente) {
      const { error } = await admin
        .from('autorizacoes_respostas')
        .update({ resposta, observacao: observacao || null, respondido_em: new Date().toISOString() })
        .eq('id', existente.id)
      if (error) return { success: false, error: error.message }
    } else {
      const { error } = await admin.from('autorizacoes_respostas').insert({
        autorizacao_id: autorizacaoId,
        responsavel_email: email,
        aluno_nome: nomeAluno,
        resposta,
        observacao: observacao || null,
      })
      if (error) return { success: false, error: error.message }
    }

    revalidatePath('/responsavel')
    revalidatePath('/admin/autorizacoes')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao responder.' }
  }
}

export async function marcarComoLido(comunicadoId: string) {
  try {
    const email = await getEmailUsuario()
    if (!email) return { success: false }

    const admin = createAdminClient()
    const { error } = await admin.from('comunicados_leituras').insert({
      comunicado_id: comunicadoId,
      responsavel_email: email,
    })

    if (error && error.code !== '23505') return { success: false }
    return { success: true }
  } catch (e) {
    return { success: false }
  }
}