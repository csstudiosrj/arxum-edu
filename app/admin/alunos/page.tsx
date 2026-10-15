import { AdminShell, SectionHeading, Panel, ActionButton } from '@/components/admin-shell'
import { Users } from 'lucide-react'

export default function AlunosPage() {
  // No futuro, faremos o fetch no Supabase aqui: const { data: alunos } = await supabase.from('alunos').select('*')
  const alunos: any[] = [] 

  return (
    <AdminShell active="Alunos">
      <div className="mx-auto max-w-6xl p-5 lg:p-8">
        <div className="mb-8 flex items-center justify-between">
          <SectionHeading 
            title="Alunos" 
            description="Gestão de alunos matriculados e turmas." 
          />
          <ActionButton>Novo Aluno</ActionButton>
        </div>

        <Panel className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
          <div className="mb-4 grid size-12 place-items-center rounded-full bg-[#f1f5f6] text-[#6b7d86]">
            <Users className="size-6" />
          </div>
          <h3 className="text-lg font-semibold text-[#12232b]">Nenhum aluno encontrado</h3>
          <p className="mt-2 max-w-sm text-sm text-[#71838b]">
            Ainda não há alunos cadastrados no banco de dados. Os alunos aparecerão aqui após a efetivação das matrículas.
          </p>
        </Panel>
      </div>
    </AdminShell>
  )
}