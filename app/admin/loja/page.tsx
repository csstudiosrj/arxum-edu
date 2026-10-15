import { AdminShell, SectionHeading, Panel, ActionButton } from '@/components/admin-shell'
import { CircleDollarSign } from 'lucide-react'

export default function LojaPage() {
  const produtos: any[] = [] 

  return (
    <AdminShell active="Loja">
      <div className="mx-auto max-w-6xl p-5 lg:p-8">
        <div className="mb-8 flex items-center justify-between">
          <SectionHeading 
            title="Loja Virtual" 
            description="Catálogo de uniformes, materiais e ingressos." 
          />
          <ActionButton>Adicionar Produto</ActionButton>
        </div>

        <Panel className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
          <div className="mb-4 grid size-12 place-items-center rounded-full bg-[#f1f5f6] text-[#6b7d86]">
            <CircleDollarSign className="size-6" />
          </div>
          <h3 className="text-lg font-semibold text-[#12232b]">Nenhum produto cadastrado</h3>
          <p className="mt-2 max-w-sm text-sm text-[#71838b]">
            Adicione produtos para que os responsáveis possam comprar através do aplicativo.
          </p>
        </Panel>
      </div>
    </AdminShell>
  )
}