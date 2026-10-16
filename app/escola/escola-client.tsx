'use client'

import Link from 'next/link'
import { ArrowRight, BookOpen, FlaskConical, HeartHandshake, Landmark, Lightbulb, Medal, Sparkles, type LucideIcon } from 'lucide-react'
import { PublicFooter, PublicHeader } from '@/components/arxum-brand'
import { HeroCarrossel } from '@/components/hero-carrossel'
import { getFontePar } from '@/lib/fonts'
import type { ConteudoHome } from '@/lib/cms/defaults'

const ICONES_DISPONIVEIS: LucideIcon[] = [
  Sparkles, BookOpen, FlaskConical, Lightbulb, HeartHandshake, Medal, Landmark,
]

function iconePor(key: string, lista: LucideIcon[]): LucideIcon {
  const soma = key.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return lista[soma % lista.length]
}

function BlocoHero({ bloco, base, cor }: { bloco: ConteudoHome['blocos']['hero']; base: string; cor: string }) {
  const temBanners = bloco.banners.length > 0

  return (
    <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-24 pt-16 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:pb-32 lg:pt-24">
      <div>
        <h1 className="max-w-2xl font-heading text-5xl font-bold leading-[1.02] tracking-[-.06em] text-white sm:text-6xl">
          {bloco.titulo}{' '}
          {bloco.titulo_destaque && <span style={{ color: cor }}>{bloco.titulo_destaque}</span>}
        </h1>
        {bloco.subtitulo && (
          <p className="mt-7 max-w-lg text-lg leading-8 text-[#8aa0ad]">{bloco.subtitulo}</p>
        )}
        <div className="mt-9 flex flex-wrap gap-3">
          {bloco.cta_primario_label && (
            <Link
              href={`${base}${bloco.cta_primario_href.startsWith('/') ? bloco.cta_primario_href : `/${bloco.cta_primario_href}`}`}
              className="rounded-lg px-5 py-3 text-sm font-semibold text-white transition"
              style={{ backgroundColor: cor }}
            >
              {bloco.cta_primario_label} <ArrowRight className="ml-2 inline size-4" />
            </Link>
          )}
          {bloco.cta_secundario_label && (
            <a
              href={bloco.cta_secundario_href}
              className="rounded-lg border border-white/10 px-5 py-3 text-sm font-semibold text-[#c7d5db] transition hover:border-white/30 hover:text-white"
            >
              {bloco.cta_secundario_label}
            </a>
          )}
        </div>
      </div>

      <div className="relative">
        {temBanners ? (
          <HeroCarrossel banners={bloco.banners} intervalo={bloco.intervalo_segundos} />
        ) : (
          <div className="relative min-h-[360px] overflow-hidden rounded-2xl border border-white/10 bg-[#101a20] p-5 shadow-2xl">
            <div className="absolute -right-16 -top-20 size-72 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: cor }} />
            <div className="relative flex h-full min-h-[320px] flex-col justify-between rounded-xl border border-white/10 bg-gradient-to-br from-[#1b3033] via-[#132127] to-[#0b1115] p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#9eb2bb]">ARXUM / 2026</span>
                <span className="rounded-full border px-3 py-1 text-[10px] uppercase tracking-widest" style={{ borderColor: `${cor}50`, color: cor }}>
                  Aprender · Criar
                </span>
              </div>
              <div>
                <p className="font-heading text-4xl font-bold tracking-tight text-white">
                  O futuro começa<br /><span style={{ color: cor }}>aqui.</span>
                </p>
                <div className="mt-8 flex gap-2">
                  <div className="h-1 w-16 rounded-full" style={{ backgroundColor: cor }} />
                  <div className="h-1 w-8 rounded-full bg-white/20" />
                  <div className="h-1 w-3 rounded-full bg-white/20" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function BlocoSegmentos({ bloco, cor }: { bloco: ConteudoHome['blocos']['segmentos']; cor: string }) {
  return (
    <section id="segmentos" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
      <div className="mb-10 flex items-end justify-between gap-6">
        <div>
          {bloco.eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-[.18em]" style={{ color: cor }}>{bloco.eyebrow}</p>
          )}
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-[-.04em] text-white">{bloco.titulo}</h2>
        </div>
        {bloco.descricao && (
          <p className="hidden max-w-sm text-sm leading-6 text-[#8aa0ad] md:block">{bloco.descricao}</p>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {bloco.itens.map((item) => {
          const Icon = iconePor(item.id, ICONES_DISPONIVEIS)
          return (
            <article key={item.id} className="group rounded-xl border border-white/[.08] bg-[#0e151a] p-6 transition hover:-translate-y-1">
              <div className="mb-12 grid size-10 place-items-center rounded-lg" style={{ backgroundColor: `${cor}15`, color: cor }}>
                <Icon className="size-5" />
              </div>
              <h3 className="font-heading text-lg font-bold text-white">{item.titulo}</h3>
              <p className="mt-2 text-sm leading-6 text-[#8196a2]">{item.descricao}</p>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function BlocoDiferenciais({ bloco, escolaNome, cor }: { bloco: ConteudoHome['blocos']['diferenciais']; escolaNome: string; cor: string }) {
  const titulo = bloco.titulo.includes('{escola}')
    ? bloco.titulo.replace('{escola}', escolaNome)
    : bloco.titulo

  return (
    <section id="a-escola" className="border-y border-white/[.07] bg-[#0b1115] px-6 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {bloco.eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[.18em]" style={{ color: cor }}>{bloco.eyebrow}</p>
        )}
        <h2 className="mt-3 max-w-xl font-heading text-3xl font-bold tracking-[-.04em] text-white">{titulo}</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {bloco.itens.map((item) => {
            const Icon = iconePor(item.id, ICONES_DISPONIVEIS)
            return (
              <div key={item.id} className="flex gap-4 rounded-xl border border-white/[.07] p-6">
                <div className="grid size-10 shrink-0 place-items-center rounded-lg" style={{ backgroundColor: `${cor}15`, color: cor }}>
                  <Icon className="size-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-white">{item.titulo}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#8196a2]">{item.descricao}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function BlocoNoticias({ bloco, base, cor }: { bloco: ConteudoHome['blocos']['noticias']; base: string; cor: string }) {
  const noticias = bloco.itens.slice(0, bloco.quantidade)
  if (noticias.length === 0) return null

  return (
    <section id="noticias" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
      <div className="flex items-end justify-between">
        <div>
          {bloco.eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-[.18em]" style={{ color: cor }}>{bloco.eyebrow}</p>
          )}
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-[-.04em] text-white">{bloco.titulo}</h2>
        </div>
        <Link href={`${base}/noticias`} className="hidden text-sm sm:block" style={{ color: cor }}>
          Ver todas <ArrowRight className="ml-1 inline size-4" />
        </Link>
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {noticias.map((n, index) => {
          const slug = n.slug || n.id
          return (
            <Link
              key={n.id}
              href={`${base}/noticias/${slug}`}
              className="group overflow-hidden rounded-xl border border-white/[.08] bg-[#0e151a] transition hover:border-white/20"
            >
              <div className={`relative h-36 ${n.imagem_url ? '' : index === 0 ? 'bg-gradient-to-br from-[#154b45] to-[#132733]' : index === 1 ? 'bg-gradient-to-br from-[#26334c] to-[#141d2b]' : 'bg-gradient-to-br from-[#403b28] to-[#20291f]'}`}>
                {n.imagem_url && (
                  <img src={n.imagem_url} alt={n.titulo} className="h-full w-full object-cover transition group-hover:scale-105" />
                )}
              </div>
              <div className="p-5">
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
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#8196a2]">{n.resumo}</p>
                )}
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium" style={{ color: cor }}>
                  Ler mais <ArrowRight className="size-3.5" />
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

function BlocoCtaFinal({ bloco, base, cor }: { bloco: ConteudoHome['blocos']['cta_final']; base: string; cor: string }) {
  return (
    <section className="mx-6 mb-20 rounded-2xl border px-6 py-16 text-center lg:mx-auto lg:max-w-7xl" style={{ borderColor: `${cor}30`, backgroundColor: `${cor}10` }}>
      {bloco.eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-[.18em]" style={{ color: cor }}>{bloco.eyebrow}</p>
      )}
      <h2 className="mx-auto mt-4 max-w-xl font-heading text-3xl font-bold tracking-[-.04em] text-white sm:text-4xl">
        {bloco.titulo}
      </h2>
      <Link
        href={`${base}${bloco.cta_href.startsWith('/') ? bloco.cta_href : `/${bloco.cta_href}`}`}
        className="mt-8 inline-block rounded-lg px-6 py-3 text-sm font-semibold text-white"
        style={{ backgroundColor: cor }}
      >
        {bloco.cta_label} <ArrowRight className="ml-2 inline size-4" />
      </Link>
    </section>
  )
}

export function EscolaClient({
  escolaNome,
  slug,
  fontePar,
  conteudo,
  cor,
  logoUrl,
}: {
  escolaNome: string
  slug: string
  fontePar: string | null
  conteudo: ConteudoHome
  cor: string
  logoUrl: string | null
}) {
  const base = `/edu/${slug}`
  const par = getFontePar(fontePar)

  const estiloFontes = {
    '--font-heading-active': `var(${par.headingVar})`,
    '--font-body-active': `var(${par.bodyVar})`,
    '--cor-primaria': cor,
  } as React.CSSProperties

  return (
    <div className="min-h-screen bg-[#070b0f] text-[#e7f1f5]" style={estiloFontes}>
      <PublicHeader slug={slug} cor={cor} logoUrl={logoUrl} escolaNome={escolaNome} />

      <main>
        {conteudo.ordem.map((key) => {
          const bloco = conteudo.blocos[key as keyof typeof conteudo.blocos]
          if (!bloco || !bloco.ativo) return null

          switch (key) {
            case 'hero':
              return <BlocoHero key={key} bloco={bloco as ConteudoHome['blocos']['hero']} base={base} cor={cor} />
            case 'segmentos':
              return <BlocoSegmentos key={key} bloco={bloco as ConteudoHome['blocos']['segmentos']} cor={cor} />
            case 'diferenciais':
              return <BlocoDiferenciais key={key} bloco={bloco as ConteudoHome['blocos']['diferenciais']} escolaNome={escolaNome} cor={cor} />
            case 'noticias':
              return <BlocoNoticias key={key} bloco={bloco as ConteudoHome['blocos']['noticias']} base={base} cor={cor} />
            case 'cta_final':
              return <BlocoCtaFinal key={key} bloco={bloco as ConteudoHome['blocos']['cta_final']} base={base} cor={cor} />
            default:
              return null
          }
        })}
      </main>

      <PublicFooter slug={slug} cor={cor} escolaNome={escolaNome} />
    </div>
  )
}