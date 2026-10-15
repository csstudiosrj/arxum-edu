'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

async function getEmailUsuario(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email || null
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

    // Busca as séries dos filhos deste responsável para filtrar eventos por público
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

    // Filtra: mostra eventos "todos" ou eventos com público que bate com a série do filho
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