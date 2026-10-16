'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { School, Users, Palette, Bell, CreditCard, Shield, Globe, ChevronRight, Save, Loader2, Check } from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import type { EscolaCompleta } from '@/lib/auth/escola-atual'
import { salvarDadosEscola } from './actions'

const secoesExtras = [
  { titulo: 'Usuários e permissões', descricao: 'Equipe, papéis e controle de acesso', icon: Users, cor: '#3b82f6' },
  { titulo: 'Aparência e identidade', descricao: 'Cores, logo e personalização visual', icon: Palette, cor: '#7c3aed' },
  { titulo: 'Notificações', descricao: 'E-mail, WhatsApp e push para responsáveis', icon: Bell, cor: '#d97706' },
  { titulo: 'Financeiro e pagamentos', descricao: 'Pagar.me, PIX, boleto e régua de cobrança', icon: CreditCard, cor: '#065f46' },
  { titulo: 'Segurança e LGPD', descricao: 'Políticas, retenção e consentimentos', icon: Shield, cor: '#dc2626' },
  { titulo: 'Domínio e integrações', descricao: 'Domínio próprio, API e webhooks', icon: Globe, cor: '#0e7490' },
]

function formatarCNPJ(v: string): string {
  const n = v.replace(/\D/g, '').slice(0, 14)
  if (n.length <= 2) return n
  if (n.length <= 5) return `${n.slice(0, 2)}.${n.slice(2)}`
  if (n.length <= 8) return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5)}`
  if (n.length <= 12) return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8)}`
  return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8, 12)}-${n.slice(12)}`
}

function formatarTelefone(v: string): string {
  const n = v.replace(/\D/g, '').slice(0, 11)
  if (n.length <= 2) return n
  if (n.length <= 6) return `(${n.slice(0, 2)}) ${n.slice(2)}`
  if (n.length <= 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`
}

export function ConfiguracoesClient({ escola }: { escola: EscolaCompleta | null }) {
  const router = useRouter()
  const [nome, setNome] = useState(escola?.nome || '')
  const [cnpj, setCnpj] = useState(escola?.cnpj || '')
  const [endereco, setEndereco] = useState(escola?.endereco || '')
  const [cidade, setCidade] = useState(escola?.cidade || '')
  const [estado, setEstado] = useState(escola?.estado || '')
  const [telefone, setTelefone] = useState(escola?.telefone || '')
  const [emailContato, setEmailContato] = useState(escola?.email_contato || '')
  const [site, setSite] = useState(escola?.site || '')
  const [salvando, setSalvando] = useState(false)
  const [salvou, setSalvou] = useState(false)
  const [erro, setErro] = useState('')

  async function handleSalvar() {
    if (!nome.trim()) {
      setErro('O nome da escola é obrigatório.')
      return
    }
    setSalvando(true)
    setErro('')
    setSalvou(false)

    const result = await salvarDadosEscola({
      nome,
      cnpj,
      endereco,
      cidade,
      estado,
      telefone,
      email_contato: emailContato,
      site,
    })

    setSalvando(false)

    if (!result.success) {
      setErro(result.error || 'Erro ao salvar.')
      return
    }

    setSalvou(true)
    router.refresh()
    setTimeout(() => setSalvou(false), 2500)
  }

  if (!escola) {
    return (
      <AdminShell mode="school" active="Configurações">
        <main className="px-5 py-8 lg:px-8">
          <SectionHeading eyebrow="Administração" title="Configurações" />
          <div className="mt-8 rounded-xl border border-[#dce5e8] bg-white p-8 text-center">
            <p className="text-sm text-[#82939a]">Escola não encontrada.</p>
          </div>
        </main>
      </AdminShell>
    )
  }

  return (
    <AdminShell mode="school" active="Configurações">
      <main className="px-5 py-8 lg:px-8">
        <SectionHeading
          eyebrow="Administração"
          title="Configurações"
          description="Gerencie os dados e a identidade da sua escola."
        />

        <Panel className="mt-8">
          <div className="flex items-center justify-between border-b border-[#e5ecee] px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-lg bg-[#ccfbf1] text-[#0d9488]">
                <School className="size-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#12232b]">Dados da escola</h2>
                <p className="text-xs text-[#82939a]">Essas informações aparecem em todo o sistema</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {salvou && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-[#d1fae5] px-3 py-1.5 text-xs font-semibold text-[#065f46]">
                  <Check className="size-3.5" /> Salvo
                </span>
              )}
              <button
                onClick={handleSalvar}
                disabled={salvando}
                className="inline-flex items-center gap-2 rounded-lg bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0f766e] disabled:opacity-50"
              >
                {salvando ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                {salvando ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </div>

          <div className="space-y-5 p-5 lg:p-6">
            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Nome da escola *</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none focus:border-[#0d9488]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#536871]">CNPJ</label>
                <input
                  type="text"
                  value={cnpj}
                  onChange={(e) => setCnpj(formatarCNPJ(e.target.value))}
                  placeholder="00.000.000/0000-00"
                  className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Endereço completo</label>
              <input
                type="text"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                placeholder="Rua, número, bairro"
                className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]"
              />
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Cidade</label>
                <input
                  type="text"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none focus:border-[#0d9488]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Estado</label>
                <input
                  type="text"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  maxLength={2}
                  placeholder="RJ"
                  className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Telefone</label>
                <input
                  type="text"
                  value={telefone}
                  onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                  placeholder="(21) 90000-0000"
                  className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]"
                />
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#536871]">E-mail de contato</label>
                <input
                  type="email"
                  value={emailContato}
                  onChange={(e) => setEmailContato(e.target.value)}
                  placeholder="contato@escola.com.br"
                  className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Site</label>
                <input
                  type="url"
                  value={site}
                  onChange={(e) => setSite(e.target.value)}
                  placeholder="https://escola.com.br"
                  className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]"
                />
              </div>
            </div>

            <div className="rounded-lg border border-[#e5ecee] bg-[#fafcfc] p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#82939a]">Endereço público da escola</p>
              <p className="mt-1 font-mono text-sm text-[#0d9488]">edu.arxum.com.br/{escola.slug}</p>
            </div>

            {erro && (
              <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-600">
                {erro}
              </p>
            )}
          </div>
        </Panel>

        <div className="mt-6">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#6b7d86]">Em breve</h3>
          <Panel>
            <div className="divide-y divide-[#f0f4f5]">
              {secoesExtras.map((s) => (
                <div
                  key={s.titulo}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left opacity-60"
                >
                  <div className="grid size-10 shrink-0 place-items-center rounded-lg" style={{ backgroundColor: `${s.cor}15`, color: s.cor }}>
                    <s.icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-[#243942]">{s.titulo}</h3>
                    <p className="mt-0.5 text-xs text-[#82939a]">{s.descricao}</p>
                  </div>
                  <span className="rounded-full bg-[#f0f4f5] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#82939a]">Em breve</span>
                  <ChevronRight className="size-5 shrink-0 text-[#a0afb4]" />
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </main>
    </AdminShell>
  )
}