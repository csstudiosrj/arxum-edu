import { AdminShell, SectionHeading, Panel, ActionButton } from '@/components/admin-shell'
import { Bell } from 'lucide-react'

export default function ComunicacaoPage() {
  const comunicados: any[] = [] 

  return (
    <AdminShell active="Comunicação">
      <div className="mx-auto max-w-6xl p-5 lg:p-8">
        <div className="mb-8 flex items-center justify-between">
          <SectionHeading 
            title="Comunicação" 
            description="Envio de comunicados e gestão de tickets por departamento." 
          />
          <ActionButton>Novo Comunicado</ActionButton>
        </div>

        <Panel className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
          <div className="mb-4 grid size-12 place-items-center rounded-full bg-[#f1f5f6] text-[#6b7d86]">
            <Bell className="size-6" />
          </div>
          <h3 className="text-lg font-semibold text-[#12232b]">Caixa de entrada vazia</h3>
          <p className="mt-2 max-w-sm text-sm text-[#71838b]">
            Nenhuma mensagem ou ticket de atendimento recebido no momento.
          </p>
        </Panel>
      </div>
    </AdminShell>
  )
}