'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
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

async function getEmailUsuario() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email || null
}

export async function getConversasResponsavel(): Promise<Conversa[]> {
  try {
    const email = await getEmailUsuario()
    if (!email) return []

    const admin = createAdminClient()
    const { data: conversas, error } = await admin
      .from('conversas')
      .select('id, aluno_id, assunto, status, atualizado_em, alunos(nome)')
      .eq('responsavel_email', email)
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
      aluno_nome: c.alunos?.nome || 'Aluno',
      assunto: c.assunto,
      status: c.status,
      atualizado_em: c.atualizado_em,
      nao_lidas: contagem[c.id] || 0
    })) as Conversa[]
  } catch (e) { return [] }
}

export async function getMensagensResponsavel(conversaId: string): Promise<Mensagem[]> {
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

export async function enviarMensagemResponsavel(conversaId: string, conteudo: string) {
  try {
    const email = await getEmailUsuario()
    if (!email) return { success: false, error: 'Sessão expirada.' }

    const admin = createAdminClient()
    
    const { error } = await admin.from('mensagens_internas').insert({
      conversa_id: conversaId,
      remetente_tipo: 'responsavel',
      remetente_nome: 'Responsável',
      conteudo: conteudo
    })

    if (error) return { success: false, error: error.message }

    await admin.from('conversas').update({ atualizado_em: new Date().toISOString() }).eq('id', conversaId)
    
    revalidatePath('/responsavel/mensagens')
    revalidatePath('/admin/mensagens')
    revalidatePath('/professor/mensagens')
    return { success: true }
  } catch (e) { return { success: false, error: 'Erro ao enviar.' } }
}