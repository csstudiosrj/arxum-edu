export function gerarDocumentoHTML(dados: {
  tipo: 'matricula' | 'frequencia' | 'boletim'
  escolaNome: string
  escolaCnpj: string | null
  escolaEndereco: string | null
  alunoNome: string
  alunoSerie: string | null
  alunoTurno: string | null
  responsavelNome: string
  responsavelCpf: string | null
  dadosExtras?: any
}) {
  const dataAtual = new Date().toLocaleDateString('pt-BR')
  const cidade = dados.escolaEndereco?.split('-').pop()?.trim() || 'Brasil'

  let corpo = ''

  if (dados.tipo === 'matricula') {
    corpo = `
      <p>Declaramos, para os devidos fins, que o(a) aluno(a) <strong>${dados.alunoNome}</strong>, 
      encontra-se regularmente matriculado(a) nesta instituição de ensino no ano letivo corrente.</p>
      <p><strong>Série/Turma:</strong> ${dados.alunoSerie || '—'}<br>
      <strong>Turno:</strong> ${dados.alunoTurno || '—'}</p>
    `
  } else if (dados.tipo === 'frequencia') {
    corpo = `
      <p>Declaramos, para os devidos fins, que o(a) aluno(a) <strong>${dados.alunoNome}</strong>, 
      regularmente matriculado(a) nesta instituição, possui frequência escolar regular e satisfatória.</p>
      <p><strong>Série/Turma:</strong> ${dados.alunoSerie || '—'}</p>
    `
  } else if (dados.tipo === 'boletim') {
    let notasHtml = ''
    if (dados.dadosExtras?.notas && dados.dadosExtras.notas.length > 0) {
      notasHtml = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Disciplina</th>
              <th style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">Período</th>
              <th style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">Nota</th>
              <th style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">Faltas</th>
            </tr>
          </thead>
          <tbody>
            ${dados.dadosExtras.notas.map((n: any) => `
              <tr>
                <td style="border: 1px solid #d1d5db; padding: 8px;">${n.disciplina}</td>
                <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">${n.periodo}</td>
                <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">${n.nota !== null ? n.nota.toFixed(1) : '—'}</td>
                <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">${n.faltas}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <p style="margin-top: 15px; font-size: 14px;"><strong>Média Geral:</strong> ${dados.dadosExtras.media?.toFixed(1) || '—'}</p>
      `
    }
    corpo = `
      <p>Segue o boletim escolar do(a) aluno(a) <strong>${dados.alunoNome}</strong> referente ao período corrente.</p>
      <p><strong>Série/Turma:</strong> ${dados.alunoSerie || '—'}</p>
      ${notasHtml}
    `
  }

  const titulos = {
    matricula: 'DECLARAÇÃO DE MATRÍCULA',
    frequencia: 'DECLARAÇÃO DE FREQUÊNCIA',
    boletim: 'BOLETIM ESCOLAR'
  }

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>${titulos[dados.tipo]} - ${dados.alunoNome}</title>
      <style>
        body { font-family: 'Times New Roman', Times, serif; color: #000; margin: 0; padding: 0; background: #fff; }
        .page { max-width: 800px; margin: 0 auto; padding: 60px 40px; }
        .header { text-align: center; margin-bottom: 50px; border-bottom: 2px solid #000; padding-bottom: 20px; }
        .header h1 { margin: 0; font-size: 24px; text-transform: uppercase; }
        .header p { margin: 5px 0; font-size: 14px; }
        .title { text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 40px; text-transform: uppercase; text-decoration: underline; }
        .content { font-size: 16px; line-height: 1.8; text-align: justify; }
        .footer { margin-top: 80px; text-align: center; font-size: 16px; }
        .assinatura { margin-top: 60px; display: inline-block; border-top: 1px solid #000; padding-top: 10px; width: 300px; }
        @media print {
          body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="background: #f3f4f6; padding: 15px; text-align: center; border-bottom: 1px solid #d1d5db;">
        <button onclick="window.print()" style="background: #0d9488; color: #fff; border: none; padding: 10px 20px; font-size: 16px; font-weight: bold; border-radius: 6px; cursor: pointer;">Salvar como PDF / Imprimir</button>
        <p style="margin: 10px 0 0; font-size: 12px; color: #6b7280;">Ao abrir a janela de impressão, selecione o destino "Salvar como PDF".</p>
      </div>

      <div class="page">
        <div class="header">
          <h1>${dados.escolaNome}</h1>
          ${dados.escolaCnpj ? `<p>CNPJ: ${dados.escolaCnpj}</p>` : ''}
          ${dados.escolaEndereco ? `<p>${dados.escolaEndereco}</p>` : ''}
        </div>

        <div class="title">${titulos[dados.tipo]}</div>

        <div class="content">
          ${corpo}
        </div>

        <div class="footer">
          <p>${cidade}, ${dataAtual}</p>
          <div class="assinatura">
            <p><strong>Direção / Secretaria</strong><br>${dados.escolaNome}</p>
          </div>
        </div>
      </div>
      <script>
        window.onload = function() { setTimeout(function() { window.print(); }, 300); }
      </script>
    </body>
    </html>
  `

  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
}
