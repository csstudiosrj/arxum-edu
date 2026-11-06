'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getEscolaDoUsuario } from '@/lib/auth/escola-atual'
import { revalidatePath } from 'next/cache'

export async function getConfiguracaoRecursos() {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { config: { saude: [], eduflix: [], sala_virtual: [] }, seriesDisponiveis: [] }

    const admin = createAdminClient()
    
    // 1. Pega a configuração atual
    const { data: escolaData } = await admin
      .from('escolas')
      .select('config_recursos')
      .eq('id', escola.id)
      .maybeSingle()

    const config = escolaData?.config_recursos || { saude: [], eduflix: [], sala_virtual: [] }

    // 2. Pega todas as séries distintas que existem na escola
    const { data: alunos } = await admin
      .from('alunos')
      .select('serie')
      .eq('escola_id', escola.id)
      .eq('status', 'ativo')

    const seriesDisponiveis = Array.from(new Set((alunos || []).map(a => a.serie).filter(Boolean))).sort() as string[]

    return { config, seriesDisponiveis }
  } catch (e) {
    return { config: { saude: [], eduflix: [], sala_virtual: [] }, seriesDisponiveis: [] }
  }
}

export async function salvarConfiguracaoRecursos(config: { saude: string[]; eduflix: string[]; sala_virtual: string[] }) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const { error } = await admin
      .from('escolas')
      .update({ config_recursos: config })
      .eq('id', escola.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/recursos')
    revalidatePath('/professor/alunos')
    revalidatePath('/aluno')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao salvar.' }
  }
}