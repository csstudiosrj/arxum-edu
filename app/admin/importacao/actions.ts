'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getEscolaDoUsuario } from '@/lib/auth/escola-atual'
import { revalidatePath } from 'next/cache'

export type LinhaImportacao = {
  nome: string
  data_nascimento: string | null
  serie: string | null
  turno: string | null
  responsavel_nome: string | null
  responsavel_email: string
  responsavel_telefone: string | null
  responsavel_cpf: string | null
}

export async function importarAlunos(dados: LinhaImportacao[]) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    if (!dados || dados.length === 0) return { success: false, error: 'Nenhum dado para importar.' }

    const admin = createAdminClient()
    let importados = 0
    let atualizados = 0
    let erros = 0

    // Processa em lotes para não estourar o limite de requisições do Supabase
    const TAMANHO_LOTE = 50
    for (let i = 0; i < dados.length; i += TAMANHO_LOTE) {
      const lote = dados.slice(i, i + TAMANHO_LOTE)
      
      const registrosParaInserir = lote.map(d => ({
        escola_id: escola.id,
        nome: d.nome,
        data_nascimento: d.data_nascimento || null,
        serie: d.serie || null,
        turno: d.turno || null,
        responsavel_nome: d.responsavel_nome || 'Responsável',
        responsavel_email: d.responsavel_email,
        responsavel_telefone: d.responsavel_telefone || null,
        responsavel_cpf: d.responsavel_cpf || null,
        status: 'ativo',
      }))

      // Estratégia: Tenta inserir. Se o e-mail do responsável + nome já existir, atualiza.
      // Como o Supabase não permite onConflict composto fácil via JS client em todas as versões,
      // vamos fazer um UPSERT simples pelo ID se existir, ou INSERT.
      // Para simplificar e garantir a performance, faremos um INSERT em massa e 
      // capturamos os erros de duplicidade. Para atualização real, o ideal é checar antes.
      
      // Como estamos em um MVP, vamos focar em criar os novos. Se o e-mail do responsável já existir,
      // o sistema criará um novo aluno vinculado a ele (irmãos).
      
      const { error } = await admin.from('alunos').insert(registrosParaInserir)

      if (error) {
        console.error('Erro ao importar lote:', error)
        erros += lote.length
      } else {
        importados += lote.length
      }
    }

    revalidatePath('/admin/alunos')
    revalidatePath('/admin/relatorios')

    return { 
      success: true, 
      resumo: { importados, atualizados, erros } 
    }
  } catch (e) {
    console.error('Erro na importação:', e)
    return { success: false, error: 'Erro interno ao processar importação.' }
  }
}