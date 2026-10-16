import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const COR = '#0d9488'
const FUNDO = '#f6f8f9'
const CARD = '#ffffff'
const TEXTO = '#12232b'
const TEXTO_SEC = '#536871'
const TEXTO_TER = '#82939a'

function layout(params: {
  escolaNome: string
  titulo: string
  intro: string
  corpo: string
  ctaLabel?: string
  ctaHref?: string
  rodape?: string
}): string {
  const { escolaNome, titulo, intro, corpo, ctaLabel, ctaHref, rodape } = params

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${titulo}</title>
    </head>
    <body style="margin:0;padding:0;background:${FUNDO};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${TEXTO};">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${FUNDO};padding:40px 20px;">
        <tr>
          <td align="center">
            <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="background:${CARD};border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
              <tr>
                <td style="padding:32px 40px 0 40px;">
                  <div style="font-family:'Syne',Arial,sans-serif;font-weight:900;font-size:22px;letter-spacing:-0.02em;">
                    <span style="color:${COR};">ARXUM</span> <span style="color:#07090c;">Edu</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding:28px 40px 8px 40px;">
                  <p style="margin:0 0 8px 0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.14em;color:${COR};">${escolaNome}</p>
                  <h1 style="margin:0 0 16px 0;font-size:22px;font-weight:700;color:${TEXTO};">${titulo}</h1>
                  <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:${TEXTO_SEC};">${intro}</p>
                  <div style="font-size:15px;line-height:1.7;color:${TEXTO_SEC};">${corpo}</div>
                </td>
              </tr>
              ${ctaLabel && ctaHref ? `
              <tr>
                <td style="padding:24px 40px 32px 40px;">
                  <a href="${ctaHref}" style="display:inline-block;background:${COR};color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">${ctaLabel}</a>
                </td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding:20px 40px 28px 40px;border-top:1px solid #e5ecee;">
                  <p style="margin:0;font-size:12px;line-height:1.6;color:${TEXTO_TER};">
                    ${rodape || 'Você recebe este e-mail porque tem uma conta vinculada à escola.'}
                  </p>
                  <p style="margin:8px 0 0 0;font-size:12px;color:${TEXTO_TER};">© 2026 ARXUM Edu</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

async function enviar(params: {
  para: string
  assunto: string
  html: string
}) {
  if (!process.env.RESEND_API_KEY) {
    return { success: false, error: 'RESEND_API_KEY não configurada.' }
  }
  try {
    const { error } = await resend.emails.send({
      from: 'ARXUM Edu <contato@arxum.com.br>',
      to: params.para,
      subject: params.assunto,
      html: params.html,
    })
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao enviar.' }
  }
}

// ── COMUNICADO NOVO ─────────────────────────────────────────────────

export async function notificarComunicado(params: {
  para: string
  escolaNome: string
  escolaSlug: string
  titulo: string
  mensagem: string
  setor: string
  autor: string
}) {
  return enviar({
    para: params.para,
    assunto: `Novo comunicado: ${params.titulo} — ${params.escolaNome}`,
    html: layout({
      escolaNome: params.escolaNome,
      titulo: params.titulo,
      intro: `Você recebeu um novo comunicado do setor <strong>${params.setor}</strong>.`,
      corpo: `<div style="background:${FUNDO};border-radius:10px;padding:16px 20px;margin-top:8px;">${params.mensagem.replace(/\n/g, '<br>')}</div>
              <p style="margin-top:16px;font-size:13px;color:${TEXTO_TER};">Enviado por ${params.autor}</p>`,
      ctaLabel: 'Ver no portal',
      ctaHref: `https://arxum.com.br/edu/${params.escolaSlug}/login`,
    }),
  })
}

// ── AUTORIZAÇÃO PENDENTE ────────────────────────────────────────────

