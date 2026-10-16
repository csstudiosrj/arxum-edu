import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getEscolaDaRequisicao } from '@/lib/auth/escola-atual'
import { getConteudoHomePublico } from '@/lib/cms/actions'
import { getFontePar } from '@/lib/fonts'
import { PublicFooter, PublicHeader } from '@/components/arxum-brand'

export const dynamic = 'force-dynamic'

export default async function NoticiasPage() {
  const escola = await getEscolaDaRequisicao()
  if (!escola) notFound()

  const conteudo = await getConteudoHomePublico()
  const noticias = conteudo.blocos.noticias.itens
  const par = getFontePar(escola.fonte_par)
  const base = `/edu/${escola.slug}`

  const estiloFontes = {
    '--font-heading-active': `var(${par.headingVar})`,
    '--font-body-active': `var(${par.bodyVar})`,
  } as React.CSSProperties

  return (
    <div className="min-h-screen bg-[#070b0f] text-[#e7f1f5]" style={estiloFontes}>
      <PublicHeader slug={escola.slug} />

      <main className="mx-auto max-w-5xl px-6 py-16 lg:px-8">
        <Link href={base} className="inline-flex items-center gap-2 text-sm text-[#8aa0ad] hover:text-white">
          <ArrowLeft className="size-4" /> Voltar para a home
        </Link>

        <div className="mt-8 mb-12">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#0d9488]">
            {conteudo.blocos.noticias.eyebrow || 'Notícias'}
          </p>
          <h1 className="mt-3 font-heading text-4xl font-bold tracking-[-.04em] text-white">
            {conteudo.blocos.noticias.titulo || 'Últimas notícias'}
          </h1>
        </div>

        {noticias.length === 0 ? (
          <div className="rounded-xl border border-white/[.08] bg-[#0e151a] p-12 text-center">
            <p className="text-sm text-[#82939a]">Nenhuma notícia publicada ainda.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {noticias.map((n) => {
              const slug = n.slug || n.id
              return (
                <Link
                  key={n.id}
                  href={`${base}/noticias/${slug}`}
                  className="group overflow-hidden rounded-xl border border-white/[.08] bg-[#0e151a] transition hover:border-[#0d9488]/50"
                >
                  <div className="relative aspect-video bg-gradient-to-br from-[#154b45] to-[#132733]">
                    {n.imagem_url && (
                      <img src={n.imagem_url} alt={n.titulo} className="h-full w-full object-cover transition group-hover:scale-105" />
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold tracking-widest text-[#0d9488]">{n.data}</span>
                      {n.categoria && (
                        <span className="rounded-full border border-[#0d9488]/30 px-2 py-0.5 text-[10px] font-semibold text-[#14b8a6]">
                          {n.categoria}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-3 font-heading text-lg font-bold leading-6 text-white">{n.titulo}</h3>
                    {n.resumo && (
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#8196a2]">{n.resumo}</p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>

      <PublicFooter slug={escola.slug} />
    </div>
  )
}