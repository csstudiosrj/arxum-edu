import { createAdminClient } from '@/lib/supabase/admin'
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

async function getVideoaulas(): Promise<VideoaulaPublica[]> {
  try {
    const admin = createAdminClient()
    const { data: escola } = await admin.from('escolas').select('id').eq('slug', 'colegio-horizonte').single()
    if (!escola) return []

    const { data, error } = await admin
      .from('videoaulas')
      .select('id, titulo, descricao, disciplina, serie, duracao_minutos, video_url, visualizacoes')
      .eq('escola_id', escola.id)
      .eq('publicado', true)
      .order('criado_em', { ascending: false })

    if (error) return []
    return (data || []) as VideoaulaPublica[]
  } catch (e) {
    return []
  }
}

export default async function EduflixPage() {
  const videoaulas = await getVideoaulas()
  return <EduflixClient videoaulas={videoaulas} />
}