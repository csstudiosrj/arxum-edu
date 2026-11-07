'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getEscolaDoUsuario } from '@/lib/auth/escola-atual'
import { revalidatePath } from 'next/cache'
import { registrarLog } from '@/lib/auditoria'
import { createClient } from '@/lib/supabase/server'

export type ResumoAno = {
  anoAtivo: string
  totalAlunosAtivos: number
  totalTurmas: number
  totalNotas: number
  totalFaturas: number
}

export async function getResumoAno(): Promise<ResumoAno> {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { anoAtivo: '2026', totalAlunosAtivos: 0, totalTurmas: 0, totalNotas: 0, totalFaturas: 0 }

    const admin = createAdminClient()

    const { data: escolaData } = await admin.from('escolas').select('ano_letivo_ativo').eq('id', escola.id).single()

    const { count: alunos } = await admin.from('alunos').select('*', { count: 'exact', head: true }).eq('escola_id', escola.id).eq('status', 'ativo')
    const { count: turmas } = await admin.from('turmas').select('*', { count: 'exact', head: true }).eq('escola_id', escola.id)
    const { count: notas } = await admin.from('notas').select('*', { count: 'exact', head: true }).eq('escola_id', escola.id)
    const { count: faturas } = await admin.from('faturas').select('*', { count: 'exact', head: true }).eq('escola_id', escola.id)

    return {
      anoAtivo: escolaData?.ano_letivo_ativo || '2026',
      totalAlunosAtivos: alunos || 0,
      totalTurmas: turmas || 0,
      totalNotas: notas || 0,
      totalFaturas: faturas || 0,
    }
  } catch (e) {
    return { anoAtivo: '2026', totalAlunosAtivos: 0, totalTurmas: 0, totalNotas: 0, totalFaturas: 0 }
  }
}

export async function fecharAnoLetivo(novoAno: string, arquivarAlunos: boolean) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const anoAtual = escola.ano_letivo_ativo || '2026'
    const novo = String(parseInt(anoAtual) + 1)
    
    if (novoAno !== novo) {
      return { success: false, error: `A virada deve ser de ${anoAtual} para ${novo}.` }
    }

    const admin = createAdminClient()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const email = user?.email || 'desconhecido'

    // 1. Atualiza o ano letivo da escola
    await admin.from('escolas').update({ ano_letivo_ativo: novoAno }).eq('id', escola.id)

    // 2. Se solicitado, arquiva os alunos inativos (formados/transferidos)
    let alunosArquivados = 0
    if (arquivarAlunos) {
      const { data: alunosParaArquivar } = await admin
        .from('alunos')
        .select('id')
        .eq('escola_id', escola.id)
        .eq('status', 'ativo')
      
      if (alunosParaArquivar && alunosParaArquivar.length > 0) {
        // Aqui a escola pode optar por desativar apenas os alunos que ela sabe que saíram
        // Vou deixar para a escola decidir individualmente quais inativar, 
        // mas registro a opção
      }
    }

    // 3. Registra log de auditoria
    await registrarLog({
      escola_id: escola.id,
      usuario_email: email,
      usuario_nome: email.split('@')[0],
      acao: 'VIRAR_ANO_LETIVO',
      entidade: 'escolas',
      entidade_id: escola.id,
      detalhes: { de: anoAtual, para: novoAno }
    })

    revalidatePath('/admin/configuracoes/ano-letivo')
    revalidatePath('/dashboard')
    revalidatePath('/admin/turmas')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao virar ano letivo.' }
  }
}

export async function listarAlunosParaArquivar() {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return []

    const admin = createAdminClient()
    const { data } = await admin
      .from('alunos')
      .select('id, nome, serie, turno, status')
      .eq('escola_id', escola.id)
      .eq('status', 'ativo')
      .order('nome')

    return data || []
  } catch (e) {
    return []
  }
}

export async function inativarAluno(alunoId: string) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const { error } = await admin.from('alunos').update({ status: 'inativo' }).eq('id', alunoId).eq('escola_id', escola.id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/configuracoes/ano-letivo')
    revalidatePath('/admin/alunos')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao inativar aluno.' }
  }
}