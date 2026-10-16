'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notificarRespostaAutorizacao } from '@/lib/emails/notificacoes'
import { enviarSeAtivo } from '@/lib/notificacoes-config-server'
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

export type AlbumResponsavel = {
  id: string
  titulo: string
  descricao: string | null
  capa_url: string | null
  criado_em: string
  fotos: Array<{ id: string; url: string; legenda: string | null }>
}

export type OcorrenciaResponsavel = {
  id: string
  aluno_nome: string
  tipo: string
  gravidade: string
  titulo: string
  descricao: string
  providencias: string | null
  autor_nome: string
  lida: boolean
  criado_em: string
}

export type Filho = {
  id: string
  nome: string
  serie: string | null
  turno: string | null
}

async function getEmailUsuario(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email || null
}

async function getEscolaDoResponsavel(email: string): Promise<{
  escolaId: string
  escolaNome: string
  series: string[]
} | null> {
  try {
    const admin = createAdminClient()
    const { data: alunos } = await admin
      .from('alunos')
      .select('escola_id, serie')
      .eq('responsavel_email', email)
      .eq('status', 'ativo')

    if (!alunos || alunos.length === 0) return null

    const escolaId = alunos[0].escola_id
    if (!escolaId) return null

    const series = alunos
      .map((a) => a.serie)
      .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)

    const { data: escola } = await admin
      .from('escolas')
      .select('nome')
      .eq('id', escolaId)
      .maybeSingle()

    return { escolaId, escolaNome: escola?.nome || '', series }
  } catch (e) {
    return null
  }
}

export async function getMeusFilhos(): Promise<Filho[]> {
  try {
    const email = await getEmailUsuario()
    if (!email) return []

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('alunos')
      .select('id, nome, serie, turno')
      .eq('responsavel_email', email)
      .eq('status', 'ativo')
      .order('nome', { ascending: true })

    if (error) return []
    return (data || []) as Filho[]
  } catch (e) {
    return []
  }
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
  } catch (e) { return [] }
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
      id: c.id, titulo: c.titulo, mensagem: c.mensagem, setor: c.setor,
      prioridade: c.prioridade, autor_nome: c.autor_nome, criado_em: c.criado_em,
      lido: lidosSet.has(c.id),
    })) as ComunicadoResponsavel[]
  } catch (e) { return [] }
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
  } catch (e) { return [] }
}

export async function getMeusEventos(): Promise<EventoResponsavel[]> {
  try {
    const email = await getEmailUsuario()
    if (!email) return []

    const contexto = await getEscolaDoResponsavel(email)
    if (!contexto) return []
    const { escolaId, series } = contexto

    const admin = createAdminClient()
    const hoje = new Date().toISOString().split('T')[0]
    const { data, error } = await admin
      .from('eventos')
      .select('id, titulo, descricao, tipo, data_evento, hora_evento, publico, serie')
      .eq('escola_id', escolaId)
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
  } catch (e) { return [] }
}

export async function getMinhasAutorizacoes(): Promise<AutorizacaoResponsavel[]> {
  try {
    const email = await getEmailUsuario()
    if (!email) return []

    const contexto = await getEscolaDoResponsavel(email)
    if (!contexto) return []
    const { escolaId } = contexto

    const admin = createAdminClient()
    const { data: auts, error } = await admin
      .from('autorizacoes')
      .select('id, titulo, descricao, tipo, data_evento, prazo_resposta')
      .eq('escola_id', escolaId)
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
      id: a.id, titulo: a.titulo, descricao: a.descricao, tipo: a.tipo,
      data_evento: a.data_evento, prazo_resposta: a.prazo_resposta,
      resposta: respostaPorAut[a.id]?.resposta || null,
      observacao: respostaPorAut[a.id]?.observacao || null,
    })) as AutorizacaoResponsavel[]
  } catch (e) { return [] }
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
        disciplina: n.disciplina, periodo: n.periodo, nota: n.nota, faltas: n.faltas,
      })
      porAluno[n.aluno_nome].total_faltas += n.faltas || 0
    })
    return Object.values(porAluno).map((b) => {
      const notasValidas = b.notas.filter((n) => n.nota !== null)
      const media = notasValidas.length > 0 ? notasValidas.reduce((s, n) => s + (n.nota || 0), 0) / notasValidas.length : null
      return { ...b, media }
    })
  } catch (e) { return [] }
}

