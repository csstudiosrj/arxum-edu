import { redirect } from 'next/navigation'
import { Play, Eye } from 'lucide-react'
import { getAlunoDoUsuario } from '@/lib/auth/aluno-atual'
import { getEscolaPorId } from '@/lib/auth/escola-atual'
import { marcaDaEscola } from '@/lib/auth/marca'
import { getVideoaulasAluno } from '../actions'
import { AlunoShell } from '../aluno-shell'

export const dynamic = 'force-dynamic'

function toEmbed(url: string): string {
  if (url.includes('youtube.com/watch')) { const id = new URL(url).searchParams.get('v'); return id ? `https://www.youtube.com/embed/${id}` : url }
  if (url.includes('youtu.be/')) { const id = url.split('youtu.be/')[1]?.split('?')[0]; return id ? `https://www.youtube.com/embed/${id}` : url }
  if (url.includes('vimeo.com/')) { const id = url.split('vimeo.com/')[1]?.split('?')[0]; return id ? `https://player.vimeo.com/video/${id}` : url }
  return url
}

export default async function EduflixAlunoPage() {
  const aluno = await getAlunoDoUsuario()
  if (!aluno) redirect('/login')

  const [videoaulas, escola] = await Promise.all([
    getVideoaulasAluno(),
    getEscolaPorId(aluno.escola_id),
  ])

  const marca = escola ? marcaDaEscola(escola) : null
  const porDisciplina: Record<string, typeof videoaulas> = {}
  videoaulas.forEach((v) => {
    if (!porDisciplina[v.disciplina]) porDisciplina[v.disciplina] = []
    porDisciplina[v.disciplina].push(v)
  })

  return (
    <AlunoShell alunoNome={aluno.nome} alunoSerie={aluno.serie || 'Sem série'} escolaNome={aluno.escola_nome} escolaSlug={aluno.escola_slug} marca={marca}>
      <main className="px-5 py-8 lg:px-8">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-[#0d9488]">EduFlix</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-.03em] text-[#12232b]">Videoaulas</h1>
          <p className="mt-2 text-sm text-[#71838b]">Catálogo de aulas em vídeo organizadas por disciplina.</p>
        </div>

        {videoaulas.length === 0 ? (
          <div className="rounded-xl border border-[#dce5e8] bg-white p-12 text-center"><Play className="mx-auto text-[#a0afb4]" size={32} /><p className="mt-3 text-sm text-[#82939a]">Nenhuma videoaula publicada ainda.</p></div>
        ) : (
          <div className="space-y-10">
            {Object.entries(porDisciplina).map(([disciplina, lista]) => (
              <section key={disciplina}>
                <h2 className="mb-4 text-lg font-bold text-[#12232b]">{disciplina}</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {lista.map((v) => (
                    <div key={v.id} className="overflow-hidden rounded-xl border border-[#dce5e8] bg-white">
                      <div className="relative aspect-video bg-black">
                        {v.video_url.includes('youtube') || v.video_url.includes('youtu.be') || v.video_url.includes('vimeo') ? (
                          <iframe src={toEmbed(v.video_url)} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                        ) : (<video src={v.video_url} controls className="h-full w-full" />)}
                      </div>
                      <div className="p-4">
                        <h3 className="line-clamp-2 text-sm font-semibold text-[#243942]">{v.titulo}</h3>
                        {v.descricao && <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#82939a]">{v.descricao}</p>}
                        <div className="mt-3 flex items-center justify-between text-xs text-[#82939a]"><span>{v.serie || 'Todas as séries'}</span><span className="flex items-center gap-1"><Eye className="size-3" /> {v.visualizacoes}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </AlunoShell>
  )
}