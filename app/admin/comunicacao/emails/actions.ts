'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getEscolaDoUsuario } from '@/lib/auth/escola-atual'
import { Resend } from 'resend'
import { revalidatePath } from 'next/cache'

export type OpcoesDisparo = {
  turmas: Array<{ id: string; nome: string; serie: string }>
}

export async function getOpcoesDisparo(): Promise<OpcoesDisparo> {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { turmas: [] }

    const admin = createAdminClient()
    const { data: turmas } = await admin
      .from('turmas')
      .select('id, nome, serie')
      .eq('escola_id', escola.id)
      .order('nome')

    return { turmas: turmas || [] }
  } catch (e) {
    return { turmas: [] }
  }
}

export async function contarDestinatarios(publico: string, turmaId?: string) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return 0

    const admin = createAdminClient()
    const emails = new Set<string>()

    // 1. Buscar Alunos/Responsáveis
    if (['todos', 'pais', 'alunos'].includes(publico)) {
      let query = admin.from('alunos').select('responsavel_email, email_aluno').eq('escola_id', escola.id).eq('status', 'ativo')
      if (turmaId) query = query.eq('turma_id', turmaId)

      const { data: alunos } = await query
      ;(alunos || []).forEach(a => {
        if (publico === 'todos' || publico === 'pais') {
          if (a.responsavel_email) emails.add(a.responsavel_email.toLowerCase())
        }
        if (publico === 'todos' || publico === 'alunos') {
          if (a.email_aluno) emails.add(a.email_aluno.toLowerCase())
        }
      })
    }

    // 2. Buscar Professores
    if (['todos', 'professores'].includes(publico) && !turmaId) {
      const { data: profs } = await admin.from('perfis').select('email').eq('escola_id', escola.id).eq('papel', 'professor').eq('ativo', true)
      ;(profs || []).forEach(p => { if (p.email) emails.add(p.email.toLowerCase()) })
    }

    // 3. Buscar Funcionários (excluindo professores e alunos)
    if (['todos', 'funcionarios'].includes(publico) && !turmaId) {
      const { data: funcs } = await admin.from('perfis').select('email').eq('escola_id', escola.id).neq('papel', 'professor').neq('papel', 'aluno').eq('ativo', true)
      ;(funcs || []).forEach(f => { if (f.email) emails.add(f.email.toLowerCase()) })
    }

    return emails.size
  } catch (e) {
    return 0
  }
}

export async function dispararEmails(dados: {
  publico: string
  turmaId?: string
  assunto: string
  corpo: string
}) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const listaEmails = new Set<string>()

    // (Mesma lógica de busca do contarDestinatarios, mas agora salvando os e-mails)
    if (['todos', 'pais', 'alunos'].includes(dados.publico)) {
      let query = admin.from('alunos').select('responsavel_email, email_aluno').eq('escola_id', escola.id).eq('status', 'ativo')
      if (dados.turmaId) query = query.eq('turma_id', dados.turmaId)
      
      const { data: alunos } = await query
      ;(alunos || []).forEach(a => {
        if (dados.publico === 'todos' || dados.publico === 'pais') {
          if (a.responsavel_email) listaEmails.add(a.responsavel_email.toLowerCase())
        }
        if (dados.publico === 'todos' || dados.publico === 'alunos') {
          if (a.email_aluno) listaEmails.add(a.email_aluno.toLowerCase())
        }
      })
    }

    if (['todos', 'professores'].includes(dados.publico) && !dados.turmaId) {
      const { data: profs } = await admin.from('perfis').select('email').eq('escola_id', escola.id).eq('papel', 'professor').eq('ativo', true)
      ;(profs || []).forEach(p => { if (p.email) listaEmails.add(p.email.toLowerCase()) })
    }

    if (['todos', 'funcionarios'].includes(dados.publico) && !dados.turmaId) {
      const { data: funcs } = await admin.from('perfis').select('email').eq('escola_id', escola.id).neq('papel', 'professor').neq('papel', 'aluno').eq('ativo', true)
      ;(funcs || []).forEach(f => { if (f.email) listaEmails.add(f.email.toLowerCase()) })
    }

    const emailsArray = Array.from(listaEmails)
    if (emailsArray.length === 0) return { success: false, error: 'Nenhum destinatário encontrado com esse filtro.' }

    if (!process.env.RESEND_API_KEY) {
      return { success: false, error: 'Configuração de e-mail não encontrada.' }
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    const emailBodyHtml = `
      <div style="font-family: sans-serif; color: #12232b; max-width: 600px; margin: 0 auto; border: 1px solid #e5ecee; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #0d9488; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">${escola.nome}</h1>
        </div>
        <div style="padding: 32px;">
          ${dados.corpo}
        </div>
        <div style="background-color: #fafcfc; padding: 16px; text-align: center; font-size: 12px; color: #82939a;">
          Enviado via ARXUM Edu.
        </div>
      </div>
    `

    // O Resend tem limite de envios por lote, então dividimos em lotes de 100
    const TAMANHO_LOTE = 100
    let enviados = 0

    for (let i = 0; i < emailsArray.length; i += TAMANHO_LOTE) {
      const lote = emailsArray.slice(i, i + TAMANHO_LOTE)
      const batchData = lote.map(email => ({
        from: 'ARXUM Edu <comunicacao@arxum.com.br>',
        to: email,
        subject: dados.assunto,
        html: emailBodyHtml
      }))
      
      try {
        await resend.batch.send(batchData)
        enviados += lote.length
      } catch (err) {
        console.error('Erro ao enviar lote:', err)
      }
    }

    revalidatePath('/admin/comunicacao/emails')
    return { success: true, enviados }
  } catch (e) {
    console.error(e)
    return { success: false, error: 'Erro ao disparar e-mails.' }
  }
}