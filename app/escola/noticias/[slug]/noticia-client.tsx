'use client'

import Link from 'next/link'
import { ArrowLeft, Calendar, Tag } from 'lucide-react'
import { PublicFooter, PublicHeader } from '@/components/arxum-brand'
import { getFontePar } from '@/lib/fonts'
import type { Noticia } from '@/lib/cms/defaults'

export function NoticiaClient({
  escolaNome,
  slug,
  fontePar,
  noticia,
  cor,
  logoUrl,
}: {
  escolaNome: string
  slug: string
  fontePar: string | null
  noticia: Noticia
  cor: string
  logoUrl: string | null
}) {
  const base = `/escola`
  const par = getFontePar(fontePar)

  const estiloFontes = {
    '--font-heading-active': `var(${par.headingVar})`,
    '--font-body-active': `var(${par.bodyVar})`,
    '--cor-primaria': cor,
  } as React.CSSProperties

  const paragrafos = noticia.corpo.split('\n\n').filter(Boolean)

  return (
    <div className="min-h-screen bg-[#070b0f] text-[#e7f1f5]" style={estiloFontes}>
      <PublicHeader slug={slug} cor={cor} logoUrl={logoUrl} escolaNome={escolaNome} />

      <main className="mx-auto max-w-4xl px-6 py-16 lg:px-8">
        <Link href={`${base}/noticias`} className="inline-flex items-center gap-2 text-sm text-[#8aa0ad] hover:text-white mb-10">
          <ArrowLeft className="size-4" /> Voltar para notícias
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: cor }}>
              <Calendar className="size-3.5" /> {noticia.data}
            </span>
            {noticia.categoria && (
              <span className="flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold" style={{ borderColor: `${cor}50`, color: cor }}>
                <Tag className="size-3" /> {noticia.categoria}
              </span>
            )}
          </div>
          <h1 className="font-heading text-3xl font-bold leading-tight tracking-[-.03em] text-white sm:text-4xl">
            {noticia.titulo}
          </h1>
          {noticia.resumo && (
            <p className="mt-4 text-lg leading-8 text-[#8aa0ad]">{noticia.resumo}</p>
          )}
        </div>

        {noticia.imagem_url && (
          <div className="mb-10 aspect-[21/9] w-full overflow-hidden rounded-2xl border border-white/[.08]">
            <img src={noticia.imagem_url} alt={noticia.titulo} className="h-full w-full object-cover" />
          </div>
        )}

        {paragrafos.length > 0 && (
          <div className="prose prose-invert max-w-none">
            {paragrafos.map((p, i) => (
              <p key={i} className="mb-6 text-base leading-8 text-[#c7d5db]">{p}</p>
            ))}
          </div>
        )}
      </main>

      <PublicFooter slug={slug} cor={cor} escolaNome={escolaNome} />
    </div>
  )
}