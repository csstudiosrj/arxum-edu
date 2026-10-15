'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Check, Copy, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { PublicHeader, PublicFooter } from '@/components/arxum-brand'

export default function SucessoPage() {
  const params = useSearchParams()
  const protocolo = params.get('protocolo') || ''
  const [copiado, setCopiado] = useState(false)

  function copiar() {
    navigator.clipboard.writeText(protocolo)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="min-h-screen bg-[#070b0f] text-[#e7f1f5]">
      <PublicHeader />
      <main className="mx-auto flex max-w-2xl flex-col items-center px-6 py-24 lg:px-8">
        <div className="grid size-16 place-items-center rounded-full bg-[#0d9488]/15 text-[#0d9488]">
          <Check className="size-8" />
        </div>
        <h1 className="mt-6 text-center font-syne text-4xl font-bold tracking-[-.04em] text-white">
          Inscrição enviada!
        </h1>
        <p className="mt-4 max-w-md text-center text-sm leading-6 text-[#8aa0ad]">
          Recebemos os dados do aluno. A escola fará a análise das informações e entrará em contato pelo e-mail e telefone informados.
        </p>

        <div className="mt-10 w-full rounded-xl border border-white/[.08] bg-[#0e151a] p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#5e7a94]">
            Número de protocolo
          </p>
          <div className="mt-3 flex items-center justify-between gap-4">
            <span className="font-mono text-2xl font-bold tracking-wider text-white">
              {protocolo}
            </span>
            <button
              onClick={copiar}
              className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-[#c7d5db] transition hover:border-[#0d9488] hover:text-white"
            >
              {copiado ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copiado ? 'Copiado' : 'Copiar'}
            </button>
          </div>
          <p className="mt-4 text-xs leading-5 text-[#82939a]">
            Guarde este número. Você poderá usá-lo para consultar o status da inscrição.
          </p>
        </div>

        <div className="mt-8 space-y-3 rounded-xl border border-white/[.08] bg-[#0e151a] p-6 text-left">
          <p className="text-xs font-bold uppercase tracking-wider text-[#0d9488]">Próximos passos</p>
          <ol className="space-y-3 text-sm text-[#c7d5db]">
            <li className="flex gap-3"><span className="text-[#0d9488]">1.</span> A escola analisará sua inscrição e os documentos enviados.</li>
            <li className="flex gap-3"><span className="text-[#0d9488]">2.</span> Você receberá um e-mail informando se haverá entrevista ou avaliação.</li>
            <li className="flex gap-3"><span className="text-[#0d9488]">3.</span> Após a aprovação, você assinará o contrato e receberá o acesso à área restrita.</li>
          </ol>
        </div>

        <Link
          href="/"
          className="mt-10 flex items-center gap-2 rounded-lg bg-[#0d9488] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0f766e]"
        >
          Voltar para a página inicial <ArrowRight className="size-4" />
        </Link>
      </main>
      <PublicFooter />
    </div>
  )
}