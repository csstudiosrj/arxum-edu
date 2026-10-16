import { NextResponse, type NextRequest } from 'next/server'
import { criarRecebedor, criarOuAtualizarCliente, criarPedido, pagarmeConfigurado } from '@/lib/pagarme'

// Rota de teste de fumaça. NÃO é endpoint público de produção.
// Só roda quando a chave configurada é de TESTE (sk_test_*), e ainda
// exige ?confirmar=sim na URL pra evitar execução acidental.

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const chave = process.env.PAGARME_SECRET_KEY || process.env.PAGARME_API_KEY || ''

  if (!pagarmeConfigurado()) {
    return NextResponse.json(
      { ok: false, erro: 'PAGARME_SECRET_KEY não está configurada nas variáveis de ambiente.' },
      { status: 500 }
    )
  }

  if (!chave.startsWith('sk_test_')) {
    return NextResponse.json(
      { ok: false, erro: 'Esta rota só roda com chave de teste (sk_test_). Em produção ela fica bloqueada por segurança.' },
      { status: 403 }
    )
  }

  const confirmar = request.nextUrl.searchParams.get('confirmar')
  if (confirmar !== 'sim') {
    return NextResponse.json({
      ok: true,
      info: 'Rota ativa. Para rodar o teste, adicione ?confirmar=sim no final da URL.',
      passo_a_passo: [
        '1. Cria recebedor de teste (simula uma escola recebendo)',
        '2. Cria cliente de teste (simula um responsável pagando)',
        '3. Cria pedido PIX de R$ 1,00 com split de 2% pro ARXUM',
      ],
    })
  }

  const resultados: Record<string, unknown> = {
    inicio: new Date().toISOString(),
    chave_detectada: chave.slice(0, 12) + '...',
  }

  // ── ETAPA 1: Recebedor (escola) ────────────────────────────────
  const recebedor = await criarRecebedor({
    nome: 'Escola de Teste ARXUM LTDA',
    email: 'recebedor-teste@arxum.com.br',
    documento: '11222333000181',       // CNPJ válido de teste
    tipo: 'company',
    telefone: { country_code: '55', area_code: '21', number: '999999999' },
    endereco: {
      line_1: 'Rua de Teste, 100, Centro',
      zip_code: '20040020',
      city: 'Rio de Janeiro',
      state: 'RJ',
      country: 'BR',
    },
    banco: {
      codigo: '341',                   // Itaú
      agencia: '0001',
      conta: '12345',
      digito: '6',
      tipo: 'checking',
      titular_nome: 'Escola de Teste ARXUM LTDA',
      titular_documento: '11222333000181',
    },
    siteUrl: 'https://arxum.com.br',
  })

  resultados.etapa_1_recebedor = recebedor

  if (!recebedor.success) {
    return NextResponse.json({ ok: false, etapa: 'recebedor', detalhes: resultados }, { status: 200 })
  }

  // ── ETAPA 2: Cliente (responsável) ─────────────────────────────
  const sufixo = Date.now().toString().slice(-6)
  const cliente = await criarOuAtualizarCliente({
    nome: 'Responsável de Teste',
    email: `cliente-teste+${sufixo}@arxum.com.br`,
    documento: '11144477735',          // CPF válido de teste
    telefone: { country_code: '55', area_code: '21', number: '988888888' },
    endereco: {
      line_1: 'Rua do Cliente, 200, Centro',
      zip_code: '20040020',
      city: 'Rio de Janeiro',
      state: 'RJ',
      country: 'BR',
    },
  })

  resultados.etapa_2_cliente = cliente

  if (!cliente.success) {
    return NextResponse.json({ ok: false, etapa: 'cliente', detalhes: resultados }, { status: 200 })
  }

  // ── ETAPA 3: Pedido PIX com split de 2% ────────────────────────
  // Split: recebedor de teste que acabamos de criar + a loja "Casa Com"
  // (que é a conta Stone principal do ARXUM). A loja é a "recipient"
  // do próprio ARXUM.
  const lojaArxumRecipientId = process.env.PAGARME_RECIPIENT_ARXUM_ID

  if (!lojaArxumRecipientId) {
    resultados.etapa_3_pedido = {
      success: false,
      error: 'Falta configurar PAGARME_RECIPIENT_ARXUM_ID nas variáveis de ambiente. É o ID do recebedor da loja ARXUM (Casa Com) na Pagar.me. A gente pega isso depois de rodar o teste.',
    }
  } else {
    const valorCentavos = 100
    const pedido = await criarPedido({
      code: `teste-${sufixo}`,
      clienteId: cliente.customerId,
      itens: [
        { amount: valorCentavos, description: 'Teste de integração', quantity: 1, code: 'teste-001' },
      ],
      metodo: { tipo: 'pix', expiresInSeconds: 3600 },
      split: [
        { recipientId: lojaArxumRecipientId, percentage: 2, liable: false, chargeProcessingFee: false, chargeRemainder: false },
        { recipientId: recebedor.recipientId, liable: true, chargeProcessingFee: true, chargeRemainder: true },
      ],
      metadata: { origem: 'teste-fumaca-arxum' },
    })

    resultados.etapa_3_pedido = pedido
  }

  const tudoOk =
    recebedor.success &&
    cliente.success

  return NextResponse.json({
    ok: tudoOk,
    resumo: tudoOk
      ? '✅ Recebedor e cliente criados com sucesso. A integração com a Pagar.me está funcionando.'
      : '❌ Uma das etapas falhou. Veja os detalhes abaixo.',
    detalhes: resultados,
  })
}