import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state') // Aqui está o ID da escola que enviamos antes

    if (!code || !state) {
      return NextResponse.redirect(new URL('/admin/configuracoes?erro=callback_invalido', request.url))
    }

    const clientId = process.env.MERCADOPAGO_CLIENT_ID
    const clientSecret = process.env.MERCADOPAGO_CLIENT_SECRET
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.arxum.com.br'
    const redirectUri = `${baseUrl}/edu/api/auth/mercadopago/callback`

    // 1. Troca o 'code' pelo 'access_token' e 'refresh_token'
    const tokenRes = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    })

    const tokenData = await tokenRes.json()

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('Erro na troca de token MP:', tokenData)
      return NextResponse.redirect(new URL('/admin/configuracoes?erro=token_mp', request.url))
    }

    // 2. Salva os tokens e o user_id no banco de dados da escola
    const admin = createAdminClient()
    const { error } = await admin
      .from('escolas')
      .update({
        mercadopago_access_token: tokenData.access_token,
        mercadopago_refresh_token: tokenData.refresh_token,
        mercadopago_user_id: tokenData.user_id?.toString() || null,
        gateway_preferido: 'mercadopago', // Muda o gateway da escola para o MP
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', state)

    if (error) {
      console.error('Erro ao salvar tokens MP no banco:', error)
      return NextResponse.redirect(new URL('/admin/configuracoes?erro=salvar_tokens', request.url))
    }

    // 3. Sucesso! Redireciona de volta para a tela de configurações
    return NextResponse.redirect(new URL('/admin/configuracoes?mp=sucesso', request.url))
  } catch (error) {
    console.error('Erro no callback MP:', error)
    return NextResponse.redirect(new URL('/admin/configuracoes?erro=interno', request.url))
  }
}
