'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getEscolaDoUsuario } from '@/lib/auth/escola-atual'
import {
  gerarSlugFormulario,
  type Formulario,
  type CampoFormulario,
  type RespostaFormulario,
  type TipoCampo,
} from '@/lib/cms/tipos-formulario'
import { revalidatePath } from 'next/cache'

export async function getFormularios(): Promise<Formulario[]> {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return []

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('formularios')
      .select('*')
      .eq('escola_id', escola.id)
      .order('criado_em', { ascending: false })

    if (error) return []
    return (data || []) as Formulario[]
  } catch (e) {
    return []
  }
}

export async function getFormularioPorId(id: string): Promise<{ formulario: Formulario; campos: CampoFormulario[] } | null> {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return null

    const admin = createAdminClient()
    const { data: formulario } = await admin
      .from('formularios')
      .select('*')
      .eq('id', id)
      .eq('escola_id', escola.id)
      .maybeSingle()

    if (!formulario) return null

    const { data: campos } = await admin
      .from('formulario_campos')
      .select('*')
      .eq('formulario_id', id)
      .order('ordem', { ascending: true })

    return {
      formulario: formulario as Formulario,
      campos: ((campos || []) as CampoFormulario[]).map((c) => ({
        ...c,
        opcoes: Array.isArray(c.opcoes) ? c.opcoes : [],
      })),
    }
  } catch (e) {
    return null
  }
}

export async function criarFormulario(data: { titulo: string; descricao: string; tipo: string }) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    if (!data.titulo.trim()) return { success: false, error: 'Informe o título.' }

    const admin = createAdminClient()
    const slugBase = gerarSlugFormulario(data.titulo)

    let slug = slugBase
    let contador = 0
    while (true) {
      const { data: existente } = await admin
        .from('formularios')
        .select('id')
        .eq('escola_id', escola.id)
        .eq('slug', slug)
        .maybeSingle()
      if (!existente) break
      contador++
      slug = `${slugBase}-${contador}`
    }

    const { data: novo, error } = await admin
      .from('formularios')
      .insert({
        escola_id: escola.id,
        titulo: data.titulo,
        slug,
        descricao: data.descricao || null,
        tipo: data.tipo,
      })
      .select('id')
      .single()

    if (error || !novo) return { success: false, error: error?.message || 'Erro ao criar.' }

    revalidatePath('/admin/formularios')
    return { success: true, id: novo.id }
  } catch (e) {
    return { success: false, error: 'Erro ao criar formulário.' }
  }
}

export async function atualizarFormulario(id: string, data: Partial<Formulario>) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const { error } = await admin
      .from('formularios')
      .update({
        titulo: data.titulo,
        descricao: data.descricao,
        tipo: data.tipo,
        status: data.status,
        cor_primaria: data.cor_primaria,
        mensagem_sucesso: data.mensagem_sucesso,
        redirecionar_url: data.redirecionar_url,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('escola_id', escola.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/formularios')
    revalidatePath(`/admin/formularios/${id}`)
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao atualizar.' }
  }
}

export async function excluirFormulario(id: string) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const { error } = await admin
      .from('formularios')
      .delete()
      .eq('id', id)
      .eq('escola_id', escola.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/formularios')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao excluir.' }
  }
}

export async function salvarCampos(formularioId: string, campos: CampoFormulario[]) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()

    // Confirma que o formulário pertence à escola
    const { data: formulario } = await admin
      .from('formularios')
      .select('id')
      .eq('id', formularioId)
      .eq('escola_id', escola.id)
      .maybeSingle()

    if (!formulario) return { success: false, error: 'Formulário não encontrado.' }

    // Estratégia: apaga todos os campos e reinsere com a ordem atual
    const { error: erroDelete } = await admin
      .from('formulario_campos')
      .delete()
      .eq('formulario_id', formularioId)

    if (erroDelete) return { success: false, error: erroDelete.message }

    if (campos.length > 0) {
      const { error: erroInsert } = await admin
        .from('formulario_campos')
        .insert(
          campos.map((c, index) => ({
            id: c.id && c.id.length > 20 ? c.id : undefined,
            formulario_id: formularioId,
            tipo: c.tipo,
            label: c.label,
            placeholder: c.placeholder || null,
            texto_ajuda: c.texto_ajuda || null,
            obrigatorio: c.obrigatorio,
            unico: c.unico,
            opcoes: c.opcoes || [],
            validacao_min: c.validacao_min,
            validacao_max: c.validacao_max,
            ordem: index,
            secao: c.secao || null,
          }))
        )

      if (erroInsert) return { success: false, error: erroInsert.message }
    }

    revalidatePath(`/admin/formularios/${formularioId}`)
    revalidatePath('/admin/formularios')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao salvar campos.' }
  }
}

export async function getRespostas(formularioId: string): Promise<RespostaFormulario[]> {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return []

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('formulario_respostas')
      .select('*')
      .eq('formulario_id', formularioId)
      .eq('escola_id', escola.id)
      .order('criado_em', { ascending: false })

    if (error) return []
    return (data || []) as RespostaFormulario[]
  } catch (e) {
    return []
  }
}

export async function excluirResposta(id: string) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const { error } = await admin
      .from('formulario_respostas')
      .delete()
      .eq('id', id)
      .eq('escola_id', escola.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/formularios')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao excluir.' }
  }
}

export async function contarRespostas(formularioId: string): Promise<number> {
  try {
    const admin = createAdminClient()
    const { count } = await admin
      .from('formulario_respostas')
      .select('*', { count: 'exact', head: true })
      .eq('formulario_id', formularioId)
    return count || 0
  } catch (e) {
    return 0
  }
}