import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  const protectedPaths = [
    '/dashboard', '/admin', '/responsavel', '/super-admin',
    '/sala-virtual', '/aluno', '/professor',
  ]
  
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path))

  // 1. Se não está logado e tenta acessar rota protegida -> Login
  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 2. Se está logado, precisamos verificar o papel (RBAC)
  if (user) {
    // Usamos o admin client no middleware (Edge) para garantir que o RLS não bloqueie a leitura do perfil
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: perfil } = await admin
      .from('perfis')
      .select('papel')
      .eq('id', user.id)
      .maybeSingle()

    const papel = perfil?.papel || 'desconhecido'

    // Bloqueio: Admin
    if (pathname.startsWith('/admin')) {
      const papeisAdmin = ['admin_escola', 'direcao', 'coordenacao', 'secretaria', 'financeiro']
      if (!papeisAdmin.includes(papel)) {
        return NextResponse.redirect(new URL('/login', request.url)) // Ou redirecionar para o portal dele
      }
    }

    // Bloqueio: Super Admin
    if (pathname.startsWith('/super-admin') && papel !== 'super_admin') {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Bloqueio: Professor (Coordenção/Direção também acessam)
    if (pathname.startsWith('/professor') && !['professor', 'coordenacao', 'direcao'].includes(papel)) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Bloqueio: Aluno
    if (pathname.startsWith('/aluno') && papel !== 'aluno') {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Bloqueio: Responsável
    if (pathname.startsWith('/responsavel') && papel !== 'responsavel') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return supabaseResponse
}