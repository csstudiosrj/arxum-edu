import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function enviarConfirmacaoCadastro(params: {
  para: string
  nome: string
  escolaNome: string
  linkConfirmacao: string
}) {
  const { para, nome, escolaNome, linkConfirmacao } = params

  if (!process.env.RESEND_API_KEY) {
    return { success: false, error: 'RESEND_API_KEY não configurada.' }
  }

  const primeiroNome = nome.split(' ')[0]

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Confirme seu e-mail</title></head>
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
                  <h1 style="margin:0 0 16px 0;font-size:22px;font-weight:700;color:#12232b;">Olá, ${primeiroNome}!</h1>
                  <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#536871;">
                    Sua conta do <strong style="color:#12232b;">ARXUM Edu</strong> para a escola <strong style="color:#12232b;">${escolaNome}</strong> foi criada.
                  </p>
                  <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#536871;">
                    Para ativar sua conta, clique no botão abaixo. Este link expira em 24 horas.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:0 40px 32px 40px;">
                  <a href="${linkConfirmacao}" style="display:inline-block;background:#0d9488;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:14px;font-weight:600;">Confirmar e-mail</a>
                </td>
              </tr>
              <tr>
                <td style="padding:0 40px 32px 40px;">
                  <div style="background:#fafcfc;border:1px solid #e5ecee;border-radius:10px;padding:16px 20px;">
                    <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#82939a;">Link direto</p>
                    <p style="margin:0;font-family:monospace;font-size:12px;color:#536871;word-break:break-all;">${linkConfirmacao}</p>
                  </div>
                  <p style="margin:16px 0 0 0;font-size:12px;line-height:1.6;color:#82939a;">
                    Se você não solicitou esta conta, ignore este e-mail.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:20px 40px 28px 40px;border-top:1px solid #e5ecee;">
                  <p style="margin:0;font-size:12px;line-height:1.6;color:#a0afb4;">
                    Dúvidas? Fale com a gente em contato@arxum.com.br.
                  </p>
                  <p style="margin:8px 0 0 0;font-size:12px;color:#a0afb4;">© 2026 ARXUM Edu</p>
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
      subject: `Confirme seu e-mail — ARXUM Edu`,
      html,
    })
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao enviar e-mail.' }
  }
}