import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

const SLUGS_RESERVADOS = new Set([
  'arxum', 'login', 'cadastro', 'matricula', 'eduflix', 'sala-virtual', 'loja',
  'responsavel', 'dashboard', 'admin', 'super-admin', 'escola', 'aluno',
  'professor', 'primeiro-acesso', 'noticias', 'formulario',
])

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return await updateSession(request)
  }

  const match = pathname.match(/^\/edu\/([^/]+)(\/.*)?$/)
  if (match) {
    const slug = match[1]
    const resto = match[2]

    if (!SLUGS_RESERVADOS.has(slug)) {
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-escola-slug', slug)

      if (!resto || resto === '/') {
        const url = request.nextUrl.clone()
        url.pathname = '/escola'
        return NextResponse.rewrite(url, { request: { headers: requestHeaders } })
      }

      const url = request.nextUrl.clone()
      url.pathname = resto
      return NextResponse.rewrite(url, { request: { headers: requestHeaders } })
    }
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}