'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PublicFooter, PublicHeader } from '@/components/arxum-brand'
import { getFontePar } from '@/lib/fonts'
import type { PaginaExtra } from '@/lib/cms/defaults'

export function PaginaExtraClient({
  escolaNome,
  slug,
  fontePar,
  pagina,
  cor,
  logoUrl,
}: {
  escolaNome: string
  slug: string
  fontePar: string | null
  pagina: PaginaExtra
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

  return (
    <div className="min-h-screen bg-[#070b0f] text-[#e7f1f5]" style={estiloFontes}>
      <PublicHeader slug={slug} cor={cor} logoUrl={logoUrl} escolaNome={escolaNome} />

      <main className="mx-auto max-w-4xl px-6 py-16 lg:px-8">
        <Link href={base} className="inline-flex items-center gap-2 text-sm text-[#8aa0ad] hover:text-white mb-10">
          <ArrowLeft className="size-4" /> Voltar para a home
        </Link>

        <div className="mb-10">
          <h1 className="font-heading text-4xl font-bold tracking-[-.04em] text-white sm:text-5xl">
            {pagina.titulo}
          </h1>
        </div>

        <div 
          className="prose prose-invert max-w-none prose-headings:font-heading prose-headings:text-white prose-p:text-[#c7d5db] prose-p:leading-8 prose-a:text-[var(--cor-primaria)] hover:prose-a:brightness-110 prose-strong:text-white prose-ul:text-[#c7d5db] prose-ol:text-[#c7d5db]"
          dangerouslySetInnerHTML={{ __html: pagina.conteudo_html }} 
        />
      </main>

      <PublicFooter slug={slug} cor={cor} escolaNome={escolaNome} />
    </div>
  )
}