export async function getMeusAlbuns(): Promise<AlbumResponsavel[]> {
  try {
    const email = await getEmailUsuario()
    if (!email) return []

    const contexto = await getEscolaDoResponsavel(email)
    if (!contexto) return []
    const { escolaId } = contexto

    const admin = createAdminClient()
    const { data: albuns, error } = await admin
      .from('albuns')
      .select('id, titulo, descricao, capa_url, criado_em')
      .eq('escola_id', escolaId)
      .eq('ativo', true)
      .order('criado_em', { ascending: false })

    if (error || !albuns) return []

    const { data: fotos } = await admin
      .from('fotos')
      .select('id, album_id, url, legenda')
      .in('album_id', albuns.map((a) => a.id))
      .order('ordem', { ascending: true })

    return albuns.map((a) => ({
      id: a.id, titulo: a.titulo, descricao: a.descricao, capa_url: a.capa_url, criado_em: a.criado_em,
      fotos: (fotos || [])
        .filter((f) => f.album_id === a.id)
        .map((f) => ({ id: f.id, url: f.url, legenda: f.legenda })),
    })) as AlbumResponsavel[]
  } catch (e) { return [] }
}

export async function getMinhasOcorrencias(): Promise<OcorrenciaResponsavel[]> {
  try {
    const email = await getEmailUsuario()
    if (!email) return []
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('ocorrencias')
      .select('id, aluno_nome, tipo, gravidade, titulo, descricao, providencias, autor_nome, lida, criado_em')
      .eq('responsavel_email', email)
      .order('criado_em', { ascending: false })
      .limit(50)
    if (error) return []
    return (data || []) as OcorrenciaResponsavel[]
  } catch (e) { return [] }
}

export async function marcarOcorrenciaLida(ocorrenciaId: string) {
  try {
    const admin = createAdminClient()
    const { error } = await admin
      .from('ocorrencias')
      .update({ lida: true, lida_em: new Date().toISOString() })
      .eq('id', ocorrenciaId)
    if (error) return { success: false, error: error.message }
    revalidatePath('/responsavel')
    revalidatePath('/admin/ocorrencias')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao marcar como lida.' }
  }
}

