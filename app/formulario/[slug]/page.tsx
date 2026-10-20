import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { cache } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { FormularioPublicoClient } from './formulario-publico-client'
import type { Formulario, CampoFormulario } from '@/lib/cms/tipos-formulario'

export const dynamic = 'force-dynamic'

// Usamos cache() para que generateMetadata e a Page compartilhem a mesma requisição
const getFormularioPublico = cache(async (slug: string): Promise<{ formulario: Formulario; campos: CampoFormulario[]; escolaNome: string; escolaLogo: string | null } | null> => {
  try {
    const admin = createAdminClient()
    const { data: formulario } = await admin
      .from('formularios')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'publicado')
      .eq('ativo', true)
      .maybeSingle()

    if (!formulario) return null

    const { data: campos } = await admin
      .from('formulario_campos')
      .select('*')
      .eq('formulario_id', formulario.id)
      .order('ordem', { ascending: true })

    const { data: escola } = await admin
      .from('escolas')
      .select('nome, logo_url')
      .eq('id', formulario.escola_id)
      .maybeSingle()

    return {
      formulario: formulario as Formulario,
      campos: ((campos || []) as CampoFormulario[]).map((c) => ({
        ...c,
        opcoes: Array.isArray(c.opcoes) ? c.opcoes : [],
      })),
      escolaNome: escola?.nome || 'Escola',
      escolaLogo: escola?.logo_url || null,
    }
  } catch {
    return null
  }
})

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const data = await getFormularioPublico(slug)

  if (!data) return { title: 'Formulário não encontrado' }

  const titulo = `${data.formulario.titulo} — ${data.escolaNome}`
  const descricao = data.formulario.descricao || `Preencha o formulário oficial de ${data.escolaNome}.`
  const logo = data.escolaLogo || '/placeholder-logo.png'

  return {
    title: titulo,
    description: descricao,
    openGraph: {
      title: titulo,
      description: descricao,
      images: [{ url: logo, width: 1200, height: 630, alt: data.escolaNome }],
      type: 'website',
      locale: 'pt_BR',
      siteName: data.escolaNome,
    },
    twitter: {
      card: 'summary_large_image',
      title: titulo,
      description: descricao,
      images: [logo],
    },
  }
}

export default async function FormularioPublicoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const data = await getFormularioPublico(slug)
  if (!data) notFound()

  return <FormularioPublicoClient formulario={data.formulario} campos={data.campos} escolaNome={data.escolaNome} />
}