export async function notificarAutorizacaoPendente(params: {
  para: string
  escolaNome: string
  escolaSlug: string
  titulo: string
  descricao: string | null
  prazo: string | null
}) {
  const prazoTexto = params.prazo
    ? `<p style="margin-top:16px;color:#dc2626;font-weight:600;">Responda até ${params.prazo}</p>`
    : ''

  return enviar({
    para: params.para,
    assunto: `Autorização pendente: ${params.titulo} — ${params.escolaNome}`,
    html: layout({
      escolaNome: params.escolaNome,
      titulo: 'Nova autorização para responder',
      intro: 'A escola enviou uma autorização que precisa da sua resposta.',
      corpo: `<div style="background:${FUNDO};border-radius:10px;padding:16px 20px;margin-top:8px;">
                <p style="margin:0 0 6px 0;font-weight:600;color:${TEXTO};">${params.titulo}</p>
                ${params.descricao ? `<p style="margin:0;font-size:14px;">${params.descricao}</p>` : ''}
              </div>${prazoTexto}`,
      ctaLabel: 'Responder agora',
      ctaHref: `https://arxum.com.br/edu/${params.escolaSlug}/login`,
    }),
  })
}

// ── NOTA LANÇADA ────────────────────────────────────────────────────

export async function notificarNotaLancada(params: {
  para: string
  escolaNome: string
  escolaSlug: string
  alunoNome: string
  disciplina: string
  periodo: string
  nota: number | null
  faltas: number
}) {
  const periodosLabel: Record<string, string> = {
    '1_bimestre': '1º Bimestre',
    '2_bimestre': '2º Bimestre',
    '3_bimestre': '3º Bimestre',
    '4_bimestre': '4º Bimestre',
    '1_semestre': '1º Semestre',
    '2_semestre': '2º Semestre',
  }

  const notaTexto = params.nota !== null ? params.nota.toFixed(1) : '—'
  const cor = params.nota === null ? TEXTO_SEC : params.nota >= 7 ? '#065f46' : params.nota >= 5 ? '#92400e' : '#991b1b'

  return enviar({
    para: params.para,
    assunto: `Nova nota em ${params.disciplina} — ${params.alunoNome}`,
    html: layout({
      escolaNome: params.escolaNome,
      titulo: 'Nova nota lançada',
      intro: `Uma nova nota foi registrada para <strong>${params.alunoNome}</strong>.`,
      corpo: `<div style="background:${FUNDO};border-radius:10px;padding:20px;margin-top:8px;">
                <table width="100%">
                  <tr>
                    <td style="padding:6px 0;color:${TEXTO_TER};font-size:13px;">Disciplina</td>
                    <td style="padding:6px 0;text-align:right;font-weight:600;">${params.disciplina}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:${TEXTO_TER};font-size:13px;">Período</td>
                    <td style="padding:6px 0;text-align:right;font-weight:600;">${periodosLabel[params.periodo] || params.periodo}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:${TEXTO_TER};font-size:13px;">Nota</td>
                    <td style="padding:6px 0;text-align:right;font-weight:700;font-size:20px;color:${cor};">${notaTexto}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:${TEXTO_TER};font-size:13px;">Faltas</td>
                    <td style="padding:6px 0;text-align:right;font-weight:600;">${params.faltas}</td>
                  </tr>
                </table>
              </div>`,
      ctaLabel: 'Ver boletim completo',
      ctaHref: `https://arxum.com.br/edu/${params.escolaSlug}/login`,
    }),
  })
}

// ── FATURA GERADA ───────────────────────────────────────────────────

