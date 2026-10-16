import { redirect } from 'next/navigation'
import { getProfessorDoUsuario } from '@/lib/auth/professor-atual'

export const dynamic = 'force-dynamic'

export default async function ProfessorLayout({ children }: { children: React.ReactNode }) {
  const prof = await getProfessorDoUsuario()
  if (!prof) redirect('/login')
  return <>{children}</>
}