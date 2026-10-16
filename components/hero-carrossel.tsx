'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { BannerHero } from '@/lib/cms/defaults'

export function HeroCarrossel({
  banners,
  intervalo,
}: {
  banners: BannerHero[]
  intervalo: number
}) {
  const [atual, setAtual] = useState(0)

  useEffect(() => {
    if (banners.length <= 1) return
    const ms = Math.max(2, intervalo) * 1000
    const timer = setInterval(() => {
      setAtual((i) => (i + 1) % banners.length)
    }, ms)
    return () => clearInterval(timer)
  }, [banners.length, intervalo])

  if (banners.length === 0) return null

  function anterior() {
    setAtual((i) => (i - 1 + banners.length) % banners.length)
  }
  function proximo() {
    setAtual((i) => (i + 1) % banners.length)
  }

  const banner = banners[atual]

  return (
    <div className="relative h-full min-h-[360px] w-full overflow-hidden rounded-2xl border border-white/10">
      {banners.map((b, i) => (
        <div
          key={b.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === atual ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {b.url ? (
            <img
              src={b.url}
              alt={b.titulo || ''}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[#1b3033] via-[#132127] to-[#0b1115]" />
          )}
        </div>
      ))}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

      {banner && (banner.titulo || banner.subtitulo) && (
        <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
          {banner.titulo && (
            <p className="font-heading text-2xl font-bold tracking-tight text-white lg:text-3xl">
              {banner.titulo}
            </p>
          )}
          {banner.subtitulo && (
            <p className="mt-2 max-w-md text-sm leading-6 text-white/80">
              {banner.subtitulo}
            </p>
          )}
        </div>
      )}

      {banners.length > 1 && (
        <>
          <button
            onClick={anterior}
            aria-label="Banner anterior"
            className="absolute left-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            onClick={proximo}
            aria-label="Próximo banner"
            className="absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60"
          >
            <ChevronRight className="size-5" />
          </button>

          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setAtual(i)}
                aria-label={`Ir para banner ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === atual ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}