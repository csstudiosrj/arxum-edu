'use client'

import Link from 'next/link'
import { ArrowLeft, Building2, Library, FlaskConical, Dumbbell, Palette, Music, Utensils, Trees, type LucideIcon } from 'lucide-react'
import { PublicFooter, PublicHeader } from '@/components/arxum-brand'
import { getFontePar } from '@/lib/fonts'
import type { PaginaEstrutura } from '@/lib/cms/defaults'

const ICONES: LucideIcon[] = [Building2, Library, FlaskConical, Dumbbell, Palette, Music, Utensils, Trees]

function iconePor(key: string): LucideIcon {
  const soma = key.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return ICONES[soma % ICONES.length]
}

export function EstruturaClient({
  escolaNome,
  slug,
  fontePar,
  pagina,
}: {
  escolaNome: string
  slug: string
  fontePar: string | null
  pagina: PaginaEstrutura
}) {
  const base = `/edu/${slug}`
  const par = getFontePar(fontePar)

  const estiloFontes = {
    '--font-heading-active': `var(${par.headingVar})`,
    '--font-body-active': `var(${par.bodyVar})`,
  } as React.CSSProperties

  return (
    <div className="min-h-screen bg-[#070b0f] text-[#e7f1f5]" style={estiloFontes}>
      <PublicHeader slug={slug} />

      <main className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <Link href={base} className="inline-flex items-center gap-2 text-sm text-[#8aa0ad] hover:text-white">
          <ArrowLeft className="size-4" /> Voltar para a home
        </Link>

        <div className="mt-10 mb-12 max-w-3xl">
          {pagina.eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#0d9488]">{pagina.eyebrow}</p>
          )}
          <h1 className="mt-3 font-heading text-4xl font-bold tracking-[-.04em] text-white sm:text-5xl">
            {pagina.titulo}
          </h1>
          {pagina.subtitulo && (
            <p className="mt-5 text-lg leading-8 text-[#8aa0ad]">{pagina.subtitulo}</p>
          )}
        </div>

        {pagina.itens.length === 0 ? (
          <div className="rounded-xl border border-white/[.08] bg-[#0e151a] p-12 text-center">
            <p className="text-sm text-[#82939a]">Nenhum item de estrutura cadastrado ainda.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pagina.itens.map((item) => {
              const Icone = iconePor(item.id)
              return (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-xl border border-white/[.08] bg-[#0e151a] transition hover:border-[#0d9488]/40"
                >
                  {item.imagem_url ? (
                    <div className="aspect-video w-full overflow-hidden">
                      <img src={item.imagem_url} alt={item.titulo} className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-[#0d9488]/15 to-[#0f766e]/15">
                      <Icone className="size-12 text-[#0d9488]" />
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="font-heading text-lg font-bold text-white">{item.titulo}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#8196a2]">{item.descricao}</p>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>

      <PublicFooter slug={slug} />
    </div>
  )
}