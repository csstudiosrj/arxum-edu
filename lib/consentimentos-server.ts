import 'server-only'
import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ConsentimentoInput } from '@/lib/consentimentos'

async function getMetaRequisicao(): Promise<{ ip: string | null; userAgent: string | null }> {
  try {
    const h = await headers()
    const forwarded = h.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : h.get('x-real-ip')
    const userAgent = h.get('user-agent')
    return { ip, userAgent }
  } catch {
    return { ip: null, userAgent: null }
  }
}

// Grava o consentimento. Best-effort — em caso de falha, apenas loga
// e devolve { success: false }. Nunca lança.
export async function registrarConsentimento(
  input: ConsentimentoInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const { ip, userAgent } = await getMetaRequisicao()
    const admin = createAdminClient()

    const { error } = await admin.from('consentimentos').insert({
      escola_id: input.escolaId,
      usuario_id: input.usuarioId,
      responsavel_email: input.responsavelEmail,
      aluno_nome: input.alunoNome,
      tipo: input.tipo,
      versao: input.versao,
      ip,
      user_agent: userAgent,
    })

    if (error) {
      console.error('[consentimento] Falha ao gravar:', error.message)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (e) {
    console.error('[consentimento] Erro inesperado:', e)
    return { success: false, error: 'Erro ao gravar consentimento.' }
  }
}