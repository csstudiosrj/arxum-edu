'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PublicFooter, PublicHeader } from '@/components/arxum-brand'
import { getFontePar } from '@/lib/fonts'
import type { PaginaAEscola } from '@/lib/cms/defaults'

export function AEscolaClient({
  escolaNome,
  slug,
  fontePar,
  pagina,
}: {
  escolaNome: string
  slug: string
  fontePar: string | null
  pagina: PaginaAEscola
}) {
  const base = `/edu/${slug}`
  const par = getFontePar(fontePar)

  const estiloFontes = {
    '--font-heading-active': `var(${par.headingVar})`,
    '--font-body-active': `var(${par.bodyVar})`,
  } as React.CSSProperties

  const paragrafos = pagina.texto.split('\n\n').filter(Boolean)

  return (
    <div className="min-h-screen bg-[#070b0f] text-[#e7f1f5]" style={estiloFontes}>
      <PublicHeader slug={slug} />

      <main className="mx-auto max-w-5xl px-6 py-16 lg:px-8">
        <Link href={base} className="inline-flex items-center gap-2 text-sm text-[#8aa0ad] hover:text-white">
          <ArrowLeft className="size-4" /> Voltar para a home
        </Link>

        <div className="mt-10 mb-12">
          {pagina.eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#0d9488]">{pagina.eyebrow}</p>
          )}
          <h1 className="mt-3 font-heading text-4xl font-bold tracking-[-.04em] text-white sm:text-5xl">
            {pagina.titulo}
          </h1>
          {pagina.subtitulo && (
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#8aa0ad]">{pagina.subtitulo}</p>
          )}
        </div>

        {pagina.imagem_url && (
          <div className="mb-10 aspect-[21/9] w-full overflow-hidden rounded-2xl border border-white/[.08]">
            <img src={pagina.imagem_url} alt={pagina.titulo} className="h-full w-full object-cover" />
          </div>
        )}

        {paragrafos.length > 0 && (
          <div className="max-w-3xl">
            {paragrafos.map((p, i) => (
              <p key={i} className="mb-5 text-base leading-8 text-[#c7d5db]">{p}</p>
            ))}
          </div>
        )}

        {pagina.galeria.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-6 font-heading text-2xl font-bold text-white">Nossa escola em imagens</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pagina.galeria.map((foto) => (
                <div key={foto.id} className="overflow-hidden rounded-xl border border-white/[.08] bg-[#0e151a]">
                  <div className="aspect-[4/3]">
                    <img src={foto.url} alt={foto.legenda} className="h-full w-full object-cover" />
                  </div>
                  {foto.legenda && (
                    <p className="p-3 text-xs text-[#82939a]">{foto.legenda}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <PublicFooter slug={slug} />
    </div>
  )
}