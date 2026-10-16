'use client'

import { SinoNotificacoes } from './sino-notificacoes'
import {
  getNotificacoesAdmin,
  getNotificacoesResponsavel,
  getNotificacoesAluno,
  getNotificacoesProfessor,
} from '@/lib/notificacoes'

type Papel = 'admin' | 'responsavel' | 'aluno' | 'professor'

export function SinoNotificacoesLoader({ papel }: { papel: Papel }) {
  const acoes = {
    admin: getNotificacoesAdmin,
    responsavel: getNotificacoesResponsavel,
    aluno: getNotificacoesAluno,
    professor: getNotificacoesProfessor,
  }
  return <SinoNotificacoes carregarNotificacoes={acoes[papel]} />
}