import { RedefinirSenhaClient } from './redefinir-senha-client'
import { ArxumBrand } from '@/components/arxum-brand'

export const metadata = {
  title: 'Redefinir senha — ARXUM Edu',
}

export default function RedefinirSenhaPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070b0f] px-6">
      <div className="w-full max-w-md rounded-2xl border border-white/[.08] bg-[#111820] p-8">
        <div className="mb-8 text-center">
          <ArxumBrand />
        </div>
        <RedefinirSenhaClient />
      </div>
    </div>
  )
}