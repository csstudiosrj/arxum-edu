'use client'

import { useState } from 'react'
import { Play, Eye, X, ArrowLeft, Search } from 'lucide-react'
import Link from 'next/link'
import { ArxumBrand } from '@/components/arxum-brand'
import type { VideoaulaPublica } from './page'

const cores: string[] = [
  'from-[#0d9488] to-[#0f766e]',
  'from-[#0e7490] to-[#155e75]',
  'from-[#7c3aed] to-[#5b21b6]',
  'from-[#d97706] to-[#b45309]',
  'from-[#dc2626] to-[#991b1b]',
]

function corAleatoria(id: string): string {
  const soma = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return cores[soma % cores.length]
}

function toEmbed(url: string): string {
  if (url.includes('youtube.com/watch')) {
    const id = new URL(url).searchParams.get('v')
    return id ? `https://www.youtube.com/embed/${id}` : url
  }
  if (url.includes('youtu.be/')) {
    const id = url.split('youtu.be/')[1]?.split('?')[0]
    return id ? `https://www.youtube.com/embed/${id}` : url
  }
  if (url.includes('vimeo.com/')) {
    const id = url.split('vimeo.com/')[1]?.split('?')[0]
    return id ? `https://player.vimeo.com/video/${id}` : url
  }
  return url
}

export function EduflixClient({ videoaulas }: { videoaulas: VideoaulaPublica[] }) {
  const [assistindo, setAssistindo] = useState<VideoaulaPublica | null>(null)
  const [busca, setBusca] = useState('')

  const porDisciplina: Record<string, VideoaulaPublica[]> = {}
  videoaulas.forEach((v) => {
    if (!porDisciplina[v.disciplina]) porDisciplina[v.disciplina] = []
    porDisciplina[v.disciplina].push(v)
  })

  const filtradas = busca
    ? videoaulas.filter((v) => v.titulo.toLowerCase().includes(busca.toLowerCase()))
    : null

  const destaque = videoaulas[0]

  return (
    <div className="min-h-screen bg-[#070b0f] text-[#e7f1f5]">
      <header className="sticky top-0 z-10 border-b border-white/[.08] bg-[#070b0f]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-2 text-sm text-[#8aa0ad] hover:text-white">
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Voltar</span>
          </Link>
          <ArxumBrand />
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-white/10 bg-[#0b1115] px-3 py-2 sm:max-w-xs">
            <Search className="size-4 text-[#5e7a94]" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar videoaula"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#5e7a94]"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        {videoaulas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="grid size-16 place-items-center rounded-full bg-[#0d9488]/15 text-[#0d9488]">
              <Play className="size-7" />
            </div>
            <h2 className="mt-5 font-syne text-2xl font-bold text-white">Nenhuma videoaula disponível</h2>
            <p className="mt-2 max-w-md text-sm text-[#8aa0ad]">
              Assim que a escola publicar conteúdos, eles aparecerão aqui.
            </p>
          </div>
        ) : filtradas ? (
          <>
            <h2 className="mb-6 font-syne text-2xl font-bold text-white">
              {filtradas.length} resultado{filtradas.length !== 1 ? 's' : ''}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {filtradas.map((v) => <CardVideo key={v.id} video={v} onAssistir={() => setAssistindo(v)} />)}
            </div>
          </>
        ) : (
          <>
            {destaque && (
              <section className="mb-14">
                <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${corAleatoria(destaque.id)}`}>
                  <div className="absolute inset-0 bg-black/40" />
                  <div className="relative grid gap-8 p-8 md:grid-cols-[1fr_auto] md:items-end lg:p-12">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-[.18em] text-white/70">{destaque.disciplina}</span>
                      <h1 className="mt-3 font-syne text-4xl font-bold tracking-[-.04em] text-white md:text-5xl">{destaque.titulo}</h1>
                      {destaque.descricao && <p className="mt-4 max-w-2xl text-sm leading-6 text-white/80">{destaque.descricao}</p>}
                      <button
                        onClick={() => setAssistindo(destaque)}
                        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#07090c] transition hover:bg-white/90"
                      >
                        <Play className="size-4 fill-current" />
                        Assistir agora
                      </button>
                    </div>
                    <button
                      onClick={() => setAssistindo(destaque)}
                      className="grid size-20 place-items-center rounded-full bg-white/15 backdrop-blur transition hover:scale-110 md:size-24"
                    >
                      <Play className="size-8 fill-white text-white" />
                    </button>
                  </div>
                </div>
              </section>
            )}

            {Object.entries(porDisciplina).map(([disc, lista]) => (
              <section key={disc} className="mb-12">
                <h2 className="mb-5 font-syne text-2xl font-bold text-white">{disc}</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {lista.map((v) => <CardVideo key={v.id} video={v} onAssistir={() => setAssistindo(v)} />)}
                </div>
              </section>
            ))}
          </>
        )}
      </main>

      {assistindo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <button
            onClick={() => setAssistindo(null)}
            className="absolute right-4 top-4 rounded-lg bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <X className="size-6" />
          </button>
          <div className="w-full max-w-4xl">
            <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
              {assistindo.video_url.includes('youtube') || assistindo.video_url.includes('youtu.be') || assistindo.video_url.includes('vimeo') ? (
                <iframe
                  src={toEmbed(assistindo.video_url)}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video src={assistindo.video_url} controls className="h-full w-full" />
              )}
            </div>
            <div className="mt-4">
              <span className="text-xs font-bold uppercase tracking-[.18em] text-[#0d9488]">{assistindo.disciplina}</span>
              <h3 className="mt-1 font-syne text-xl font-bold text-white">{assistindo.titulo}</h3>
              {assistindo.descricao && <p className="mt-2 text-sm text-[#8aa0ad]">{assistindo.descricao}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CardVideo({ video, onAssistir }: { video: VideoaulaPublica; onAssistir: () => void }) {
  return (
    <button
      onClick={onAssistir}
      className="group overflow-hidden rounded-xl border border-white/[.08] bg-[#0e151a] text-left transition hover:border-[#0d9488]/50"
    >
      <div className={`relative flex aspect-video items-center justify-center bg-gradient-to-br ${corAleatoria(video.id)}`}>
        <div className="grid size-12 place-items-center rounded-full bg-white/20 backdrop-blur transition group-hover:scale-110">
          <Play className="size-5 fill-white text-white" />
        </div>
        {video.duracao_minutos && (
          <span className="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {video.duracao_minutos} min
          </span>
        )}
      </div>
      <div className="p-4">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#0d9488]">{video.disciplina}</span>
        <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-white">{video.titulo}</h3>
        <div className="mt-3 flex items-center justify-between text-xs text-[#82939a]">
          <span>{video.serie || 'Todas as séries'}</span>
          <span className="flex items-center gap-1"><Eye className="size-3" /> {video.visualizacoes}</span>
        </div>
      </div>
    </button>
  )
}