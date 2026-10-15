import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import { Settings } from 'lucide-react'

export default function ConfiguracoesPage() {
  return (
    <AdminShell active="Configurações">
      <div className="mx-auto max-w-6xl p-5 lg:p-8">
        <div className="mb-8">
          <SectionHeading 
            title="Configurações" 
            description="Personalize os dados da escola, departamentos e integrações." 
          />
        </div>

        <Panel className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
          <div className="mb-4 grid size-12 place-items-center rounded-full bg-[#f1f5f6] text-[#6b7d86]">
            <Settings className="size-6" />
          </div>
          <h3 className="text-lg font-semibold text-[#12232b]">Configurações da Unidade</h3>
          <p className="mt-2 max-w-sm text-sm text-[#71838b]">
            Em breve, os formulários dinâmicos e chaves de API poderão ser configurados aqui.
          </p>
        </Panel>
      </div>
    </AdminShell>
  )
}