// Constantes e tipos client-safe. A gravação server-only está em
// `lib/consentimentos-server.ts`.

export const POLITICA_VERSAO = 'v1-2026-10'
export const TERMOS_VERSAO = 'v1-2026-10'

export type TipoConsentimento =
  | 'politica_privacidade'
  | 'uso_imagem'
  | 'termos_uso'

export type ConsentimentoInput = {
  escolaId: string | null
  usuarioId: string | null
  responsavelEmail: string | null
  alunoNome: string | null
  tipo: TipoConsentimento
  versao: string
}

export const CONSENTIMENTO_LABELS: Record<TipoConsentimento, string> = {
  politica_privacidade: 'Política de Privacidade',
  uso_imagem: 'Uso de Imagem',
  termos_uso: 'Termos de Uso',
}