import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function enviarConviteAluno(params: {
  para: string
  alunoNome: string
  escolaNome: string
  escolaSlug: string
  linkMagico: string
}) {
  const { para, alunoNome, escolaNome, escolaSlug, linkMagico } = params

  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY não configurada. Pulando envio.')
    return { success: false, error: 'RESEND_API_KEY não configurada.' }
  }

  const primeiroNome = alunoNome.split(' ')[0]

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Seu acesso ao portal do aluno</title>
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
                  <h1 style="margin:0 0 16px 0;font-size:22px;font-weight:700;color:#12232b;">Olá, ${primeiroNome}!</h1>
                  <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#536871;">
                    Sua conta no <strong style="color:#12232b;">portal do aluno</strong> está pronta. Por lá você acompanha seu boletim, assiste às aulas, vê os próximos eventos e recebe os comunicados da escola.
                  </p>
                  <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#536871;">
                    Para entrar, clique no botão abaixo. O link é pessoal e expira em 1 hora.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:0 40px 32px 40px;">
                  <a href="${linkMagico}" style="display:inline-block;background:#0d9488;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:14px;font-weight:600;">Acessar meu portal</a>
                </td>
              </tr>
              <tr>
                <td style="padding:0 40px 32px 40px;">
                  <div style="background:#fafcfc;border:1px solid #e5ecee;border-radius:10px;padding:16px 20px;">
                    <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#82939a;">Link direto</p>
                    <p style="margin:0;font-family:monospace;font-size:12px;color:#536871;word-break:break-all;">${linkMagico}</p>
                  </div>
                  <p style="margin:16px 0 0 0;font-size:12px;line-height:1.6;color:#82939a;">
                    Se o botão não funcionar, copie e cole o link acima no navegador.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:20px 40px 28px 40px;border-top:1px solid #e5ecee;">
                  <p style="margin:0;font-size:12px;line-height:1.6;color:#a0afb4;">
                    Você também pode acessar o site da escola em
                    <a href="https://arxum.com.br/edu/${escolaSlug}" style="color:#0d9488;text-decoration:none;">arxum.com.br/edu/${escolaSlug}</a>.
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
      from: 'ARXUM Edu <contato@arxum.com.br>',
      to: para,
      subject: `Seu acesso ao portal — ${escolaNome}`,
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