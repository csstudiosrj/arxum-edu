import { createAdminClient } from '@/lib/supabase/admin'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import { CheckCircle2, XCircle, Server, ShieldCheck, Mail, UploadCloud } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function checkMercadoPago() {
  try {
    const res = await fetch('https://api.mercadopago.com/users/me', {
      headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` }
    })
    if (!res.ok) return { status: 'error', message: 'Token inválido ou expirado.' }
    return { status: 'ok', message: 'Conexão ativa.' }
  } catch { return { status: 'error', message: 'Falha de conexão.' } }
}

async function checkSupabase() {
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('escolas').select('id').limit(1)
    if (error) return { status: 'error', message: 'Erro na tabela escolas.' }
    return { status: 'ok', message: 'Conexão ativa.' }
  } catch { return { status: 'error', message: 'Falha de conexão.' } }
}

function checkEnv(key: string) {
  return process.env[key] ? { status: 'ok', message: 'Configurado' } : { status: 'error', message: 'Ausente' }
}

export default async function SistemaPage() {
  const [mp, supa] = await Promise.all([checkMercadoPago(), checkSupabase()])
  
  const services = [
    { name: 'Mercado Pago', icon: ShieldCheck, ...mp },
    { name: 'Supabase (Banco)', icon: Server, ...supa },
    { name: 'Resend (E-mails)', icon: Mail, ...checkEnv('RESEND_API_KEY') },
    { name: 'Uploadthing (Arquivos)', icon: UploadCloud, ...checkEnv('UPLOADTHING_SECRET') },
  ]

  return (
    <AdminShell mode="super" active="Sistema">
      <main className="px-5 py-8 lg:px-8">
        <SectionHeading eyebrow="ARXUM Admin" title="Status do Sistema" description="Monitoramento de integrações e serviços." />
        
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {services.map(s => {
            const Icon = s.icon
            return (
              <Panel key={s.name} className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="size-4 text-[#6b7d86]" />
                    <p className="text-sm font-bold text-[#12232b]">{s.name}</p>
                  </div>
                  {s.status === 'ok' ? <CheckCircle2 className="text-[#0d9488] size-5" /> : <XCircle className="text-[#dc2626] size-5" />}
                </div>
                <p className={`mt-2 text-xs font-medium ${s.status === 'ok' ? 'text-[#0d9488]' : 'text-[#dc2626]'}`}>{s.message}</p>
              </Panel>
            )
          })}
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-bold text-[#12232b] mb-4">Variáveis de Ambiente</h3>
          <Panel className="p-5">
            <ul className="space-y-3 text-sm font-mono text-[#536871]">
              <li className="flex justify-between border-b border-[#e5ecee] pb-3">
                <span>MERCADOPAGO_ACCESS_TOKEN</span> 
                {process.env.MERCADOPAGO_ACCESS_TOKEN ? <CheckCircle2 className="size-4 text-[#0d9488]" /> : <XCircle className="size-4 text-[#dc2626]" />}
              </li>
              <li className="flex justify-between border-b border-[#e5ecee] pb-3">
                <span>MERCADOPAGO_PUBLIC_KEY</span> 
                {process.env.MERCADOPAGO_PUBLIC_KEY ? <CheckCircle2 className="size-4 text-[#0d9488]" /> : <XCircle className="size-4 text-[#dc2626]" />}
              </li>
              <li className="flex justify-between border-b border-[#e5ecee] pb-3">
                <span>NEXT_PUBLIC_SITE_URL</span>
                <span className="text-[#12232b]">{process.env.NEXT_PUBLIC_SITE_URL || 'https://arxum.com.br'}</span>
              </li>
            </ul>
          </Panel>
        </div>
      </main>
    </AdminShell>
  )
}
