'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export type Album = {
  id: string
  titulo: string
  descricao: string | null
  publico: string
  capa_url: string | null
  ativo: boolean
  criado_em: string
  fotos: Array<{ id: string; url: string; legenda: string | null }>
}

export type NovoAlbum = {
  titulo: string
  descricao: string
  publico: string
}

async function getEscolaId(): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin.from('escolas').select('id').eq('slug', 'colegio-horizonte').single()
  return data?.id || null
}

export async function getAlbuns(): Promise<Album[]> {
  try {
    const admin = createAdminClient()
    const escolaId = await getEscolaId()
    if (!escolaId) return []

    const { data: albuns, error } = await admin
      .from('albuns')
      .select('id, titulo, descricao, publico, capa_url, ativo, criado_em')
      .eq('escola_id', escolaId)
      .order('criado_em', { ascending: false })

    if (error || !albuns) return []

    const { data: fotos } = await admin
      .from('fotos')
      .select('id, album_id, url, legenda')
      .in('album_id', albuns.map((a) => a.id))
      .order('ordem', { ascending: true })

    return albuns.map((a) => ({
      id: a.id,
      titulo: a.titulo,
      descricao: a.descricao,
      publico: a.publico,
      capa_url: a.capa_url,
      ativo: a.ativo,
      criado_em: a.criado_em,
      fotos: (fotos || [])
        .filter((f) => f.album_id === a.id)
        .map((f) => ({ id: f.id, url: f.url, legenda: f.legenda })),
    })) as Album[]
  } catch (e) {
    return []
  }
}

export async function criarAlbum(data: NovoAlbum) {
  try {
    const admin = createAdminClient()
    const escolaId = await getEscolaId()
    if (!escolaId) return { success: false, error: 'Escola não encontrada.' }

    const { error } = await admin.from('albuns').insert({
      escola_id: escolaId,
      titulo: data.titulo,
      descricao: data.descricao || null,
      publico: data.publico,
    })

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/galeria')
    revalidatePath('/responsavel')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao criar álbum.' }
  }
}

export async function adicionarFotos(albumId: string, urls: string[]) {
  try {
    const admin = createAdminClient()

    const { data: ultima } = await admin
      .from('fotos')
      .select('ordem')
      .eq('album_id', albumId)
      .order('ordem', { ascending: false })
      .limit(1)
      .maybeSingle()

    const ordemInicial = (ultima?.ordem || 0) + 1

    const { error } = await admin.from('fotos').insert(
      urls.map((url, i) => ({
        album_id: albumId,
        url,
        ordem: ordemInicial + i,
      }))
    )

    if (error) return { success: false, error: error.message }

    // Se o álbum não tem capa, define a primeira foto
    const { data: album } = await admin.from('albuns').select('capa_url').eq('id', albumId).single()
    if (album && !album.capa_url && urls[0]) {
      await admin.from('albuns').update({ capa_url: urls[0] }).eq('id', albumId)
    }

    revalidatePath('/admin/galeria')
    revalidatePath('/responsavel')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao adicionar fotos.' }
  }
}

export async function excluirFoto(id: string) {
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('fotos').delete().eq('id', id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/galeria')
    revalidatePath('/responsavel')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao excluir.' }
  }
}

export async function excluirAlbum(id: string) {
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('albuns').delete().eq('id', id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/galeria')
    revalidatePath('/responsavel')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao excluir.' }
  }
}