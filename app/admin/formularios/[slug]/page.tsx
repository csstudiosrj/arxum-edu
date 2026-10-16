import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { FormularioPublicoClient } from './formulario-publico-client'
import type { Formulario, CampoFormulario } from '@/lib/cms/tipos-formulario'

export const dynamic = 'force-dynamic'

async function getFormularioPublico(slug: string): Promise<{ formulario: Formulario; campos: CampoFormulario[]; escolaNome: string } | null> {
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
      .select('nome')
      .eq('id', formulario.escola_id)
      .maybeSingle()

    return {
      formulario: formulario as Formulario,
      campos: ((campos || []) as CampoFormulario[]).map((c) => ({
        ...c,
        opcoes: Array.isArray(c.opcoes) ? c.opcoes : [],
      })),
      escolaNome: escola?.nome || 'Escola',
    }
  } catch {
    return null
  }
}

export default async function FormularioPublicoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const data = await getFormularioPublico(slug)
  if (!data) notFound()

  return <FormularioPublicoClient formulario={data.formulario} campos={data.campos} escolaNome={data.escolaNome} />
}