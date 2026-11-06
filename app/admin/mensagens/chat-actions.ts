'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getEscolaDoUsuario } from '@/lib/auth/escola-atual'
import { revalidatePath } from 'next/cache'

export type Conversa = {
  id: string
  aluno_id: string
  aluno_nome: string
  responsavel_email: string
  assunto: string
  status: string
  criado_em: string
  atualizado_em: string
  nao_lidas: number
}

export type MensagemChat = {
  id: string
  conversa_id: string
  remetente_tipo: string
  remetente_nome: string
  conteudo: string
  lida: boolean
  criado_em: string
}

export async function getConversasEscola(): Promise<Conversa[]> {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return []

    const admin = createAdminClient()
    const { data: conversas, error } = await admin
      .from('conversas')
      .select('*, alunos(nome)')
      .eq('escola_id', escola.id)
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

      ;(msgs || []).forEach(m => {
        contagem[m.conversa_id] = (contagem[m.conversa_id] || 0) + 1
      })
    }

    return conversas.map((c: any) => ({
      id: c.id,
      aluno_id: c.aluno_id,
      aluno_nome: c.alunos?.nome || 'Aluno',
      responsavel_email: c.responsavel_email,
      assunto: c.assunto,
      status: c.status,
      criado_em: c.criado_em,
      atualizado_em: c.atualizado_em,
      nao_lidas: contagem[c.id] || 0
    })) as Conversa[]
  } catch (e) {
    return []
  }
}

export async function getMensagensChat(conversaId: string): Promise<MensagemChat[]> {
  try {
    const admin = createAdminClient()
    
    await admin.from('mensagens_internas')
      .update({ lida: true })
      .eq('conversa_id', conversaId)
      .eq('remetente_tipo', 'responsavel')
      .eq('lida', false)

    const { data } = await admin
      .from('mensagens_internas')
      .select('*')
      .eq('conversa_id', conversaId)
      .order('criado_em', { ascending: true })

    return (data || []) as MensagemChat[]
  } catch (e) {
    return []
  }
}

export async function criarConversa(alunoId: string, assunto: string) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const supabaseAuth = await createClient()
    const { data: { user } } = await supabaseAuth.auth.getUser()

    const admin = createAdminClient()

    const { data: aluno } = await admin
      .from('alunos')
      .select('nome, responsavel_email')
      .eq('id', alunoId)
      .eq('escola_id', escola.id)
      .maybeSingle()

    if (!aluno) return { success: false, error: 'Aluno não encontrado.' }

    const { data: conversa, error } = await admin.from('conversas').insert({
      escola_id: escola.id,
      aluno_id: alunoId,
      responsavel_email: aluno.responsavel_email,
      professor_id: user?.id || null,
      professor_nome: user?.email?.split('@')[0] || 'Escola',
      assunto: assunto,
      status: 'aberta'
    }).select('id').single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/mensagens')
    return { success: true, conversaId: conversa.id }
  } catch (e) {
    return { success: false, error: 'Erro ao criar conversa.' }
  }
}

export async function enviarMensagemChat(conversaId: string, conteudo: string) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const supabaseAuth = await createClient()
    const { data: { user } } = await supabaseAuth.auth.getUser()
    const admin = createAdminClient()
    
    const { data: perfil } = await admin.from('perfis').select('nome').eq('email', user?.email).maybeSingle()
    const autorNome = perfil?.nome || 'Escola'

    const { error } = await admin.from('mensagens_internas').insert({
      conversa_id: conversaId,
      remetente_tipo: 'escola',
      remetente_nome: autorNome,
      conteudo: conteudo
    })

    if (error) return { success: false, error: error.message }

    await admin.from('conversas').update({ atualizado_em: new Date().toISOString() }).eq('id', conversaId)

    revalidatePath('/admin/mensagens')
    revalidatePath('/responsavel/mensagens')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao enviar mensagem.' }
  }
}

export async function getAlunosParaNovaConversa() {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return []
    const admin = createAdminClient()
    const { data } = await admin.from('alunos').select('id, nome, responsavel_email').eq('escola_id', escola.id).eq('status', 'ativo').order('nome')
    return data || []
  } catch (e) {
    return []
  }
}