export async function notificarFaturaGerada(params: {
  para: string
  escolaNome: string
  escolaSlug: string
  alunoNome: string
  descricao: string
  valor: string
  vencimento: string
}) {
  return enviar({
    para: params.para,
    assunto: `Nova fatura: ${params.descricao} — ${params.escolaNome}`,
    html: layout({
      escolaNome: params.escolaNome,
      titulo: 'Nova fatura disponível',
      intro: `Uma nova fatura foi emitida para <strong>${params.alunoNome}</strong>.`,
      corpo: `<div style="background:${FUNDO};border-radius:10px;padding:20px;margin-top:8px;">
                <table width="100%">
                  <tr>
                    <td style="padding:6px 0;color:${TEXTO_TER};font-size:13px;">Descrição</td>
                    <td style="padding:6px 0;text-align:right;font-weight:600;">${params.descricao}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:${TEXTO_TER};font-size:13px;">Vencimento</td>
                    <td style="padding:6px 0;text-align:right;font-weight:600;">${params.vencimento}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:${TEXTO_TER};font-size:13px;">Valor</td>
                    <td style="padding:6px 0;text-align:right;font-weight:700;font-size:18px;color:${COR};">${params.valor}</td>
                  </tr>
                </table>
              </div>`,
      ctaLabel: 'Ver faturas',
      ctaHref: `https://arxum.com.br/edu/${params.escolaSlug}/login`,
    }),
  })
}

// ── OCORRÊNCIA REGISTRADA ───────────────────────────────────────────

export async function notificarOcorrencia(params: {
  para: string
  escolaNome: string
  escolaSlug: string
  alunoNome: string
  titulo: string
  tipo: string
  gravidade: string
  descricao: string
}) {
  const gravidadeLabel: Record<string, string> = {
    baixa: 'Baixa',
    media: 'Média',
    alta: 'Alta',
  }

  return enviar({
    para: params.para,
    assunto: `Ocorrência registrada: ${params.titulo} — ${params.alunoNome}`,
    html: layout({
      escolaNome: params.escolaNome,
      titulo: 'Nova ocorrência registrada',
      intro: `Foi registrada uma ocorrência para <strong>${params.alunoNome}</strong>.`,
      corpo: `<div style="background:${FUNDO};border-radius:10px;padding:20px;margin-top:8px;">
                <p style="margin:0 0 8px 0;font-weight:600;color:${TEXTO};">${params.titulo}</p>
                <p style="margin:0 0 4px 0;font-size:13px;color:${TEXTO_TER};"><strong>Tipo:</strong> ${params.tipo} · <strong>Gravidade:</strong> ${gravidadeLabel[params.gravidade] || params.gravidade}</p>
                <p style="margin:12px 0 0 0;font-size:14px;">${params.descricao}</p>
              </div>`,
      ctaLabel: 'Ver no portal',
      ctaHref: `https://arxum.com.br/edu/${params.escolaSlug}/login`,
    }),
  })
}

// ── RESPOSTA DE AUTORIZAÇÃO (para a escola) ─────────────────────────

export async function notificarRespostaAutorizacao(params: {
  para: string
  escolaNome: string
  alunoNome: string
  titulo: string
  resposta: 'autorizado' | 'recusado'
  observacao: string | null
}) {
  const respLabel = params.resposta === 'autorizado' ? 'Autorizada' : 'Recusada'
  const cor = params.resposta === 'autorizado' ? '#065f46' : '#991b1b'

  return enviar({
    para: params.para,
    assunto: `Resposta: ${params.titulo} — ${params.alunoNome}`,
    html: layout({
      escolaNome: params.escolaNome,
      titulo: 'Resposta recebida',
      intro: `<strong>${params.alunoNome}</strong> respondeu uma autorização.`,
      corpo: `<div style="background:${FUNDO};border-radius:10px;padding:20px;margin-top:8px;">
                <p style="margin:0 0 8px 0;font-weight:600;color:${TEXTO};">${params.titulo}</p>
                <p style="margin:0;font-size:14px;">Resposta: <strong style="color:${cor};">${respLabel}</strong></p>
                ${params.observacao ? `<p style="margin:12px 0 0 0;font-size:13px;font-style:italic;color:${TEXTO_SEC};">"${params.observacao}"</p>` : ''}
              </div>`,
      rodape: 'Esta é uma notificação automática para a equipe da escola.',
    }),
  })
}