'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Loader2, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ArxumBrand } from '@/components/arxum-brand'

type Estado = 'verificando' | 'pronto' | 'erro'

export function PrimeiroAcessoClient() {
  const router = useRouter()
  const [estado, setEstado] = useState<Estado>('verificando')
  const [nome, setNome] = useState<string>('')

  useEffect(() => {
    let ativo = true

    async function verificar() {
      try {
        const supabase = createClient()

        // O link mágico do Supabase já processa o token ao carregar a página
        // (os cookies de sessão ficam configurados). Aqui confirmamos a sessão.
        const { data: { user } } = await supabase.auth.getUser()

        if (!ativo) return

        if (!user) {
          setEstado('erro')
          return
        }

        const nomeUsuario = user.user_metadata?.nome || user.email?.split('@')[0] || ''
        setNome(nomeUsuario)
        setEstado('pronto')

        // Redireciona para o portal após uma pequena pausa
        setTimeout(() => {
          router.push('/aluno')
          router.refresh()
        }, 2200)
      } catch {
        if (ativo) setEstado('erro')
      }
    }

    verificar()

    return () => {
      ativo = false
    }
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070b0f] px-6">
      <div className="w-full max-w-md rounded-2xl border border-white/[.08] bg-[#111820] p-8 text-center">
        <div className="mb-8 flex justify-center">
          <ArxumBrand />
        </div>

        {estado === 'verificando' && (
          <>
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-[#0d9488]/15 text-[#0d9488]">
              <Loader2 className="size-7 animate-spin" />
            </div>
            <h1 className="mt-6 text-xl font-bold text-white">Verificando seu acesso...</h1>
            <p className="mt-2 text-sm text-[#8aa0ad]">Só um instante.</p>
          </>
        )}

        {estado === 'pronto' && (
          <>
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-[#0d9488]/15 text-[#0d9488]">
              <CheckCircle2 className="size-8" />
            </div>
            <h1 className="mt-6 text-2xl font-bold text-white">
              Bem-vindo{nome ? `, ${nome.split(' ')[0]}` : ''}!
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#8aa0ad]">
              Seu acesso foi confirmado. Estamos abrindo o seu portal...
            </p>
            <div className="mt-6 flex justify-center">
              <Loader2 className="size-5 animate-spin text-[#0d9488]" />
            </div>
            <div className="mt-8">
              <Link
                href="/aluno"
                className="inline-flex items-center gap-2 rounded-lg bg-[#0d9488] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0f766e]"
              >
                Ir para o portal <ArrowRight className="size-4" />
              </Link>
            </div>
          </>
        )}

        {estado === 'erro' && (
          <>
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-[#fee2e2]/15 text-[#dc2626]">
              <CheckCircle2 className="size-8" />
            </div>
            <h1 className="mt-6 text-2xl font-bold text-white">Link expirado ou inválido</h1>
            <p className="mt-3 text-sm leading-6 text-[#8aa0ad]">
              Este link já foi usado ou expirou. Entre em contato com a escola para receber um novo convite.
            </p>
            <div className="mt-8">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-5 py-2.5 text-sm font-semibold text-[#c7d5db] hover:border-white/30"
              >
                Ir para o login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}