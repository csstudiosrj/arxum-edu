'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getEscolaDaRequisicao } from '@/lib/auth/escola-atual'

export type InscricaoInput = {
  aluno_nome: string
  aluno_data_nascimento: string
  aluno_serie: string
  aluno_turno: string
  aluno_escola_origem: string
  responsavel_nome: string
  responsavel_cpf: string
  responsavel_email: string
  responsavel_telefone: string
  responsavel_parentesco: string
  endereco_cep: string
  endereco_rua: string
  endereco_numero: string
  endereco_complemento: string
  endereco_bairro: string
  endereco_cidade: string
  endereco_estado: string
  emergencia_nome: string
  emergencia_telefone: string
  emergencia_parentesco: string
  anamnese_alergias: string
  anamnese_condicoes: string
  anamnese_medicamentos: string
  anamnese_plano_saude: string
}

export type DocumentosInput = {
  rg_aluno?: { url: string; nome: string } | null
  cpf_responsavel?: { url: string; nome: string } | null
  comprovante_residencia?: { url: string; nome: string } | null
  historico_escolar?: { url: string; nome: string } | null
}

export async function submitInscricao(data: InscricaoInput, documentos: DocumentosInput = {}) {
  try {
    const escola = await getEscolaDaRequisicao()
    if (!escola) {
      return { success: false, error: 'Escola não encontrada.' }
    }

    const supabase = createAdminClient()

    const { data: inscricao, error } = await supabase
      .from('inscricoes')
      .insert({
        escola_id: escola.id,
        ...data,
        documentos,
      })
      .select('protocolo')
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, protocolo: inscricao.protocolo }
  } catch (e) {
    return { success: false, error: 'Erro ao enviar inscrição. Tente novamente.' }
  }
}

export async function getNomeEscolaPublica(): Promise<string> {
  const escola = await getEscolaDaRequisicao()
  return escola?.nome || 'Escola'
}