import Link from 'next/link'
import { ArrowLeft, FileQuestion } from 'lucide-react'
import { ArxumBrand } from '@/components/arxum-brand'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#070b0f] px-6 text-center">
      <div className="mb-12">
        <ArxumBrand />
      </div>
      
      <div className="grid size-24 place-items-center rounded-full bg-[#0d9488]/10 text-[#0d9488]">
        <FileQuestion className="size-10" />
      </div>
      
      <h1 className="mt-8 text-4xl font-bold tracking-[-.03em] text-white sm:text-5xl">Página não encontrada</h1>
      
      <p className="mt-4 max-w-md text-sm leading-6 text-[#8aa0ad]">
        O endereço que você digitou não existe, foi removido ou está incorreto. 
        Verifique o link ou volte para a página inicial.
      </p>
      
      <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-[#0d9488] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0f766e]"
        >
          <ArrowLeft className="size-4" /> Voltar para o início
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-6 py-3 text-sm font-semibold text-[#c7d5db] transition hover:border-white/30 hover:text-white"
        >
          Ir para o login
        </Link>
      </div>
    </div>
  )
}