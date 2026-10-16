import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const PAPEL_LABEL: Record<string, string> = {
  direcao: 'Direção',
  coordenacao: 'Coordenação',
  secretaria: 'Secretaria',
  financeiro: 'Financeiro',
  professor: 'Professor',
  admin_escola: 'Administrador',
}

export async function enviarConviteEquipe(params: {
  para: string
  nome: string
  papel: string
  escolaNome: string
  escolaSlug: string
  linkMagico: string
  convidadoPor: string
}) {
  const { para, nome, papel, escolaNome, escolaSlug, linkMagico, convidadoPor } = params

  if (!process.env.RESEND_API_KEY) {
    return { success: false, error: 'RESEND_API_KEY não configurada.' }
  }

  const primeiroNome = nome.split(' ')[0]
  const papelLabel = PAPEL_LABEL[papel] || papel

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Bem-vindo ao ARXUM Edu</title></head>
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
                    <strong style="color:#12232b;">${convidadoPor}</strong> te convidou para fazer parte da equipe do <strong style="color:#12232b;">ARXUM Edu</strong> como <strong style="color:#12232b;">${papelLabel}</strong>.
                  </p>
                  <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#536871;">
                    Clique no botão abaixo para acessar sua conta. O link é pessoal e expira em 1 hora.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:0 40px 32px 40px;">
                  <a href="${linkMagico}" style="display:inline-block;background:#0d9488;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:14px;font-weight:600;">Acessar minha conta</a>
                </td>
              </tr>
              <tr>
                <td style="padding:0 40px 32px 40px;">
                  <div style="background:#fafcfc;border:1px solid #e5ecee;border-radius:10px;padding:16px 20px;">
                    <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#82939a;">Link direto</p>
                    <p style="margin:0;font-family:monospace;font-size:12px;color:#536871;word-break:break-all;">${linkMagico}</p>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding:20px 40px 28px 40px;border-top:1px solid #e5ecee;">
                  <p style="margin:0;font-size:12px;line-height:1.6;color:#a0afb4;">
                    Se você não esperava este convite, pode ignorar este e-mail.
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
      subject: `Convite para ${escolaNome} — ARXUM Edu`,
      html,
    })
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao enviar e-mail.' }
  }
}