'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { PublicFooter, PublicHeader } from '@/components/arxum-brand'
import { getFontePar } from '@/lib/fonts'
import type { ConteudoHome } from '@/lib/cms/defaults'

export function NoticiasClient({
  escolaNome,
  slug,
  fontePar,
  blocoNoticias,
  cor,
  logoUrl,
}: {
  escolaNome: string
  slug: string
  fontePar: string | null
  blocoNoticias: ConteudoHome['blocos']['noticias']
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

  const noticias = blocoNoticias.itens

  return (
    <div className="min-h-screen bg-[#070b0f] text-[#e7f1f5]" style={estiloFontes}>
      <PublicHeader slug={slug} cor={cor} logoUrl={logoUrl} escolaNome={escolaNome} />

      <main className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <Link href={base} className="inline-flex items-center gap-2 text-sm text-[#8aa0ad] hover:text-white mb-10">
          <ArrowLeft className="size-4" /> Voltar para a home
        </Link>

        <div className="mb-12">
          {blocoNoticias.eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-[.18em]" style={{ color: cor }}>{blocoNoticias.eyebrow}</p>
          )}
          <h1 className="mt-3 font-heading text-4xl font-bold tracking-[-.04em] text-white sm:text-5xl">
            {blocoNoticias.titulo}
          </h1>
        </div>

        {noticias.length === 0 ? (
          <div className="rounded-xl border border-white/[.08] bg-[#0e151a] p-12 text-center">
            <p className="text-sm text-[#82939a]">Nenhuma notícia publicada ainda.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {noticias.map((n, index) => {
              const newsSlug = n.slug || n.id
              return (
                <Link
                  key={n.id}
                  href={`${base}/noticias/${newsSlug}`}
                  className="group flex flex-col overflow-hidden rounded-xl border border-white/[.08] bg-[#0e151a] transition hover:border-white/20"
                >
                  <div className={`relative h-48 ${n.imagem_url ? '' : index % 3 === 0 ? 'bg-gradient-to-br from-[#154b45] to-[#132733]' : index % 3 === 1 ? 'bg-gradient-to-br from-[#26334c] to-[#141d2b]' : 'bg-gradient-to-br from-[#403b28] to-[#20291f]'}`}>
                    {n.imagem_url && (
                      <img src={n.imagem_url} alt={n.titulo} className="h-full w-full object-cover transition group-hover:scale-105" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-semibold tracking-widest" style={{ color: cor }}>{n.data}</p>
                      {n.categoria && (
                        <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold" style={{ borderColor: `${cor}50`, color: cor }}>
                          {n.categoria}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-3 font-heading text-lg font-bold leading-6 text-white">{n.titulo}</h3>
                    {n.resumo && (
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#8196a2]">{n.resumo}</p>
                    )}
                    <span className="mt-auto pt-4 inline-flex items-center gap-1 text-sm font-medium" style={{ color: cor }}>
                      Ler mais <ArrowRight className="size-3.5" />
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>

      <PublicFooter slug={slug} cor={cor} escolaNome={escolaNome} />
    </div>
  )
}