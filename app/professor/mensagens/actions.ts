'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getProfessorDoUsuario } from '@/lib/auth/professor-atual'
import { revalidatePath } from 'next/cache'

export type Conversa = {
  id: string
  aluno_nome: string
  assunto: string
  status: string
  atualizado_em: string
  nao_lidas: number
}

export type Mensagem = {
  id: string
  remetente_tipo: string
  remetente_nome: string
  conteudo: string
  criado_em: string
}

export type AlunoResumo = {
  id: string
  nome: string
  serie: string | null
}

export async function getConversasProfessor(): Promise<Conversa[]> {
  try {
    const prof = await getProfessorDoUsuario()
    if (!prof) return []

    const admin = createAdminClient()
    const { data: conversas, error } = await admin
      .from('conversas')
      .select('id, aluno_id, assunto, status, atualizado_em, alunos(nome)')
      .eq('escola_id', prof.escola_id)
      .order('atualizado_em', { ascending: false })

    if (error || !conversas) return []

    const ids = conversas.map(c => c.id)
    let contagem: Record<string, number> = {}
    if (ids.length > 0) {
      const { data: msgs } = await admin
        .from('mensagens_internas')
        .select('conversa_id')
        .in('conversa_id', ids)
        .eq('remetente_tipo', 'responsavel')
        .eq('lida', false)
      ;(msgs || []).forEach(m => { contagem[m.conversa_id] = (contagem[m.conversa_id] || 0) + 1 })
    }

    return conversas.map((c: any) => ({
      id: c.id,
      aluno_nome: c.alunos?.nome || 'Aluno',
      assunto: c.assunto,
      status: c.status,
      atualizado_em: c.atualizado_em,
      nao_lidas: contagem[c.id] || 0
    })) as Conversa[]
  } catch (e) { return [] }
}

export async function getMensagensProfessor(conversaId: string): Promise<Mensagem[]> {
  try {
    const admin = createAdminClient()
    
    await admin.from('mensagens_internas')
      .update({ lida: true })
      .eq('conversa_id', conversaId)
      .eq('remetente_tipo', 'responsavel')
      .eq('lida', false)

    const { data } = await admin
      .from('mensagens_internas')
      .select('id, remetente_tipo, remetente_nome, conteudo, criado_em')
      .eq('conversa_id', conversaId)
      .order('criado_em', { ascending: true })

    return (data || []) as Mensagem[]
  } catch (e) { return [] }
}

export async function enviarMensagemProfessor(conversaId: string, conteudo: string) {
  try {
    const prof = await getProfessorDoUsuario()
    if (!prof) return { success: false, error: 'Sessão expirada.' }

    const admin = createAdminClient()
    
    const { error } = await admin.from('mensagens_internas').insert({
      conversa_id: conversaId,
      remetente_tipo: 'professor',
      remetente_nome: prof.nome,
      conteudo: conteudo
    })

    if (error) return { success: false, error: error.message }

    await admin.from('conversas').update({ atualizado_em: new Date().toISOString() }).eq('id', conversaId)
    
    revalidatePath('/professor/mensagens')
    revalidatePath('/responsavel/mensagens')
    return { success: true }
  } catch (e) { return { success: false, error: 'Erro ao enviar.' } }
}

export async function getAlunosParaNovaConversa(): Promise<AlunoResumo[]> {
  try {
    const prof = await getProfessorDoUsuario()
    if (!prof) return []

    const admin = createAdminClient()
    const { data } = await admin
      .from('alunos')
      .select('id, nome, serie')
      .eq('escola_id', prof.escola_id)
      .eq('status', 'ativo')
      .order('nome')

    return (data || []) as AlunoResumo[]
  } catch (e) { return [] }
}

export async function criarConversaProfessor(alunoId: string, assunto: string) {
  try {
    const prof = await getProfessorDoUsuario()
    if (!prof) return { success: false, error: 'Sessão expirada.' }

    if (!alunoId) return { success: false, error: 'Selecione o aluno.' }
    if (!assunto.trim()) return { success: false, error: 'Informe o assunto.' }

    const admin = createAdminClient()

    const { data: aluno } = await admin
      .from('alunos')
      .select('nome, responsavel_email')
      .eq('id', alunoId)
      .eq('escola_id', prof.escola_id)
      .maybeSingle()

    if (!aluno) return { success: false, error: 'Aluno não encontrado.' }

    const { data: conversa, error } = await admin.from('conversas').insert({
      escola_id: prof.escola_id,
      aluno_id: alunoId,
      responsavel_email: aluno.responsavel_email,
      professor_id: prof.id,
      professor_nome: prof.nome,
      assunto: assunto,
      status: 'aberta'
    }).select('id').single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/professor/mensagens')
    revalidatePath('/responsavel/mensagens')
    return { success: true, conversaId: conversa.id }
  } catch (e) {
    return { success: false, error: 'Erro ao criar conversa.' }
  }
}