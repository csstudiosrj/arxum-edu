'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArxumBrand } from '@/components/arxum-brand'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: auth, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError || !auth.user) {
      setError('E-mail ou senha incorretos.')
      setLoading(false)
      return
    }

    const { data: perfil } = await supabase
      .from('perfis')
      .select('papel')
      .eq('id', auth.user.id)
      .maybeSingle()

    if (perfil?.papel === 'super_admin') {
      router.push('/super-admin')
    } else if (perfil?.papel === 'aluno') {
      router.push('/aluno')
    } else if (perfil?.papel === 'responsavel') {
      router.push('/responsavel')
    } else if (perfil?.papel === 'professor') {
      router.push('/professor')
    } else {
      router.push('/dashboard')
    }

    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070b0f] px-6">
      <div className="w-full max-w-md rounded-2xl border border-white/[.08] bg-[#111820] p-8">
        <div className="mb-8 text-center">
          <ArxumBrand />
        </div>

        <h1 className="text-center text-2xl font-bold text-white">Acesse sua conta</h1>
        <p className="mt-2 text-center text-sm text-[#8aa0ad]">Entre com suas credenciais para continuar</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#c7d5db]">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-white/10 bg-[#0b1115] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#5e7a94] focus:border-[#0d9488]"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#c7d5db]">Senha</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-white/10 bg-[#0b1115] px-3 py-2.5 pr-16 text-sm text-white outline-none placeholder:text-[#5e7a94] focus:border-[#0d9488]"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#5e7a94] hover:text-white"
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>
          )}

          <div className="flex justify-end">
            <Link href="#" className="text-xs text-[#0d9488] hover:text-[#14b8a6]">Esqueci minha senha</Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#0d9488] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f766e] disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-[#5e7a94]">
          Não tem conta?{' '}
          <Link href="/cadastro" className="text-[#0d9488] hover:text-[#14b8a6]">Criar escola</Link>
        </div>
      </div>
    </div>
  )
}