'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getEscolaDaRequisicao } from '@/lib/auth/escola-atual'
import { registrarConsentimento } from '@/lib/consentimentos-server'
import { POLITICA_VERSAO } from '@/lib/consentimentos'

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
  consentimento_politica: boolean
  consentimento_imagem: boolean
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

    if (!data.consentimento_politica) {
      return { success: false, error: 'É necessário aceitar a política de privacidade.' }
    }

    // Remove os campos de consentimento antes de gravar na tabela `inscricoes`.
    const {
      consentimento_politica: _cp,
      consentimento_imagem: _ci,
      ...dadosInscricao
    } = data

    const supabase = createAdminClient()

    const { data: inscricao, error } = await supabase
      .from('inscricoes')
      .insert({
        escola_id: escola.id,
        ...dadosInscricao,
        documentos,
      })
      .select('protocolo')
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    // Consentimentos (best-effort). Não bloqueia o fluxo se falhar.
    const base = {
      escolaId: escola.id,
      usuarioId: null,
      responsavelEmail: data.responsavel_email,
      alunoNome: data.aluno_nome,
    }

    await registrarConsentimento({
      ...base,
      tipo: 'politica_privacidade',
      versao: POLITICA_VERSAO,
    })

    // Só grava uso_imagem se o responsável autorizou.
    // A ausência de registro = não autorizou (default conservador).
    if (data.consentimento_imagem) {
      await registrarConsentimento({
        ...base,
        tipo: 'uso_imagem',
        versao: POLITICA_VERSAO,
      })
    }

    return { success: true, protocolo: inscricao.protocolo }
  } catch (e) {
    return { success: false, error: 'Erro ao enviar inscrição. Tente novamente.' }
  }
}