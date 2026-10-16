// Metadata client-safe. Não importa nada de server.
// As funções server-only estão em `notificacoes-config-server.ts`.

export type EventoNotificacao =
  | 'comunicado'
  | 'nota'
  | 'fatura'
  | 'ocorrencia'
  | 'autorizacao'
  | 'matricula_status'
  | 'resposta_autorizacao'

export type ConfigEvento = {
  evento: EventoNotificacao
  canal_email: boolean
  canal_whatsapp: boolean
  canal_push: boolean
}

export type EventoMeta = {
  evento: EventoNotificacao
  titulo: string
  descricao: string
  quemRecebe: string
  cor: string
}

export const EVENTOS_META: EventoMeta[] = [
  {
    evento: 'comunicado',
    titulo: 'Comunicados gerais',
    descricao: 'Quando a escola publica um comunicado, os responsáveis recebem por e-mail.',
    quemRecebe: 'Responsáveis',
    cor: '#0d9488',
  },
  {
    evento: 'nota',
    titulo: 'Notas lançadas',
    descricao: 'Aviso quando o professor lança uma nota nova no boletim do aluno.',
    quemRecebe: 'Responsáveis',
    cor: '#3b82f6',
  },
  {
    evento: 'fatura',
    titulo: 'Faturas emitidas',
    descricao: 'Aviso de nova fatura, lembrete de vencimento e cobrança de atraso.',
    quemRecebe: 'Responsáveis',
    cor: '#065f46',
  },
  {
    evento: 'ocorrencia',
    titulo: 'Ocorrências registradas',
    descricao: 'Aviso imediato quando a escola registra uma ocorrência com o aluno.',
    quemRecebe: 'Responsáveis',
    cor: '#dc2626',
  },
  {
    evento: 'autorizacao',
    titulo: 'Autorizações pendentes',
    descricao: 'Aviso de autorização que precisa ser respondida pelo responsável.',
    quemRecebe: 'Responsáveis',
    cor: '#3b82f6',
  },
  {
    evento: 'matricula_status',
    titulo: 'Mudança de status da matrícula',
    descricao: 'Avisos de aprovação, lista de espera, entrevista e efetivação.',
    quemRecebe: 'Responsáveis do candidato',
    cor: '#7c3aed',
  },
  {
    evento: 'resposta_autorizacao',
    titulo: 'Respostas de autorização',
    descricao: 'Aviso interno quando o responsável responde uma autorização.',
    quemRecebe: 'Equipe da escola',
    cor: '#0891b2',
  },
]

export const CONFIG_PADRAO: ConfigEvento[] = EVENTOS_META.map((m) => ({
  evento: m.evento,
  canal_email: true,
  canal_whatsapp: false,
  canal_push: false,
}))

export function eventoMeta(evento: EventoNotificacao): EventoMeta {
  return EVENTOS_META.find((m) => m.evento === evento) || EVENTOS_META[0]
}