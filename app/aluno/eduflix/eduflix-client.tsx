'use client'

import { useState } from 'react'
import { Play, Eye, X, Radio, Clock } from 'lucide-react'
import { VideoaulaAluno } from '../actions'

function toEmbed(url: string): string {
  if (!url) return ''
  if (url.includes('youtube.com/watch')) { const id = new URL(url).searchParams.get('v'); return id ? `https://www.youtube.com/embed/${id}` : url }
  if (url.includes('youtu.be/')) { const id = url.split('youtu.be/')[1]?.split('?')[0]; return id ? `https://www.youtube.com/embed/${id}` : url }
  if (url.includes('vimeo.com/')) { const id = url.split('vimeo.com/')[1]?.split('?')[0]; return id ? `https://player.vimeo.com/video/${id}` : url }
  return url
}

export function EduflixClient({ videoaulas }: { videoaulas: VideoaulaAluno[] }) {
  const [selectedVideo, setSelectedVideo] = useState<VideoaulaAluno | null>(null)

  // Agrupa por disciplina
  const porDisciplina: Record<string, typeof videoaulas> = {}
  videoaulas.forEach((v) => {
    if (!porDisciplina[v.disciplina]) porDisciplina[v.disciplina] = []
    porDisciplina[v.disciplina].push(v)
  })

  // Separa os vídeos em destaque (hero) - ex: os 3 mais recentes
  const destaques = videoaulas.slice(0, 3)

  return (
    <main className="px-5 py-8 lg:px-8 pb-20">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[.18em]" style={{ color: 'var(--cor-primaria, #0d9488)' }}>EduFlix</p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-.03em] text-[#12232b]">Videoaulas</h1>
        <p className="mt-2 text-sm text-[#71838b]">Catálogo de aulas em vídeo organizadas por disciplina.</p>
      </div>

      {videoaulas.length === 0 ? (
        <div className="rounded-xl border border-[#dce5e8] bg-white p-12 text-center">
          <Play className="mx-auto text-[#a0afb4]" size={32} />
          <p className="mt-3 text-sm text-[#82939a]">Nenhuma videoaula publicada ainda.</p>
        </div>
      ) : (
        <div className="space-y-10">
          
          {/* HERO SECTION (Estilo Netflix: destaque para os primeiros vídeos) */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {destaques.map((v) => (
              <div 
                key={`destaque-${v.id}`} 
                onClick={() => setSelectedVideo(v)}
                className="group relative cursor-pointer overflow-hidden rounded-xl bg-[#12232b] aspect-video shadow-md transition-transform hover:scale-[1.02]"
              >
                {v.capa_url ? (
                  <img src={v.capa_url} alt={v.titulo} className="h-full w-full object-cover opacity-70 transition-opacity group-hover:opacity-50" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-gray-800 to-gray-900" />
                )}
                
                <div className="absolute inset-0 flex flex-col justify-end p-5">
                  {v.tipo === 'live' && (
                    <span className="mb-2 flex w-fit items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white animate-pulse">
                      <Radio size={12} /> Ao Vivo
                    </span>
                  )}
                  <h2 className="text-xl font-bold text-white drop-shadow-md">{v.titulo}</h2>
                  <div className="mt-2 flex items-center gap-3 text-xs font-medium text-gray-300">
                    <span>{v.disciplina}</span>
                    {v.duracao_minutos && (
                      <span className="flex items-center gap-1"><Clock size={12} /> {v.duracao_minutos} min</span>
                    )}
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="flex size-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                    <Play fill="white" className="ml-1 text-white" size={24} />
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* ROWS POR DISCIPLINA */}
          {Object.entries(porDisciplina).map(([disciplina, lista]) => (
            <section key={disciplina}>
              <h2 className="mb-4 text-lg font-bold text-[#12232b] border-l-4 pl-3" style={{ borderColor: 'var(--cor-primaria, #0d9488)' }}>
                {disciplina}
              </h2>
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
                {lista.map((v) => (
                  <div 
                    key={v.id} 
                    onClick={() => setSelectedVideo(v)}
                    className="group w-[280px] shrink-0 cursor-pointer snap-start overflow-hidden rounded-xl border border-[#dce5e8] bg-white transition-all hover:border-[#a0afb4] hover:shadow-lg"
                  >
                    <div className="relative aspect-video bg-[#12232b]">
                      {v.capa_url ? (
                        <img src={v.capa_url} alt={v.titulo} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-200">
                          <Play className="text-gray-400" size={32} />
                        </div>
                      )}
                      {v.tipo === 'live' && (
                        <span className="absolute top-2 left-2 flex items-center gap-1 rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white shadow-sm">
                          <Radio size={10} /> Live
                        </span>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 bg-black/40 transition-opacity group-hover:opacity-100">
                        <Play fill="white" className="ml-1 text-white" size={32} />
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="line-clamp-1 text-sm font-semibold text-[#243942]">{v.titulo}</h3>
                      <div className="mt-2 flex items-center justify-between text-xs text-[#82939a]">
                        <span>{v.serie || 'Todas as séries'}</span>
                        <span className="flex items-center gap-1"><Eye size={12} /> {v.visualizacoes}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}

        </div>
      )}

      {/* MODAL PLAYER */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 sm:p-8 backdrop-blur-sm">
          <div className="relative w-full max-w-5xl overflow-hidden rounded-2xl bg-black shadow-2xl">
            <div className="flex items-center justify-between bg-[#12232b] px-5 py-3">
              <div>
                <h3 className="text-base font-bold text-white">{selectedVideo.titulo}</h3>
                <p className="text-xs text-gray-400">{selectedVideo.disciplina} • {selectedVideo.serie || 'Todas as séries'}</p>
              </div>
              <button 
                onClick={() => setSelectedVideo(null)}
                className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="relative aspect-video w-full bg-black">
              {selectedVideo.tipo === 'live' && selectedVideo.link_live ? (
                <iframe
                  src={toEmbed(selectedVideo.link_live)}
                  className="h-full w-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : selectedVideo.video_url ? (
                selectedVideo.video_url.includes('youtube') || selectedVideo.video_url.includes('youtu.be') || selectedVideo.video_url.includes('vimeo') ? (
                  <iframe
                    src={toEmbed(selectedVideo.video_url)}
                    className="h-full w-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video src={selectedVideo.video_url} controls autoPlay className="h-full w-full" />
                )
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">
                  <p>Vídeo indisponível no momento.</p>
                </div>
              )}
            </div>

            {selectedVideo.descricao && (
              <div className="bg-[#12232b] p-5">
                <p className="text-sm leading-relaxed text-gray-300">{selectedVideo.descricao}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}