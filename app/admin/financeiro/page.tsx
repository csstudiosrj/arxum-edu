import { AdminShell, SectionHeading, Panel, ActionButton } from '@/components/admin-shell'
import { WalletCards } from 'lucide-react'

export default function FinanceiroPage() {
  const faturas: any[] = [] 

  return (
    <AdminShell active="Financeiro">
      <div className="mx-auto max-w-6xl p-5 lg:p-8">
        <div className="mb-8 flex items-center justify-between">
          <SectionHeading 
            title="Financeiro" 
            description="Gestão de faturas, inadimplência e integração Pagar.me." 
          />
          <ActionButton>Gerar Fatura</ActionButton>
        </div>

        <Panel className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
          <div className="mb-4 grid size-12 place-items-center rounded-full bg-[#f1f5f6] text-[#6b7d86]">
            <WalletCards className="size-6" />
          </div>
          <h3 className="text-lg font-semibold text-[#12232b]">Nenhuma fatura gerada</h3>
          <p className="mt-2 max-w-sm text-sm text-[#71838b]">
            O histórico financeiro e os repasses via split de pagamento aparecerão aqui.
          </p>
        </Panel>
      </div>
    </AdminShell>
  )
}