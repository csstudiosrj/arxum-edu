'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getEscolaDoUsuario } from '@/lib/auth/escola-atual'
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

export async function getAlbuns(): Promise<Album[]> {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return []

    const admin = createAdminClient()
    const { data: albuns, error } = await admin
      .from('albuns')
      .select('id, titulo, descricao, publico, capa_url, ativo, criado_em')
      .eq('escola_id', escola.id)
      .order('criado_em', { ascending: false })

    if (error || !albuns) return []

    const idsAlbuns = albuns.map((a) => a.id)

    let fotos: Array<{ id: string; album_id: string; url: string; legenda: string | null }> = []
    if (idsAlbuns.length > 0) {
      const { data } = await admin
        .from('fotos')
        .select('id, album_id, url, legenda')
        .in('album_id', idsAlbuns)
        .order('ordem', { ascending: true })
      fotos = (data || []) as Array<{ id: string; album_id: string; url: string; legenda: string | null }>
    }

    return albuns.map((a) => ({
      id: a.id,
      titulo: a.titulo,
      descricao: a.descricao,
      publico: a.publico,
      capa_url: a.capa_url,
      ativo: a.ativo,
      criado_em: a.criado_em,
      fotos: fotos
        .filter((f) => f.album_id === a.id)
        .map((f) => ({ id: f.id, url: f.url, legenda: f.legenda })),
    })) as Album[]
  } catch (e) {
    return []
  }
}

export async function criarAlbum(data: NovoAlbum) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const { error } = await admin.from('albuns').insert({
      escola_id: escola.id,
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

export async function atualizarAlbum(id: string, data: NovoAlbum) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const { error } = await admin
      .from('albuns')
      .update({
        titulo: data.titulo,
        descricao: data.descricao || null,
        publico: data.publico,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('escola_id', escola.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/galeria')
    revalidatePath('/responsavel')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao atualizar álbum.' }
  }
}

export async function adicionarFotos(albumId: string, urls: string[]) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()

    const { data: album } = await admin
      .from('albuns')
      .select('id, capa_url')
      .eq('id', albumId)
      .eq('escola_id', escola.id)
      .maybeSingle()

    if (!album) return { success: false, error: 'Álbum não encontrado.' }

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

    if (!album.capa_url && urls[0]) {
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
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()

    const { data: foto } = await admin
      .from('fotos')
      .select('id, album_id, url')
      .eq('id', id)
      .maybeSingle()

    if (!foto) return { success: false, error: 'Foto não encontrada.' }

    const { data: album } = await admin
      .from('albuns')
      .select('id, capa_url')
      .eq('id', foto.album_id)
      .eq('escola_id', escola.id)
      .maybeSingle()

    if (!album) return { success: false, error: 'Acesso negado.' }

    const { error } = await admin.from('fotos').delete().eq('id', id)
    if (error) return { success: false, error: error.message }

    // Se a foto excluída era a capa, busca outra foto para ser a capa, ou remove
    if (album.capa_url === foto.url) {
      const { data: fotosRestantes } = await admin
        .from('fotos')
        .select('url')
        .eq('album_id', foto.album_id)
        .order('ordem', { ascending: true })
        .limit(1)

      const novaCapa = fotosRestantes?.[0]?.url || null
      await admin.from('albuns').update({ capa_url: novaCapa }).eq('id', foto.album_id)
    }

    revalidatePath('/admin/galeria')
    revalidatePath('/responsavel')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao excluir.' }
  }
}

export async function excluirAlbum(id: string) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const { error } = await admin.from('albuns').delete().eq('id', id).eq('escola_id', escola.id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/galeria')
    revalidatePath('/responsavel')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao excluir.' }
  }
}