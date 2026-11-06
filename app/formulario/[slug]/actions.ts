'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function submitFormularioPublico(slug: string, dados: Record<string, any>) {
  try {
    const admin = createAdminClient()

    // 1. Buscar o formulário pelo slug e pegar dados da escola
    const { data: formulario, error: errorForm } = await admin
      .from('formularios')
      .select(`
        id, escola_id, redirecionar_url, titulo,
        escolas ( nome, email_contato )
      `)
      .eq('slug', slug)
      .eq('status', 'publicado')
      .maybeSingle()

    if (errorForm || !formulario) {
      return { success: false, error: 'Formulário não encontrado ou não publicado.' }
    }

    // 2. Pega o IP do usuário para a trilha de auditoria
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for')?.split(',')[0].trim() || 'Desconhecido'

    // 3. Salvar a resposta no banco de dados
    const { data: resposta, error: errorInsert } = await admin
      .from('formulario_respostas')
      .insert({
        formulario_id: formulario.id,
        escola_id: formulario.escola_id,
        dados: dados,
        ip,
        responsavel_email: null,
        aluno_nome: null,
      })
      .select('id')
      .single()

    if (errorInsert) {
      console.error('[formulario publico] erro ao salvar:', errorInsert)
      return { success: false, error: 'Erro ao salvar as respostas.' }
    }

    // 4. Enviar e-mail de notificação para a escola (se ela tiver e-mail cadastrado)
    try {
      const escola = (formulario as any).escolas
      if (escola?.email_contato) {
        await resend.emails.send({
          from: 'ARXUM Edu <notificacoes@arxum.com.br>',
          to: escola.email_contato,
          subject: `Novo formulário preenchido: ${formulario.titulo}`,
          html: `
            <h2>Novo formulário recebido</h2>
            <p>O formulário <strong>${formulario.titulo}</strong> acabou de ser preenchido no site.</p>
            <p>Acesse o painel do ARXUM Edu para visualizar as respostas completas.</p>
            <br>
            <p><small>IP do envio: ${ip}</small></p>
          `,
        })
      }
    } catch (e) {
      console.error('Erro ao enviar email de notificação de formulário:', e)
      // Não bloqueia o retorno de sucesso, pois a resposta já foi salva
    }

    return { success: true, redirecionar_url: formulario.redirecionar_url }
  } catch (e) {
    console.error('[submitFormularioPublico]', e)
    return { success: false, error: 'Erro inesperado ao enviar formulário.' }
  }
}