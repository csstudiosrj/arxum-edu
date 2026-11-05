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

export async function salvarConfiguracaoPagamento(data: {
  ciclo_cobranca_loja?: string
}) {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    const payload: Record<string, any> = { atualizado_em: new Date().toISOString() }

    if (data.ciclo_cobranca_loja !== undefined) payload.ciclo_cobranca_loja = data.ciclo_cobranca_loja

    const { error } = await admin.from('escolas').update(payload).eq('id', escola.id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/configuracoes')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao salvar configurações de pagamento.' }
  }
}

export async function desconectarMercadoPago() {
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }

    const admin = createAdminClient()
    
    // (Opcional) Aqui você poderia chamar a API do MP para revogar o token, 
    // mas para simplificar, apenas limpamos do nosso banco.

    const { error } = await admin
      .from('escolas')
      .update({
        mercadopago_access_token: null,
        mercadopago_refresh_token: null,
        mercadopago_user_id: null,
        gateway_preferido: 'proprio',
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', escola.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/configuracoes')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Erro ao desconectar.' }
  }
}

export async function solicitarRecursoFuturo(recursoTitulo: string) {
  // ... mantém a mesma função que já existia
  try {
    const escola = await getEscolaDoUsuario()
    if (!escola) return { success: false, error: 'Escola não encontrada.' }
    if (!recursoTitulo.trim()) return { success: false, error: 'Recurso inválido.' }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const admin = createAdminClient()

    let nomeSolicitante = 'Administrador(a)'
    if (user?.email) {
      const { data: perfil } = await admin.from('perfis').select('nome').eq('email', user.email).maybeSingle()
      if (perfil?.nome) nomeSolicitante = perfil.nome
    }

    const { data: existente } = await admin
      .from('tickets_suporte')
      .select('id')
      .eq('escola_id', escola.id)
      .eq('categoria', 'sugestao')
      .eq('assunto', `Interesse no recurso: ${recursoTitulo}`)
      .in('status', ['aberto', 'em_andamento'])
      .maybeSingle()

    if (existente) return { success: true, jaExistia: true }

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
    return { success: false, error: 'Erro ao registrar interesse.' }
  }
}
