import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const assuntoPorStatus: Record<string, string> = {
  em_analise: 'Sua inscrição está em análise',
  entrevista: 'Entrevista agendada',
  aprovado: 'Inscrição aprovada',
  matriculado: 'Matrícula efetivada',
  lista_espera: 'Você está na lista de espera',
  nao_aprovado: 'Resultado da análise da inscrição',
  cancelado: 'Inscrição cancelada',
}

const mensagemPorStatus: Record<string, string> = {
  em_analise: 'Recebemos sua inscrição e nossa equipe já está analisando as informações enviadas. Em breve entraremos em contato.',
  entrevista: 'Sua inscrição avançou para a etapa de entrevista. Nossa equipe entrará em contato para agendar o melhor horário.',
  aprovado: 'Parabéns! Sua inscrição foi aprovada. Em breve você receberá as orientações para efetivar a matrícula e assinar o contrato.',
  matriculado: 'Sua matrícula foi efetivada com sucesso. Seja bem-vindo(a) à nossa comunidade escolar!',
  lista_espera: 'No momento não há vagas disponíveis, mas sua inscrição ficou na lista de espera. Avisaremos assim que uma vaga surgir.',
  nao_aprovado: 'Após análise cuidadosa, sua inscrição não pôde ser aprovada neste momento. Em caso de dúvidas, entre em contato com a escola.',
  cancelado: 'Sua inscrição foi cancelada. Se isso não era esperado, entre em contato com a escola.',
}

export async function enviarEmailStatusMatricula(params: {
  para: string
  alunoNome: string
  protocolo: string
  novoStatus: string
  escolaNome?: string
}) {
  const { para, alunoNome, protocolo, novoStatus, escolaNome = 'Colégio Horizonte' } = params

  const assunto = assuntoPorStatus[novoStatus]
  const mensagem = mensagemPorStatus[novoStatus]

  if (!assunto || !mensagem) {
    return { success: false, error: 'Status desconhecido.' }
  }

  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY não configurada. Pulando envio.')
    return { success: false, error: 'RESEND_API_KEY não configurada.' }
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${assunto}</title>
    </head>
    <body style="margin:0;padding:0;background:#f6f8f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#17252d;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f8f9;padding:40px 20px;">
        <tr>
          <td align="center">
            <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
              <tr>
                <td style="padding:32px 40px 0 40px;">
                  <div style="font-family:'Syne',Arial,sans-serif;font-weight:900;font-size:22px;letter-spacing:-0.02em;">
                    <span style="color:#0d9488;">ARXUM</span> <span style="color:#07090c;">Edu</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding:28px 40px 8px 40px;">
                  <p style="margin:0 0 8px 0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.14em;color:#0d9488;">${escolaNome}</p>
                  <h1 style="margin:0 0 16px 0;font-size:22px;font-weight:700;color:#12232b;">${assunto}</h1>
                  <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#536871;">
                    Olá! Temos uma atualização sobre a inscrição de <strong style="color:#12232b;">${alunoNome}</strong>.
                  </p>
                  <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#536871;">${mensagem}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:0 40px 32px 40px;">
                  <div style="background:#fafcfc;border:1px solid #e5ecee;border-radius:10px;padding:16px 20px;">
                    <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#82939a;">Protocolo</p>
                    <p style="margin:0;font-family:monospace;font-size:16px;font-weight:700;color:#12232b;">${protocolo}</p>
                  </div>
                  <p style="margin:20px 0 0 0;font-size:13px;line-height:1.6;color:#82939a;">
                    Você pode acompanhar sua inscrição a qualquer momento pela área do responsável.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:0 40px 32px 40px;">
                  <a href="https://arxum.com.br/edu/login" style="display:inline-block;background:#0d9488;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">Acessar área do responsável</a>
                </td>
              </tr>
              <tr>
                <td style="padding:20px 40px 28px 40px;border-top:1px solid #e5ecee;">
                  <p style="margin:0;font-size:12px;line-height:1.6;color:#a0afb4;">
                    Este é um e-mail automático. Se precisar de ajuda, entre em contato direto com a escola.
                  </p>
                  <p style="margin:8px 0 0 0;font-size:12px;color:#a0afb4;">
                    © 2026 ARXUM Edu
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `

  try {
    const { error } = await resend.emails.send({
      from: 'ARXUM Edu <onboarding@resend.dev>',
      to: para,
      subject: `${assunto} — ${alunoNome}`,
      html,
    })

    if (error) {
      console.error('[email] Erro Resend:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (e) {
    console.error('[email] Erro inesperado:', e)
    return { success: false, error: 'Erro ao enviar e-mail.' }
  }
}