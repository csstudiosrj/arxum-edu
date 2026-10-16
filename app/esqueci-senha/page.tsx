import { EsqueciSenhaClient } from './esqueci-senha-client'
import { ArxumBrand } from '@/components/arxum-brand'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Recuperar senha — ARXUM Edu',
}

export default function EsqueciSenhaPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070b0f] px-6">
      <div className="w-full max-w-md rounded-2xl border border-white/[.08] bg-[#111820] p-8">
        <div className="mb-6">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-xs text-[#8aa0ad] hover:text-white">
            <ArrowLeft className="size-3.5" /> Voltar para o login
          </Link>
        </div>

        <div className="mb-8 text-center">
          <ArxumBrand />
        </div>

        <EsqueciSenhaClient />
      </div>
    </div>
  )
}