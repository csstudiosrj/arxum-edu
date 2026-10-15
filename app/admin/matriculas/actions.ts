'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export type Inscricao = {
  id: string
  protocolo: string
  aluno_nome: string
  aluno_data_nascimento: string | null
  aluno_serie: string | null
  aluno_turno: string | null
  aluno_escola_origem: string | null
  responsavel_nome: string
  responsavel_cpf: string | null
  responsavel_email: string
  responsavel_telefone: string | null
  responsavel_parentesco: string | null
  endereco_cep: string | null
  endereco_rua: string | null
  endereco_numero: string | null
  endereco_complemento: string | null
  endereco_bairro: string | null
  endereco_cidade: string | null
  endereco_estado: string | null
  emergencia_nome: string | null
  emergencia_telefone: string | null
  emergencia_parentesco: string | null
  anamnese_alergias: string | null
  anamnese_condicoes: string | null
  anamnese_medicamentos: string | null
  anamnese_plano_saude: string | null
  status: string
  criado_em: string
}

export async function getInscricoes(): Promise<Inscricao[]> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('inscricoes')
      .select('*')
      .order('criado_em', { ascending: false })

    if (error) {
      console.error('Erro ao buscar inscrições:', error)
      return []
    }
    return (data || []) as Inscricao[]
  } catch (e) {
    console.error('Erro inesperado:', e)
    return []
  }
}

export async function atualizarStatusInscricao(id: string, novoStatus: string) {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase
      .from('inscricoes')
      .update({ status: novoStatus, atualizado_em: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/matriculas')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao atualizar status.' }
  }
}