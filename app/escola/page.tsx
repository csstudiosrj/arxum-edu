import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getEscolaDaRequisicao } from '@/lib/auth/escola-atual'
import { getConteudoHomePublico } from '@/lib/cms/actions'
import { marcaDaEscola } from '@/lib/auth/marca'
import { EscolaClient } from './escola-client'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const escola = await getEscolaDaRequisicao()
  if (!escola) return {}

  const conteudo = await getConteudoHomePublico()
  const titulo = escola.nome
  const subtitulo = conteudo.blocos.hero.subtitulo || `Bem-vindo ao site oficial do ${escola.nome}.`
  const logo = escola.logo_url || '/placeholder-logo.png'

  return {
    title: titulo,
    description: subtitulo,
    openGraph: {
      title: titulo,
      description: subtitulo,
      images: [{ url: logo, width: 1200, height: 630, alt: escola.nome }],
      type: 'website',
      locale: 'pt_BR',
      siteName: escola.nome,
    },
    twitter: {
      card: 'summary_large_image',
      title: titulo,
      description: subtitulo,
      images: [logo],
    },
  }
}

export default async function EscolaPage() {
  const escola = await getEscolaDaRequisicao()
  if (!escola) notFound()

  const conteudo = await getConteudoHomePublico()
  const marca = marcaDaEscola(escola)

  return (
    <EscolaClient
      escolaNome={escola.nome}
      slug={escola.slug}
      fontePar={escola.fonte_par}
      conteudo={conteudo}
      cor={marca.corPrimaria}
      logoUrl={marca.logoUrl}
    />
  )
}