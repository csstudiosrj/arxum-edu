import { getNotas, getAlunosAtivos } from './actions'
import { getEscolaDoUsuario } from '@/lib/auth/escola-atual'
import { NotasClient } from './notas-client'

export const dynamic = 'force-dynamic'

export default async function NotasPage() {
  const [notas, alunos, escola] = await Promise.all([
    getNotas(),
    getAlunosAtivos(),
    getEscolaDoUsuario()
  ])

  return <NotasClient 
    notas={notas} 
    alunos={alunos} 
    configAvaliacao={(escola?.config_avaliacao as any) || { escala: '0-10', recuperacao: 'substitutiva' }}
  />
}