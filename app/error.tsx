'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'
import { ArxumBrand } from '@/components/arxum-brand'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Aqui você poderia integrar com o Sentry ou LogRocket no futuro
    console.error('Erro capturado pela Error Boundary:', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#070b0f] px-6 text-center">
      <div className="mb-12">
        <ArxumBrand />
      </div>

      <div className="grid size-24 place-items-center rounded-full bg-[#fee2e2]/10 text-[#dc2626]">
        <AlertTriangle className="size-10" />
      </div>

      <h1 className="mt-8 text-4xl font-bold tracking-[-.03em] text-white sm:text-5xl">Ops, algo deu errado</h1>

      <p className="mt-4 max-w-md text-sm leading-6 text-[#8aa0ad]">
        Ocorreu um erro inesperado ao carregar esta página. Nossa equipe já foi notificada. 
        Você pode tentar novamente ou voltar para a página inicial.
      </p>

      <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-lg bg-[#0d9488] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0f766e]"
        >
          <RefreshCw className="size-4" /> Tentar novamente
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-6 py-3 text-sm font-semibold text-[#c7d5db] transition hover:border-white/30 hover:text-white"
        >
          <ArrowLeft className="size-4" /> Voltar para o início
        </Link>
      </div>
    </div>
  )
}