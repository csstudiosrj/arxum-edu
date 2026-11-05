import { NextResponse, type NextRequest } from 'next/server'
import { getEscolaDoUsuario } from '@/lib/auth/escola-atual'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // 1. Garante que o usuário está logado e tem uma escola
    const escola = await getEscolaDoUsuario()
    if (!escola) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // 2. Monta a URL de autorização do Mercado Pago
    const clientId = process.env.MERCADOPAGO_CLIENT_ID
    if (!clientId) {
      return NextResponse.json({ error: 'Client ID do Mercado Pago não configurado.' }, { status: 500 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.arxum.com.br'
    const redirectUri = `${baseUrl}/edu/api/auth/mercadopago/callback`
    
    // O state é usado para segurança. Vamos passar o ID da escola para saber quem está conectando.
    const state = escola.id

    const authUrl = new URL('https://auth.mercadopago.com.br/authorization')
    authUrl.searchParams.append('client_id', clientId)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('platform_id', 'mp')
    authUrl.searchParams.set('state', state)
    authUrl.searchParams.set('redirect_uri', redirectUri)

    // 3. Redireciona a escola para autorizar
    return NextResponse.redirect(authUrl.toString())
  } catch (error) {
    console.error('Erro ao iniciar OAuth MP:', error)
    return NextResponse.redirect(new URL('/admin/configuracoes?erro=oauth', request.url))
  }
}
