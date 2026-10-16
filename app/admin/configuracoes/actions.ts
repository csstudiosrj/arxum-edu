'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getEscolaDoUsuario, type EscolaCompleta } from '@/lib/auth/escola-atual'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type DadosEscolaInput = {
  nome: string
  cnpj: string
  endereco: string
  cidade: string
  estado: string
  telefone: string
  email_contato: string
  site: string
}

export async function getDadosEscola(): Promise<EscolaCompleta | null> {
  return await getEscolaDoUsuario()
}

export async function salvarDadosEscola(data: DadosEscolaInput) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const { error } = await admin
      .from('escolas')
      .update({
        nome: data.nome,
        cnpj: data.cnpj || null,
        endereco: data.endereco || null,
        cidade: data.cidade || null,
        estado: data.estado || null,
        telefone: data.telefone || null,
        email_contato: data.email_contato || null,
        site: data.site || null,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', escola.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/configuracoes')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao salvar.' }
  }
}

// ── SOLICITAÇÃO DE RECURSO FUTURO ───────────────────────────────────
// Quando o admin clica em "Avisar quando estiver pronto" num card de
// recurso em desenvolvimento, cria um ticket em tickets_suporte com
// categoria 'sugestao'. O time ARXUM vê no /super-admin/suporte.

export async function solicitarRecursoFuturo(recursoTitulo: string) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    if (!recursoTitulo.trim()) {
      return { success: false, error: 'Recurso inválido.' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const admin = createAdminClient()

    let nomeSolicitante = 'Administrador(a)'
    if (user?.email) {
      const { data: perfil } = await admin
        .from('perfis')
        .select('nome')
        .eq('email', user.email)
        .maybeSingle()
      if (perfil?.nome) nomeSolicitante = perfil.nome
    }

    // Verifica se já existe ticket idêntico aberto recente para não duplicar
    const { data: existente } = await admin
      .from('tickets_suporte')
      .select('id')
      .eq('escola_id', escola.id)
      .eq('categoria', 'sugestao')
      .eq('assunto', `Interesse no recurso: ${recursoTitulo}`)
      .in('status', ['aberto', 'em_andamento'])
      .maybeSingle()

    if (existente) {
      return { success: true, jaExistia: true }
    }

    const { error } = await admin.from('tickets_suporte').insert({
      escola_id: escola.id,
      escola_nome: escola.nome,
      assunto: `Interesse no recurso: ${recursoTitulo}`,
      descricao: `${nomeSolicitante} sinalizou interesse no recurso "${recursoTitulo}" que está em desenvolvimento no roadmap ARXUM. Avisar quando estiver disponível.`,
      prioridade: 'baixa',
      categoria: 'sugestao',
      status: 'aberto',
      aberto_por: nomeSolicitante,
    })

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/configuracoes')
    return { success: true }
  } catch (e) {
    console.error('Erro ao solicitar recurso futuro:', e)
    return { success: false, error: 'Erro ao registrar interesse.' }
  }
}