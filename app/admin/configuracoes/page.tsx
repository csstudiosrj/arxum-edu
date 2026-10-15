'use client'

import { School, Users, Palette, Bell, CreditCard, Shield, Globe, ChevronRight } from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'

const secoes = [
  { titulo: 'Dados da escola', descricao: 'Nome, CNPJ, endereço, contatos e logotipo', icon: School, cor: '#0d9488' },
  { titulo: 'Usuários e permissões', descricao: 'Equipe, papéis e controle de acesso', icon: Users, cor: '#3b82f6' },
  { titulo: 'Aparência e identidade', descricao: 'Cores, logo e personalização visual', icon: Palette, cor: '#7c3aed' },
  { titulo: 'Notificações', descricao: 'E-mail, WhatsApp e push para responsáveis', icon: Bell, cor: '#d97706' },
  { titulo: 'Financeiro e pagamentos', descricao: 'Pagar.me, PIX, boleto e régua de cobrança', icon: CreditCard, cor: '#065f46' },
  { titulo: 'Segurança e LGPD', descricao: 'Políticas, retenção e consentimentos', icon: Shield, cor: '#dc2626' },
  { titulo: 'Domínio e integrações', descricao: 'Domínio próprio, API e webhooks', icon: Globe, cor: '#0e7490' },
]

export default function ConfiguracoesPage() {
  return (
    <AdminShell mode="school" active="Configurações">
      <main className="px-5 py-8 lg:px-8">
        <SectionHeading
          eyebrow="Administração"
          title="Configurações"
          description="Gerencie todos os aspectos da sua escola no ARXUM Edu."
        />

        <Panel className="mt-8">
          <div className="divide-y divide-[#f0f4f5]">
            {secoes.map((s) => (
              <button
                key={s.titulo}
                className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-[#fafcfc]"
              >
                <div className="grid size-10 shrink-0 place-items-center rounded-lg" style={{ backgroundColor: `${s.cor}15`, color: s.cor }}>
                  <s.icon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-[#243942]">{s.titulo}</h3>
                  <p className="mt-0.5 text-xs text-[#82939a]">{s.descricao}</p>
                </div>
                <ChevronRight className="size-5 shrink-0 text-[#a0afb4]" />
              </button>
            ))}
          </div>
        </Panel>
      </main>
    </AdminShell>
  )
}