'use client'

import Link from 'next/link'
import { ArrowLeft, Check, ArrowRight } from 'lucide-react'
import type { PlanoPublico } from '@/lib/planos-publicos'

function formatarPreco(centavos: number): string {
  if (centavos === 0) return 'Sob consulta'
  return (
    (centavos / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }) + '/mês'
  )
}

export function PlanosClient({ planos }: { planos: PlanoPublico[] }) {
  return (
    <main className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-20 font-sans">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
          Escolha o plano ideal para sua escola
        </h1>
        <p className="mt-4 text-lg text-[#8aa0ad]">
          Sem taxa de setup. Teste grátis por 14 dias. Cancele quando quiser.
        </p>
      </div>

      {planos.length === 0 ? (
        <p className="text-center text-[#82939a]">Nenhum plano disponível no momento.</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-4 md:grid-cols-2">
          {planos.map((p) => (
            <div
              key={p.id}
              className={`relative flex flex-col rounded-2xl border p-6 ${
                p.destaque
                  ? 'border-[#0d9488] bg-[#0d9488]/5'
                  : 'border-white/[.08] bg-[#0e151a]'
              }`}
            >
              {p.destaque && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#0d9488] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  Mais escolhido
                </div>
              )}
              <h3 className="text-xl font-bold text-white">{p.nome}</h3>
              {p.descricao && (
                <p className="mt-2 text-sm text-[#82939a] h-10">{p.descricao}</p>
              )}

              <div className="mt-6 mb-6 border-b border-white/[.08] pb-6">
                <span className="text-3xl font-bold text-white">
                  {formatarPreco(p.preco_centavos)}
                </span>
              </div>

              {p.recursos.length > 0 && (
                <ul className="flex-1 space-y-3 mb-8">
                  {p.recursos.map((f) => (
                    <li key={f} className="flex gap-2 text-sm text-[#c7d5db]">
                      <Check className="size-4 shrink-0 text-[#0d9488]" />
                      {f}
                    </li>
                  ))}
                </ul>
              )}

              <Link
                href={`/cadastro?plano=${p.slug}`}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition ${
                  p.destaque
                    ? 'bg-[#0d9488] text-white hover:bg-[#0f766e]'
                    : 'border border-white/20 bg-transparent text-white hover:bg-white/5'
                }`}
              >
                Assinar {p.nome} <ArrowRight className="size-4" />
              </Link>
            </div>
          ))}
        </div>
      )}

      <div className="mt-12 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[#8aa0ad] hover:text-white transition"
        >
          <ArrowLeft className="size-4" /> Voltar para o início
        </Link>
      </div>
    </main>
  )
}