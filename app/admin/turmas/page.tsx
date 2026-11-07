import { getTurmas, getAlunosSemTurma, getProfessores } from './actions'
import { TurmasClient } from './turmas-client'

export const dynamic = 'force-dynamic'

export default async function TurmasPage() {
  const [turmas, alunosSemTurma, professores] = await Promise.all([
    getTurmas(),
    getAlunosSemTurma(),
    getProfessores()
  ])

  return <TurmasClient 
    turmasIniciais={turmas} 
    alunosSemTurma={alunosSemTurma} 
    professores={professores} 
  />
}