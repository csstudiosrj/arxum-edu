import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getEscolaDaRequisicao } from '@/lib/auth/escola-atual'
import { getConteudoHomePublico } from '@/lib/cms/actions'
import { getFontePar } from '@/lib/fonts'
import { PublicFooter, PublicHeader } from '@/components/arxum-brand'

export const dynamic = 'force-dynamic'

function formatarData(iso: string): string {
  return iso
}

export default async function NoticiaDetalhePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug: slugNoticia } = await params

  const escola = await getEscolaDaRequisicao()
  if (!escola) notFound()

  const conteudo = await getConteudoHomePublico()
  const noticia = conteudo.blocos.noticias.itens.find(
    (n) => (n.slug || n.id) === slugNoticia
  )

  if (!noticia) notFound()

  const par = getFontePar(escola.fonte_par)
  const base = `/edu/${escola.slug}`

  const estiloFontes = {
    '--font-heading-active': `var(${par.headingVar})`,
    '--font-body-active': `var(${par.bodyVar})`,
  } as React.CSSProperties

  return (
    <div className="min-h-screen bg-[#070b0f] text-[#e7f1f5]" style={estiloFontes}>
      <PublicHeader slug={escola.slug} />

      <main className="mx-auto max-w-3xl px-6 py-16 lg:px-8">
        <Link href={`${base}/noticias`} className="inline-flex items-center gap-2 text-sm text-[#8aa0ad] hover:text-white">
          <ArrowLeft className="size-4" /> Voltar para notícias
        </Link>

        <article className="mt-8">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-semibold tracking-widest text-[#0d9488]">{noticia.data}</span>
            {noticia.categoria && (
              <span className="rounded-full border border-[#0d9488]/30 px-2.5 py-0.5 text-[11px] font-semibold text-[#14b8a6]">
                {noticia.categoria}
              </span>
            )}
          </div>

          <h1 className="mt-4 font-heading text-4xl font-bold tracking-[-.04em] text-white sm:text-5xl">
            {noticia.titulo}
          </h1>

          {noticia.resumo && (
            <p className="mt-5 text-lg leading-8 text-[#8aa0ad]">{noticia.resumo}</p>
          )}

          {noticia.imagem_url && (
            <div className="mt-8 aspect-video w-full overflow-hidden rounded-xl border border-white/[.08]">
              <img src={noticia.imagem_url} alt={noticia.titulo} className="h-full w-full object-cover" />
            </div>
          )}

          {noticia.corpo && (
            <div className="prose prose-invert mt-8 max-w-none">
              {noticia.corpo.split('\n\n').map((paragrafo, i) => (
                <p key={i} className="mb-5 text-base leading-8 text-[#c7d5db]">
                  {paragrafo}
                </p>
              ))}
            </div>
          )}
        </article>

        <div className="mt-16 border-t border-white/[.08] pt-8">
          <Link
            href={`${base}/noticias`}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-[#c7d5db] transition hover:border-[#0d9488] hover:text-white"
          >
            <ArrowLeft className="size-4" /> Ver todas as notícias
          </Link>
        </div>
      </main>

      <PublicFooter slug={escola.slug} />
    </div>
  )
}