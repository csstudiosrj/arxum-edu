'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getEscolaDoUsuario } from '@/lib/auth/escola-atual'
import { enviarEmailStatusMatricula } from '@/lib/emails/status-matricula'
import { enviarSeAtivo } from '@/lib/notificacoes-config-server'
import { revalidatePath } from 'next/cache'

export type DocumentosMatricula = {
  rg_aluno?: { url: string; nome: string } | null
  cpf_responsavel?: { url: string; nome: string } | null
  comprovante_residencia?: { url: string; nome: string } | null
  historico_escolar?: { url: string; nome: string } | null
}

export type Inscricao = {
  id: string
  protocolo: string
  escola_id: string | null
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
  documentos: DocumentosMatricula | null
  status: string
  criado_em: string
}

export async function getInscricoes(): Promise<Inscricao[]> {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return []

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('inscricoes')
      .select('*')
      .eq('escola_id', escola.id)
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
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const supabase = createAdminClient()

    const { data: inscricao, error } = await supabase
      .from('inscricoes')
      .update({ status: novoStatus, atualizado_em: new Date().toISOString() })
      .eq('id', id)
      .eq('escola_id', escola.id)
      .select('*')
      .single()

    if (error || !inscricao) {
      return { success: false, error: error?.message || 'Inscrição não encontrada.' }
    }

    if (novoStatus === 'matriculado') {
      const { data: existente } = await supabase
        .from('alunos')
        .select('id')
        .eq('inscricao_id', id)
        .maybeSingle()

      if (!existente) {
        const { error: erroAluno } = await supabase.from('alunos').insert({
          escola_id: escola.id,
          inscricao_id: inscricao.id,
          nome: inscricao.aluno_nome,
          data_nascimento: inscricao.aluno_data_nascimento,
          serie: inscricao.aluno_serie,
          turno: inscricao.aluno_turno,
          escola_origem: inscricao.aluno_escola_origem,
          responsavel_nome: inscricao.responsavel_nome,
          responsavel_email: inscricao.responsavel_email,
          responsavel_telefone: inscricao.responsavel_telefone,
          responsavel_cpf: inscricao.responsavel_cpf,
          responsavel_parentesco: inscricao.responsavel_parentesco,
          endereco_cep: inscricao.endereco_cep,
          endereco_rua: inscricao.endereco_rua,
          endereco_numero: inscricao.endereco_numero,
          endereco_complemento: inscricao.endereco_complemento,
          endereco_bairro: inscricao.endereco_bairro,
          endereco_cidade: inscricao.endereco_cidade,
          endereco_estado: inscricao.endereco_estado,
          emergencia_nome: inscricao.emergencia_nome,
          emergencia_telefone: inscricao.emergencia_telefone,
          emergencia_parentesco: inscricao.emergencia_parentesco,
          anamnese_alergias: inscricao.anamnese_alergias,
          anamnese_condicoes: inscricao.anamnese_condicoes,
          anamnese_medicamentos: inscricao.anamnese_medicamentos,
          anamnese_plano_saude: inscricao.anamnese_plano_saude,
          documentos: inscricao.documentos || {},
        })

        if (erroAluno) {
          console.error('Erro ao criar aluno:', erroAluno)
          return { success: false, error: 'Matrícula efetivada, mas houve erro ao criar o aluno.' }
        }
      }
    }

    try {
      await enviarSeAtivo({
        escolaId: escola.id,
        evento: 'matricula_status',
        enviar: () =>
          enviarEmailStatusMatricula({
            para: inscricao.responsavel_email,
            alunoNome: inscricao.aluno_nome,
            protocolo: inscricao.protocolo,
            novoStatus,
            escolaNome: escola.nome,
          }),
      })
    } catch (e) {
      console.error('[email] Falha ao enviar, mas status foi atualizado:', e)
    }

    revalidatePath('/admin/matriculas')
    revalidatePath('/admin/alunos')
    revalidatePath('/responsavel')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao atualizar status.' }
  }
}