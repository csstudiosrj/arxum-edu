'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getAlunoDoUsuario } from '@/lib/auth/aluno-atual'
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

export async function getConversasAluno(): Promise<Conversa[]> {
  try {
    const aluno = await getAlunoDoUsuario()
    if (!aluno) return []

    const admin = createAdminClient()
    const { data: conversas, error } = await admin
      .from('conversas')
      .select('id, aluno_id, assunto, status, atualizado_em')
      .eq('aluno_id', aluno.id)
      .order('atualizado_em', { ascending: false })

    if (error || !conversas) return []

    const ids = conversas.map(c => c.id)
    let contagem: Record<string, number> = {}
    if (ids.length > 0) {
      const { data: msgs } = await admin
        .from('mensagens_internas')
        .select('conversa_id')
        .in('conversa_id', ids)
        .in('remetente_tipo', ['escola', 'professor'])
        .eq('lida', false)
      ;(msgs || []).forEach(m => { contagem[m.conversa_id] = (contagem[m.conversa_id] || 0) + 1 })
    }

    return conversas.map((c: any) => ({
      id: c.id,
      aluno_nome: aluno.nome,
      assunto: c.assunto,
      status: c.status,
      atualizado_em: c.atualizado_em,
      nao_lidas: contagem[c.id] || 0
    })) as Conversa[]
  } catch (e) { return [] }
}

export async function getMensagensAluno(conversaId: string): Promise<Mensagem[]> {
  try {
    const admin = createAdminClient()
    
    await admin.from('mensagens_internas')
      .update({ lida: true })
      .eq('conversa_id', conversaId)
      .in('remetente_tipo', ['escola', 'professor'])
      .eq('lida', false)

    const { data } = await admin
      .from('mensagens_internas')
      .select('id, remetente_tipo, remetente_nome, conteudo, criado_em')
      .eq('conversa_id', conversaId)
      .order('criado_em', { ascending: true })

    return (data || []) as Mensagem[]
  } catch (e) { return [] }
}

export async function enviarMensagemAluno(conversaId: string, conteudo: string) {
  try {
    const aluno = await getAlunoDoUsuario()
    if (!aluno) return { success: false, error: 'Sessão expirada.' }

    const admin = createAdminClient()
    
    const { error } = await admin.from('mensagens_internas').insert({
      conversa_id: conversaId,
      remetente_tipo: 'aluno',
      remetente_nome: aluno.nome,
      conteudo: conteudo
    })

    if (error) return { success: false, error: error.message }

    await admin.from('conversas').update({ atualizado_em: new Date().toISOString() }).eq('id', conversaId)
    
    revalidatePath('/aluno/mensagens')
    revalidatePath('/admin/mensagens')
    revalidatePath('/professor/mensagens')
    return { success: true }
  } catch (e) { return { success: false, error: 'Erro ao enviar.' } }
}

export async function criarConversaAluno(assunto: string) {
  try {
    const aluno = await getAlunoDoUsuario()
    if (!aluno) return { success: false, error: 'Sessão expirada.' }

    if (!assunto.trim()) return { success: false, error: 'Informe o assunto.' }

    const admin = createAdminClient()

    const { data: conversa, error } = await admin.from('conversas').insert({
      escola_id: aluno.escola_id,
      aluno_id: aluno.id,
      responsavel_email: aluno.email_aluno || aluno.responsavel_email,
      professor_id: null,
      professor_nome: null,
      assunto: assunto,
      status: 'aberta'
    }).select('id').single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/aluno/mensagens')
    revalidatePath('/admin/mensagens')
    return { success: true, conversaId: conversa.id }
  } catch (e) {
    return { success: false, error: 'Erro ao criar conversa.' }
  }
}