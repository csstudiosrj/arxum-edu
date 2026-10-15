import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Rotas públicas (não precisam de login)
  if (path === '/login' || path === '/matricula' || path === '/') {
    return supabaseResponse
  }

  const protectedPaths = ['/dashboard', '/admin', '/responsavel', '/super-admin', '/sala-virtual', '/eduflix']
  const isProtected = protectedPaths.some((p) => path.startsWith(p))

  // Se não tem usuário e tenta acessar rota protegida, vai pro login
  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Proteção de rotas por perfil (role)
  if (user) {
    // Pega o perfil do usuário (se não tiver, assume que é responsável por padrão)
    const role = user.user_metadata?.role || 'responsavel'

    // Impede Responsável de acessar área Admin
    if ((path.startsWith('/admin') || path.startsWith('/dashboard')) && role !== 'admin' && role !== 'super_admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/responsavel'
      return NextResponse.redirect(url)
    }

    // Impede Admin de acessar área de Responsável
    if (path.startsWith('/responsavel') && role === 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    // Protege área do Super Admin
    if (path.startsWith('/super-admin') && role !== 'super_admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}