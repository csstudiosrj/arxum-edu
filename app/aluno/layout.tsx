import { redirect } from 'next/navigation'
import { getAlunoDoUsuario } from '@/lib/auth/aluno-atual'

export const dynamic = 'force-dynamic'

export default async function AlunoLayout({ children }: { children: React.ReactNode }) {
  const aluno = await getAlunoDoUsuario()
  if (!aluno) {
    redirect('/login')
  }
  return <>{children}</>
}