import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getEscolaDaRequisicao } from '@/lib/auth/escola-atual'
import { EduflixClient } from './eduflix-client'

export const dynamic = 'force-dynamic'

export type VideoaulaPublica = {
  id: string
  titulo: string
  descricao: string | null
  disciplina: string
  serie: string | null
  duracao_minutos: number | null
  video_url: string
  visualizacoes: number
}

async function getVideoaulas(escolaId: string): Promise<VideoaulaPublica[]> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('videoaulas')
      .select('id, titulo, descricao, disciplina, serie, duracao_minutos, video_url, visualizacoes')
      .eq('escola_id', escolaId)
      .eq('publicado', true)
      .order('criado_em', { ascending: false })

    if (error) return []
    return (data || []) as VideoaulaPublica[]
  } catch (e) {
    return []
  }
}

export default async function EduflixPage() {
  const escola = await getEscolaDaRequisicao()
  if (!escola) notFound()

  const videoaulas = await getVideoaulas(escola.id)
  return <EduflixClient videoaulas={videoaulas} />
}