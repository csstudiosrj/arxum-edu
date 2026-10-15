'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type DocumentosMatricula = {
  rg_aluno?: { url: string; nome: string } | null
  cpf_responsavel?: { url: string; nome: string } | null
  comprovante_residencia?: { url: string; nome: string } | null
  historico_escolar?: { url: string; nome: string } | null
}

export type InscricaoResponsavel = {
  id: string
  protocolo: string
  aluno_nome: string
  aluno_serie: string | null
  aluno_turno: string | null
  status: string
  documentos: DocumentosMatricula | null
  criado_em: string
  atualizado_em: string
}

export async function getMinhasInscricoes(): Promise<InscricaoResponsavel[]> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !user.email) return []

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('inscricoes')
      .select('id, protocolo, aluno_nome, aluno_serie, aluno_turno, status, documentos, criado_em, atualizado_em')
      .eq('responsavel_email', user.email)
      .order('criado_em', { ascending: false })

    if (error) {
      console.error('Erro ao buscar inscrições do responsável:', error)
      return []
    }

    return (data || []) as InscricaoResponsavel[]
  } catch (e) {
    console.error('Erro inesperado:', e)
    return []
  }
}