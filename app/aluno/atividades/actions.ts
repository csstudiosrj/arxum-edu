'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getAlunoDoUsuario } from '@/lib/auth/aluno-atual'
import { revalidatePath } from 'next/cache'

export type AtividadeAluno = {
  id: string
  titulo: string
  descricao: string | null
  prazo_entrega: string | null
  nota_maxima: number
  modulo_titulo: string
  disciplina: string
  entrega_id: string | null
  arquivo_url: string | null
  comentario_aluno: string | null
  nota: number | null
  feedback_professor: string | null
  status_entrega: 'pendente' | 'entregue' | 'corrigida'
  entregue_em: string | null
}

export async function getMinhasAtividades(): Promise<AtividadeAluno[]> {
  try {
    const aluno = await getAlunoDoUsuario()
    if (!aluno) return []

    const admin = createAdminClient()

    // 1. Busca todas as atividades da escola do aluno
    const { data: atividades, error } = await admin
      .from('atividades')
      .select('id, titulo, descricao, prazo_entrega, nota_maxima, modulo_id, modulos(titulo, disciplina)')
      .eq('escola_id', aluno.escola_id)
      .order('criado_em', { ascending: false })

    if (error || !atividades) return []

    // 2. Busca as entregas desse aluno específico
    const idsAtividades = atividades.map(a => a.id)
    let entregas: any[] = []
    
    if (idsAtividades.length > 0) {
      const { data } = await admin
        .from('entregas_atividades')
        .select('*')
        .eq('aluno_id', aluno.id)
        .in('atividade_id', idsAtividades)
      entregas = data || []
    }

    // 3. Cruza os dados
    return atividades.map((a: any) => {
      const entrega = entregas.find(e => e.atividade_id === a.id)
      return {
        id: a.id,
        titulo: a.titulo,
        descricao: a.descricao,
        prazo_entrega: a.prazo_entrega,
        nota_maxima: a.nota_maxima,
        modulo_titulo: a.modulos?.titulo || 'Módulo',
        disciplina: a.modulos?.disciplina || 'Disciplina',
        entrega_id: entrega?.id || null,
        arquivo_url: entrega?.arquivo_url || null,
        comentario_aluno: entrega?.comentario_aluno || null,
        nota: entrega?.nota || null,
        feedback_professor: entrega?.feedback_professor || null,
        status_entrega: entrega ? (entrega.nota !== null ? 'corrigida' : 'entregue') : 'pendente',
        entregue_em: entrega?.entregue_em || null
      }
    }) as AtividadeAluno[]

  } catch (e) {
    return []
  }
}

export async function enviarAtividade(atividadeId: string, arquivoUrl: string, comentario: string) {
  try {
    const aluno = await getAlunoDoUsuario()
    if (!aluno) return { success: false, error: 'Sessão expirada.' }

    if (!arquivoUrl.trim()) return { success: false, error: 'Informe o link do arquivo.' }

    const admin = createAdminClient()

    // Upsert para permitir reenvio
    const { error } = await admin
      .from('entregas_atividades')
      .upsert({
        atividade_id: atividadeId,
        aluno_id: aluno.id,
        arquivo_url: arquivoUrl,
        comentario_aluno: comentario || null,
        status: 'entregue',
        entregue_em: new Date().toISOString()
      }, { onConflict: 'atividade_id, aluno_id' })

    if (error) return { success: false, error: error.message }

    revalidatePath('/aluno/atividades')
    revalidatePath('/professor/atividades')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao enviar atividade.' }
  }
}