export async function responderAutorizacao(
  autorizacaoId: string,
  alunoNome: string,
  resposta: 'autorizado' | 'recusado',
  observacao: string
) {
  try {
    const email = await getEmailUsuario()
    if (!email) return { success: false, error: 'Não autenticado.' }

    if (!alunoNome) {
      return { success: false, error: 'Selecione o aluno.' }
    }

    const admin = createAdminClient()

    const { data: aluno } = await admin
      .from('alunos')
      .select('id, nome')
      .eq('responsavel_email', email)
      .eq('nome', alunoNome)
      .maybeSingle()

    if (!aluno) {
      return { success: false, error: 'Aluno não vinculado a este responsável.' }
    }

    const { data: existente } = await admin
      .from('autorizacoes_respostas')
      .select('id')
      .eq('autorizacao_id', autorizacaoId)
      .eq('responsavel_email', email)
      .eq('aluno_nome', aluno.nome)
      .maybeSingle()

    if (existente) {
      const { error } = await admin.from('autorizacoes_respostas')
        .update({ resposta, observacao: observacao || null, respondido_em: new Date().toISOString() })
        .eq('id', existente.id)
      if (error) return { success: false, error: error.message }
    } else {
      const { error } = await admin.from('autorizacoes_respostas').insert({
        autorizacao_id: autorizacaoId,
        responsavel_email: email,
        aluno_nome: aluno.nome,
        resposta,
        observacao: observacao || null,
      })
      if (error) return { success: false, error: error.message }
    }

    try {
      const { data: aut } = await admin
        .from('autorizacoes')
        .select('titulo, escola_id')
        .eq('id', autorizacaoId)
        .maybeSingle()

      if (aut?.escola_id) {
        const { data: escola } = await admin
          .from('escolas')
          .select('nome, email_contato')
          .eq('id', aut.escola_id)
          .maybeSingle()

        if (escola?.email_contato) {
          enviarSeAtivo({
            escolaId: aut.escola_id,
            evento: 'resposta_autorizacao',
            enviar: () =>
              notificarRespostaAutorizacao({
                para: escola.email_contato!,
                escolaNome: escola.nome,
                alunoNome: aluno.nome,
                titulo: aut.titulo,
                resposta,
                observacao: observacao || null,
              }),
          }).catch((e) => console.error('[email resposta autorização]', e))
        }
      }
    } catch (e) {
      console.error('Erro ao notificar escola:', e)
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
  } catch (e) { return { success: false } }
}

// ── LGPD: EXPORTAÇÃO DE DADOS ───────────────────────────────────────

export async function exportarMeusDados() {
  try {
    const email = await getEmailUsuario()
    if (!email) return { success: false, error: 'Não autenticado.' }

    const admin = createAdminClient()

    const [
      alunos,
      inscricoes,
      comunicados,
      faturas,
      ocorrencias,
      autorizacoes,
      notas,
      consentimentos,
    ] = await Promise.all([
      admin.from('alunos').select('*').eq('responsavel_email', email),
      admin.from('inscricoes').select('*').eq('responsavel_email', email),
      admin.from('comunicados').select('id, titulo, mensagem, setor, prioridade, autor_nome, criado_em').eq('ativo', true),
      admin.from('faturas').select('*').eq('responsavel_email', email),
      admin.from('ocorrencias').select('*').eq('responsavel_email', email),
      admin.from('autorizacoes_respostas').select('*').eq('responsavel_email', email),
      admin.from('notas').select('*').eq('responsavel_email', email),
      admin.from('consentimentos').select('tipo, versao, aluno_nome, criado_em').eq('responsavel_email', email),
    ])

    const pacote = {
      _meta: {
        gerado_em: new Date().toISOString(),
        gerado_para: email,
        tipo_documento: 'Portabilidade de dados — LGPD Art. 18, V',
        versao: 'v1-2026-10',
        descricao: 'Este arquivo contém todos os dados pessoais tratados pelo ARXUM Edu vinculados a este e-mail de responsável, conforme a Lei 13.709/2018 (LGPD).',
      },
      dados_cadastrais_responsavel: {
        email,
      },
      alunos_vinculados: alunos.data || [],
      inscricoes: inscricoes.data || [],
      comunicados_recebidos: comunicados.data || [],
      faturas: faturas.data || [],
      ocorrencias: ocorrencias.data || [],
      autorizacoes_respondidas: autorizacoes.data || [],
      notas_boletim: notas.data || [],
      consentimentos_registrados: consentimentos.data || [],
    }

    return { success: true, dados: pacote }
  } catch (e) {
    console.error('[LGPD exportar]', e)
    return { success: false, error: 'Erro ao gerar arquivo de dados.' }
  }
}

// ── LGPD: SOLICITAÇÃO DE EXCLUSÃO ───────────────────────────────────

export async function solicitarExclusaoDados(motivo: string) {
  try {
    const email = await getEmailUsuario()
    if (!email) return { success: false, error: 'Não autenticado.' }

    const admin = createAdminClient()

    const contexto = await getEscolaDoResponsavel(email)
    if (!contexto) {
      return { success: false, error: 'Nenhum aluno vinculado a este e-mail. Não há dados para excluir.' }
    }

    // Verifica se já existe solicitação aberta recente
    const { data: existente } = await admin
      .from('tickets_suporte')
      .select('id')
      .eq('escola_id', contexto.escolaId)
      .eq('categoria', 'outro')
      .like('assunto', 'LGPD%')
      .in('status', ['aberto', 'em_andamento'])
      .maybeSingle()

    if (existente) {
      return { success: true, jaExistia: true }
    }

    const { error } = await admin.from('tickets_suporte').insert({
      escola_id: contexto.escolaId,
      escola_nome: contexto.escolaNome,
      assunto: 'LGPD: Solicitação de exclusão de dados',
      descricao: `O responsável (${email}) solicitou a exclusão dos seus dados pessoais.\n\nMotivo declarado: ${motivo || 'não informado'}\n\n⚠️ Ação requer análise manual. Verificar obrigações de retenção legal (registros acadêmicos, fiscais) antes de executar.`,
      prioridade: 'alta',
      categoria: 'outro',
      status: 'aberto',
      aberto_por: email,
    })

    if (error) return { success: false, error: error.message }

    revalidatePath('/responsavel')
    return { success: true }
  } catch (e) {
    console.error('[LGPD exclusão]', e)
    return { success: false, error: 'Erro ao registrar solicitação.' }
  }
}