'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getEscolaDoUsuario } from '@/lib/auth/escola-atual'
import { revalidatePath } from 'next/cache'

export type ConfigRecursos = {
  saude: string[]
  eduflix: string[]
  sala_virtual: string[]
  notas: string[]
  atividades: string[]
}

const CONFIG_PADRAO: ConfigRecursos = {
  saude: [],
  eduflix: [],
  sala_virtual: [],
  notas: [],
  atividades: [],
}

export async function getConfiguracaoRecursos() {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { config: CONFIG_PADRAO, seriesDisponiveis: [] }

    const admin = createAdminClient()
    
    const { data: escolaData } = await admin
      .from('escolas')
      .select('config_recursos')
      .eq('id', escola.id)
      .maybeSingle()

    // Garante que se o banco tiver o formato antigo, a gente mescla com o novo
    const config = { ...CONFIG_PADRAO, ...(escolaData?.config_recursos || {}) }

    const { data: alunos } = await admin
      .from('alunos')
      .select('serie')
      .eq('escola_id', escola.id)
      .eq('status', 'ativo')

    const seriesDisponiveis = Array.from(new Set((alunos || []).map(a => a.serie).filter(Boolean))).sort() as string[]

    return { config, seriesDisponiveis }
  } catch (e) {
    return { config: CONFIG_PADRAO, seriesDisponiveis: [] }
  }
}

export async function salvarConfiguracaoRecursos(config: ConfigRecursos) {
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
    revalidatePath('/professor')
    revalidatePath('/aluno')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao salvar.' }
  }
}