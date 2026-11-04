import { getDadosMercadoPago } from './actions'
import { MercadoPagoClient } from './mercadopago-client'
import { getEscolaDoUsuario } from '@/lib/auth/escola-atual'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'

export const dynamic = 'force-dynamic'

export default async function MercadoPagoPage() {
  const escola = await getEscolaDoUsuario()

  if (!escola) {
    return (
      <AdminShell mode="school" active="Financeiro">
        <main className="px-5 py-8 lg:px-8">
          <SectionHeading eyebrow="Financeiro" title="Conta de Recebimento" description="Ocorreu um erro ao carregar os dados da sua escola." />
          <Panel className="mt-8 p-8 text-center">
            <p className="text-sm text-[#82939a]">
              Não foi possível encontrar os dados da escola vinculados à sua conta.
              Verifique se você está logado como Administrador da escola (e não como Super Admin).
            </p>
          </Panel>
        </main>
      </AdminShell>
    )
  }

  const dados = await getDadosMercadoPago()
  return <MercadoPagoClient dados={dados} />
}
