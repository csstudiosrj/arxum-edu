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
  data_entrevista: string | null
  criado_em: string
  autorizou_imagem: boolean | null
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

    if (error) return []

    if (!data || data.length === 0) return []

    const { data: consentimentos } = await supabase
      .from('consentimentos')
      .select('responsavel_email, aluno_nome')
      .eq('escola_id', escola.id)
      .eq('tipo', 'uso_imagem')

    const autorizouSet = new Set(
      (consentimentos || []).map(
        (c) => `${(c.responsavel_email || '').toLowerCase()}::${(c.aluno_nome || '').toLowerCase()}`
      )
    )

    return (data as Omit<Inscricao, 'autorizou_imagem'>[]).map((i) => {
      const chave = `${i.responsavel_email.toLowerCase()}::${i.aluno_nome.toLowerCase()}`
      const teveAlgumConsentimento = autorizouSet.has(chave)
      return {
        ...i,
        autorizou_imagem: teveAlgumConsentimento ? true : false,
      }
    }) as Inscricao[]
  } catch (e) {
    return []
  }
}

export async function atualizarStatusInscricao(
  id: string, 
  novoStatus: string, 
  dataEntrevista?: string,
  turmaId?: string
) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const supabase = createAdminClient()

    const { data: inscricaoAtual, error: fetchError } = await supabase
      .from('inscricoes')
      .select('*')
      .eq('id', id)
      .eq('escola_id', escola.id)
      .single()

    if (fetchError || !inscricaoAtual) {
      return { success: false, error: 'Inscrição não encontrada.' }
    }

    if (novoStatus === 'matriculado') {
      if (!turmaId) {
        return { success: false, error: 'Selecione uma turma para matricular o aluno.' }
      }

      const { data: existente } = await supabase
        .from('alunos')
        .select('id')
        .eq('inscricao_id', id)
        .maybeSingle()

      if (!existente) {
        // TRAVA DE SEGURANÇA: LIMITE DE ALUNOS (PLANO)
        const { data: escolaData } = await supabase.from('escolas').select('plano').eq('id', escola.id).single()
        const { data: plano } = await supabase.from('planos').select('max_alunos, teto_alunos_excedentes').eq('slug', escolaData?.plano || 'semente').single()
        
        const maxAlunos = plano?.max_alunos || 0
        const teto = plano?.teto_alunos_excedentes || 0
        const totalPermitido = maxAlunos + teto

        const { count } = await supabase
          .from('alunos')
          .select('*', { count: 'exact', head: true })
          .eq('escola_id', escola.id)
          .eq('status', 'ativo')

        if (maxAlunos > 0 && (count || 0) >= totalPermitido) {
          return { 
            success: false, 
            error: `Limite de tolerância excedido (${totalPermitido} alunos). Para matricular este aluno, faça upgrade de plano nas configurações da escola.` 
          }
        }

        // TRAVA DE SEGURANÇA: CAPACIDADE DA TURMA
        const { data: turma } = await supabase
          .from('turmas')
          .select('capacidade_maxima')
          .eq('id', turmaId)
          .eq('escola_id', escola.id)
          .single()

        if (!turma) return { success: false, error: 'Turma não encontrada.' }

        const { count: alunosNaTurma } = await supabase
          .from('alunos')
          .select('*', { count: 'exact', head: true })
          .eq('turma_id', turmaId)
          .eq('status', 'ativo')

        if ((alunosNaTurma || 0) >= turma.capacidade_maxima) {
          return { success: false, error: 'Esta turma já está lotada. Selecione outra turma.' }
        }

        // CRIA O ALUNO (VINCULADO À TURMA)
        const { error: erroAluno } = await supabase.from('alunos').insert({
          escola_id: escola.id,
          inscricao_id: inscricaoAtual.id,
          turma_id: turmaId, // AQUI O VÍNCULO
          nome: inscricaoAtual.aluno_nome,
          data_nascimento: inscricaoAtual.aluno_data_nascimento,
          serie: inscricaoAtual.aluno_serie,
          turno: inscricaoAtual.aluno_turno,
          escola_origem: inscricaoAtual.aluno_escola_origem,
          responsavel_nome: inscricaoAtual.responsavel_nome,
          responsavel_email: inscricaoAtual.responsavel_email,
          responsavel_telefone: inscricaoAtual.responsavel_telefone,
          responsavel_cpf: inscricaoAtual.responsavel_cpf,
          responsavel_parentesco: inscricaoAtual.responsavel_parentesco,
          endereco_cep: inscricaoAtual.endereco_cep,
          endereco_rua: inscricaoAtual.endereco_rua,
          endereco_numero: inscricaoAtual.endereco_numero,
          endereco_complemento: inscricaoAtual.endereco_complemento,
          endereco_bairro: inscricaoAtual.endereco_bairro,
          endereco_cidade: inscricaoAtual.endereco_cidade,
          endereco_estado: inscricaoAtual.endereco_estado,
          emergencia_nome: inscricaoAtual.emergencia_nome,
          emergencia_telefone: inscricaoAtual.emergencia_telefone,
          emergencia_parentesco: inscricaoAtual.emergencia_parentesco,
          anamnese_alergias: inscricaoAtual.anamnese_alergias,
          anamnese_condicoes: inscricaoAtual.anamnese_condicoes,
          anamnese_medicamentos: inscricaoAtual.anamnese_medicamentos,
          anamnese_plano_saude: inscricaoAtual.anamnese_plano_saude,
          documentos: inscricaoAtual.documentos || {},
        })

        if (erroAluno) {
          return { success: false, error: 'Erro ao criar o aluno no banco de dados.' }
        }
      }
    }

    const payload: any = { status: novoStatus, atualizado_em: new Date().toISOString() }
    if (novoStatus === 'entrevista' && dataEntrevista) {
      payload.data_entrevista = dataEntrevista
    }

    const { data: inscricaoAtualizada, error } = await supabase
      .from('inscricoes')
      .update(payload)
      .eq('id', id)
      .eq('escola_id', escola.id)
      .select('*')
      .single()

    if (error || !inscricaoAtualizada) {
      return { success: false, error: error?.message || 'Erro ao atualizar status.' }
    }

    try {
      await enviarSeAtivo({
        escolaId: escola.id,
        evento: 'matricula_status',
        enviar: () =>
          enviarEmailStatusMatricula({
            para: inscricaoAtualizada.responsavel_email,
            alunoNome: inscricaoAtualizada.aluno_nome,
            protocolo: inscricaoAtualizada.protocolo,
            novoStatus,
            escolaNome: escola.nome,
          }),
      })
    } catch (e) {
      console.error('[email] Falha ao enviar:', e)
    }

    revalidatePath('/admin/matriculas')
    revalidatePath('/admin/alunos')
    revalidatePath('/admin/turmas')
    revalidatePath('/responsavel')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao atualizar status.' }
  }
}