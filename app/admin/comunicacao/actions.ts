'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getEscolaDoUsuario } from '@/lib/auth/escola-atual'
import { notificarComunicado } from '@/lib/emails/notificacoes'
import { enviarSeAtivo } from '@/lib/notificacoes-config-server'
import { revalidatePath } from 'next/cache'

export type Comunicado = {
  id: string
  titulo: string
  mensagem: string
  setor: string
  prioridade: string
  autor_nome: string
  ativo: boolean
  criado_em: string
  total_leituras: number
  segmento_serie: string | null
  segmento_turno: string | null
}

export type NovoComunicado = {
  titulo: string
  mensagem: string
  setor: string
  prioridade: string
  segmento_serie: string | null
  segmento_turno: string | null
}

export async function getComunicados(): Promise<Comunicado[]> {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return []

    const admin = createAdminClient()
    const { data: coms, error } = await admin
      .from('comunicados')
      .select('*')
      .eq('escola_id', escola.id)
      .order('criado_em', { ascending: false })

    if (error || !coms) return []

    const idsComs = coms.map((c) => c.id)

    let leituras: Array<{ comunicado_id: string }> = []
    if (idsComs.length > 0) {
      const { data } = await admin
        .from('comunicados_leituras')
        .select('comunicado_id')
        .in('comunicado_id', idsComs)
      leituras = (data || []) as Array<{ comunicado_id: string }>
    }

    const contagemPorCom: Record<string, number> = {}
    leituras.forEach((l) => {
      contagemPorCom[l.comunicado_id] = (contagemPorCom[l.comunicado_id] || 0) + 1
    })

    return coms.map((c) => ({
      id: c.id,
      titulo: c.titulo,
      mensagem: c.mensagem,
      setor: c.setor,
      prioridade: c.prioridade,
      autor_nome: c.autor_nome,
      ativo: c.ativo,
      criado_em: c.criado_em,
      total_leituras: contagemPorCom[c.id] || 0,
      segmento_serie: c.segmento_serie || null,
      segmento_turno: c.segmento_turno || null,
    })) as Comunicado[]
  } catch (e) {
    return []
  }
}

export async function getFiltrosComunicacao() {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { series: [], turnos: [] }

    const admin = createAdminClient()
    const { data: alunos } = await admin
      .from('alunos')
      .select('serie, turno')
      .eq('escola_id', escola.id)
      .eq('status', 'ativo')

    const series = Array.from(new Set((alunos || []).map(a => a.serie).filter(Boolean))) as string[]
    const turnos = Array.from(new Set((alunos || []).map(a => a.turno).filter(Boolean))) as string[]

    return { series: series.sort(), turnos: turnos.sort() }
  } catch (e) {
    return { series: [], turnos: [] }
  }
}

export async function criarComunicado(data: NovoComunicado) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const supabaseAuth = await createClient()
    const { data: { user } } = await supabaseAuth.auth.getUser()

    let autor = 'Administração'
    if (user?.email) {
      const { data: perfil } = await admin
        .from('perfis')
        .select('nome')
        .eq('email', user.email)
        .maybeSingle()
      autor = perfil?.nome || user.email.split('@')[0]
    }

    const { error } = await admin.from('comunicados').insert({
      escola_id: escola.id,
      titulo: data.titulo,
      mensagem: data.mensagem,
      setor: data.setor,
      prioridade: data.prioridade,
      autor_nome: autor,
      segmento_serie: data.segmento_serie,
      segmento_turno: data.segmento_turno,
    })

    if (error) return { success: false, error: error.message }

    // Filtra os alunos baseado na segmentação antes de buscar os emails
    let query = admin
      .from('alunos')
      .select('responsavel_email')
      .eq('escola_id', escola.id)
      .eq('status', 'ativo')

    if (data.segmento_serie) query = query.eq('serie', data.segmento_serie)
    if (data.segmento_turno) query = query.eq('turno', data.segmento_turno)

    const { data: alunosAlvo } = await query

    const emailsUnicos = Array.from(
      new Set((alunosAlvo || []).map((a) => a.responsavel_email).filter(Boolean))
    )

    // Dispara os e-mails em background para não travar a requisição
    Promise.all(
      emailsUnicos.map((email) =>
        enviarSeAtivo({
          escolaId: escola.id,
          evento: 'comunicado',
          enviar: () =>
            notificarComunicado({
              para: email,
              escolaNome: escola.nome,
              escolaSlug: escola.slug,
              titulo: data.titulo,
              mensagem: data.mensagem,
              setor: data.setor,
              autor,
            }),
        }).catch((e) => console.error('[email comunicado]', email, e))
      )
    ).catch(() => {})

    revalidatePath('/admin/comunicacao')
    revalidatePath('/responsavel')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao criar comunicado.' }
  }
}

export async function excluirComunicado(id: string) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const { error } = await admin.from('comunicados').delete().eq('id', id).eq('escola_id', escola.id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/comunicacao')
    revalidatePath('/responsavel')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao excluir.' }
  }
}
