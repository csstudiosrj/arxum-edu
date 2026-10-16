'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ByArxum } from '@/components/arxum-brand'
import { buscarMarcaPorEmail } from './actions'
import type { MarcaEscola } from '@/lib/auth/marca'

export function LoginClient({
  marcaInicial,
  escolaSlug,
}: {
  marcaInicial: MarcaEscola | null
  escolaSlug: string
}) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [marca, setMarca] = useState<MarcaEscola | null>(marcaInicial)
  const [detectando, setDetectando] = useState(false)

  // Se veio com slug mas não achou a escola, avisa
  useEffect(() => {
    if (escolaSlug && !marcaInicial) {
      setError('Escola não encontrada. Verifique o link.')
    }
  }, [escolaSlug, marcaInicial])

  async function detectarMarcaPeloEmail() {
    if (marca || !email.includes('@')) return
    setDetectando(true)
    const detectada = await buscarMarcaPorEmail(email)
    setDetectando(false)
    if (detectada && detectada.usaBranding) {
      setMarca(detectada)
    }
  }

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

  const cor = marca?.usaBranding ? marca.corPrimaria : '#0d9488'
  const temLogo = marca?.usaBranding && marca.logoUrl

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070b0f] px-6 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-white/[.08] bg-[#111820] p-8">
          <div className="mb-8 flex flex-col items-center gap-3">
            {temLogo ? (
              <>
                <img
                  src={marca!.logoUrl!}
                  alt={marca!.nome}
                  className="h-14 w-auto max-w-[220px] object-contain"
                />
                <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#82939a]">
                  {marca!.nome}
                </p>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span
                    className="font-syne text-2xl font-black tracking-[-.03em]"
                    style={{ color: cor }}
                  >
                    ARXUM
                  </span>
                  <span className="font-syne text-2xl font-black tracking-[-.03em] text-white">
                    Edu
                  </span>
                </div>
              </div>
            )}
          </div>

          <h1 className="text-center text-2xl font-bold text-white">Acesse sua conta</h1>
          <p className="mt-2 text-center text-sm text-[#8aa0ad]">
            Entre com suas credenciais para continuar
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#c7d5db]">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={detectarMarcaPeloEmail}
                required
                className="w-full rounded-lg border border-white/10 bg-[#0b1115] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#5e7a94] focus:border-[#0d9488]"
                placeholder="seu@email.com"
              />
              {detectando && (
                <p className="mt-1.5 text-xs text-[#5e7a94]">Identificando escola...</p>
              )}
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
              <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {error}
              </p>
            )}

            <div className="flex justify-end">
              <Link
                href="/esqueci-senha"
                className="text-xs transition hover:opacity-80"
                style={{ color: cor }}
              >
                Esqueci minha senha
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50"
              style={{ backgroundColor: cor }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-[#5e7a94]">
            Não tem conta?{' '}
            <Link
              href="/cadastro"
              className="transition hover:opacity-80"
              style={{ color: cor }}
            >
              Criar escola
            </Link>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <ByArxum />
        </div>
      </div>
    </div>
  )
}