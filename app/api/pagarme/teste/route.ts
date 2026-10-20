import { NextResponse, type NextRequest } from 'next/server'
import { criarRecebedor, criarOuAtualizarCliente, criarPedido, pagarmeConfigurado } from '@/lib/pagarme'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const chave = process.env.PAGARME_SECRET_KEY || process.env.PAGARME_API_KEY || ''

  if (!pagarmeConfigurado()) {
    return NextResponse.json({ ok: false, erro: 'PAGARME_SECRET_KEY não está configurada.' }, { status: 500 })
  }

  if (!chave.startsWith('sk_test_')) {
    return NextResponse.json({ ok: false, erro: 'Esta rota só roda com chave de teste (sk_test_).' }, { status: 403 })
  }

  const confirmar = request.nextUrl.searchParams.get('confirmar')
  if (confirmar !== 'sim') {
    return NextResponse.json({
      ok: true,
      info: 'Rota ativa. Para rodar, adicione ?confirmar=sim na URL.',
    })
  }

  const resultados: Record<string, unknown> = { inicio: new Date().toISOString() }

  // ── ETAPA 1: Recebedor (escola) ────────────────────────────────
  const recebedor = await criarRecebedor({
    nome: 'Escola de Teste ARXUM LTDA',
    email: 'recebedor-teste@arxum.com.br',
    documento: '11222333000181',
    tipo: 'company',
    telefone: { country_code: '55', area_code: '21', number: '999999999' },
    endereco: {
      line_1: 'Rua de Teste, 100, Centro',
      zip_code: '20040020',
      city: 'Rio de Janeiro',
      state: 'RJ',
      country: 'BR'
    },
    banco: {
      codigo: '341',
      agencia: '0001',
      conta: '12345',
      digito: '6',
      tipo: 'checking',
      titular_nome: 'Escola de Teste ARXUM LTDA',
      titular_documento: '11222333000181'
    },
    siteUrl: 'https://arxum.com.br',
    registerInformation: {
      type: 'corporation',
      name: 'Escola de Teste ARXUM LTDA',
      company_name: 'Escola de Teste ARXUM LTDA',
      trading_name: 'Escola de Teste',
      annual_revenue: '500000',
      site_url: 'https://arxum.com.br',
      document: '11222333000181',
      email: 'recebedor-teste@arxum.com.br',
      phone_numbers: [{ ddd: '21', number: '999999999', type: 'mobile' }],
      main_address: {
        street: 'Rua de Teste',
        complementary: 'Sala 1',
        street_number: '100',
        neighborhood: 'Centro',
        city: 'Rio de Janeiro',
        state: 'RJ',
        zip_code: '20040020',
        reference_point: 'Próximo ao metrô',
      },
      managing_partners: [{
        type: 'individual',
        name: 'Sócio de Teste',
        document: '11144477735',
        birthdate: '1980-01-01',
        email: 'socio@arxum.com.br',
        monthly_income: '10000',
        professional_occupation: 'Empresário',
        self_declared_legal_representative: true,
        address: {
          street: 'Rua de Teste',
          complementary: 'Sala 1',
          street_number: '100',
          neighborhood: 'Centro',
          city: 'Rio de Janeiro',
          state: 'RJ',
          zip_code: '20040020',
          reference_point: 'Próximo ao metrô'
        },
        phone_numbers: [{ ddd: '21', number: '999999999', type: 'mobile' }],
      }],
    },
  })

  resultados.etapa_1_recebedor = recebedor
  if (!recebedor.success) return NextResponse.json({ ok: false, etapa: 'recebedor', detalhes: resultados })

  // ── ETAPA 2: Cliente (responsável) ─────────────────────────────
  const sufixo = Date.now().toString().slice(-6)
  const cliente = await criarOuAtualizarCliente({
    nome: 'Responsável de Teste',
    email: `cliente-teste+${sufixo}@arxum.com.br`,
    documento: '11144477735',
    telefone: { country_code: '55', area_code: '21', number: '988888888' },
    endereco: {
      line_1: 'Rua do Cliente, 200, Centro',
      zip_code: '20040020',
      city: 'Rio de Janeiro',
      state: 'RJ',
      country: 'BR'
    },
  })

  resultados.etapa_2_cliente = cliente
  if (!cliente.success) return NextResponse.json({ ok: false, etapa: 'cliente', detalhes: resultados })

  // ── ETAPA 3: Pedido PIX com split de 2% ────────────────────────
  const valorCentavos = 100
  const pedido = await criarPedido({
    code: `teste-${sufixo}`,
    clienteId: cliente.customerId,
    itens: [{ amount: valorCentavos, description: 'Teste de integração', quantity: 1, code: 'teste-001' }],
    metodo: { tipo: 'pix', expiresInSeconds: 3600 },
    split: [
      {
        recipientId: recebedor.recipientId,
        amount: 98,
        type: 'percentage',
        options: {
          liable: true,
          chargeProcessingFee: true,
          chargeRemainderFee: false,
        },
      },
    ],
    metadata: { origem: 'teste-fumaca-arxum' },
  })

  resultados.etapa_3_pedido = pedido

  return NextResponse.json({
    ok: recebedor.success && cliente.success && pedido.success,
    resumo: 'Teste concluído. Verifique os detalhes abaixo.',
    detalhes: resultados,
  })
}