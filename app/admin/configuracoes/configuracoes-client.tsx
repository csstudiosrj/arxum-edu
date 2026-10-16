'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  School, Users, Palette, Bell, CreditCard, Shield, Globe,
  Save, Loader2, Check, ArrowRight, Sparkles, Wrench, Lock,
  type LucideIcon,
} from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import type { EscolaCompleta } from '@/lib/auth/escola-atual'
import { salvarDadosEscola, solicitarRecursoFuturo } from './actions'

// ── TIPOS DOS CARDS DO HUB ──────────────────────────────────────────

type CardAtivo = {
  tipo: 'ativo'
  titulo: string
  descricao: string
  href: string
  icon: LucideIcon
  cor: string
}

type CardDesenvolvimento = {
  tipo: 'dev'
  titulo: string
  descricao: string
  icon: LucideIcon
  cor: string
}

type CardEspera = {
  tipo: 'espera'
  titulo: string
  descricao: string
  motivo: string
  icon: LucideIcon
  cor: string
}

// ── DADOS DOS CARDS ─────────────────────────────────────────────────

const cardsAtivos: CardAtivo[] = [
  {
    tipo: 'ativo',
    titulo: 'Usuários e permissões',
    descricao: 'Convide a equipe interna, defina papéis (direção, coordenação, secretaria, financeiro) e controle o acesso por unidade.',
    href: '/admin/usuarios',
    icon: Users,
    cor: '#3b82f6',
  },
  {
    tipo: 'ativo',
    titulo: 'Aparência e identidade',
    descricao: 'Logo, cor primária, tema visual e ativação dos add-ons como Branding nos portais dos responsáveis e alunos.',
    href: '/admin/personalizacao',
    icon: Palette,
    cor: '#7c3aed',
  },
]

const cardsDesenvolvimento: CardDesenvolvimento[] = [
  {
    tipo: 'dev',
    titulo: 'Notificações',
    descricao: 'Régua de cobrança, lembretes automáticos, e-mail e WhatsApp para responsáveis. Primeira versão com e-mail já em desenho.',
    icon: Bell,
    cor: '#d97706',
  },
  {
    tipo: 'dev',
    titulo: 'Segurança e LGPD',
    descricao: 'Termos de consentimento, política de retenção, portal de portabilidade e exclusão de dados do titular.',
    icon: Shield,
    cor: '#dc2626',
  },
  {
    tipo: 'dev',
    titulo: 'Domínio e integrações',
    descricao: 'Domínio próprio por escola (ex: suaescola.com.br), API pública e webhooks para ERPs acadêmicos e LMS.',
    icon: Globe,
    cor: '#0e7490',
  },
]

const cardsEspera: CardEspera[] = [
  {
    tipo: 'espera',
    titulo: 'Financeiro e pagamentos',
    descricao: 'PIX, boleto, cartão e split automático direto no sistema. O checkout dos alunos e a loja virtual passam a gerar cobrança real.',
    motivo: 'Aguardando aprovação da conta no Pagar.me',
    icon: CreditCard,
    cor: '#065f46',
  },
]

// ── HELPERS DE MÁSCARA ──────────────────────────────────────────────

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

// ── COMPONENTE PRINCIPAL ────────────────────────────────────────────

export function ConfiguracoesClient({ escola }: { escola: EscolaCompleta | null }) {
  const router = useRouter()

  // Form "Dados da escola"
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

  // Estado dos "avisar quando pronto"
  const [avisados, setAvisados] = useState<Set<string>>(new Set())
  const [processandoAviso, setProcessandoAviso] = useState<string | null>(null)

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

  async function handleAvisar(titulo: string) {
    setProcessandoAviso(titulo)
    const r = await solicitarRecursoFuturo(titulo)
    setProcessandoAviso(null)
    if (!r.success) {
      alert(r.error || 'Erro ao registrar interesse.')
      return
    }
    setAvisados((prev) => new Set(prev).add(titulo))
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
          description="Gerencie os dados, a identidade e os recursos da sua escola em um só lugar."
        />

        {/* ── BLOCO 1: DADOS DA ESCOLA ────────────────────────────── */}

        <Panel className="mt-8">
          <div className="flex items-center justify-between border-b border-[#e5ecee] px-5 py-4">
            <div className="flex items-center gap-3">
              <div
                className="grid size-9 place-items-center rounded-lg"
                style={{ backgroundColor: 'color-mix(in srgb, var(--cor-primaria, #0d9488) 12%, transparent)', color: 'var(--cor-primaria, #0d9488)' }}
              >
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
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:brightness-90 disabled:opacity-50"
                style={{ backgroundColor: 'var(--cor-primaria, #0d9488)' }}
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
              <p className="mt-1 font-mono text-sm" style={{ color: 'var(--cor-primaria, #0d9488)' }}>
                edu.arxum.com.br/{escola.slug}
              </p>
            </div>

            {erro && (
              <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-600">
                {erro}
              </p>
            )}
          </div>
        </Panel>

        {/* ── BLOCO 2: RECURSOS ATIVOS ────────────────────────────── */}

        <section className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="size-4" style={{ color: 'var(--cor-primaria, #0d9488)' }} />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6b7d86]">
              Recursos ativos da sua escola
            </h3>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {cardsAtivos.map((c) => {
              const Icon = c.icon
              return (
                <Link
                  key={c.titulo}
                  href={c.href}
                  className="group flex items-start gap-4 rounded-xl border border-[#dce5e8] bg-white p-5 transition hover:shadow-md"
                  style={{ borderColor: '#dce5e8' }}
                >
                  <div
                    className="grid size-11 shrink-0 place-items-center rounded-lg"
                    style={{ backgroundColor: `${c.cor}15`, color: c.cor }}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-[#12232b]">{c.titulo}</h4>
                      <span className="rounded-full bg-[#d1fae5] px-2 py-0.5 text-[10px] font-bold text-[#065f46]">
                        Ativo
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs leading-5 text-[#82939a]">{c.descricao}</p>
                  </div>
                  <ArrowRight
                    className="mt-1 size-4 shrink-0 text-[#a0afb4] transition group-hover:translate-x-0.5"
                    style={{ color: 'var(--cor-primaria, #0d9488)' }}
                  />
                </Link>
              )
            })}
          </div>
        </section>

        {/* ── BLOCO 3: EM DESENVOLVIMENTO ─────────────────────────── */}

        <section className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <Wrench className="size-4 text-[#6b7d86]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6b7d86]">
              Em desenvolvimento
            </h3>
            <span className="ml-1 rounded-full bg-[#f0f4f5] px-2 py-0.5 text-[10px] font-bold text-[#82939a]">
              Roadmap ARXUM
            </span>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {cardsDesenvolvimento.map((c) => {
              const Icon = c.icon
              const jaAvisado = avisados.has(c.titulo)
              const processando = processandoAviso === c.titulo
              return (
                <Panel key={c.titulo} className="flex flex-col p-5">
                  <div
                    className="grid size-11 place-items-center rounded-lg"
                    style={{ backgroundColor: `${c.cor}15`, color: c.cor }}
                  >
                    <Icon className="size-5" />
                  </div>
                  <h4 className="mt-4 text-sm font-bold text-[#12232b]">{c.titulo}</h4>
                  <p className="mt-1.5 flex-1 text-xs leading-5 text-[#82939a]">{c.descricao}</p>
                  <button
                    onClick={() => handleAvisar(c.titulo)}
                    disabled={jaAvisado || processando}
                    className={`mt-4 inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:opacity-70 ${
                      jaAvisado
                        ? 'border-[#d1fae5] bg-[#d1fae5]/40 text-[#065f46]'
                        : 'border-[#b8c9ce] bg-white text-[#30454e] hover:border-[#0d9488] hover:text-[#0f766e]'
                    }`}
                  >
                    {processando ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : jaAvisado ? (
                      <Check className="size-3.5" />
                    ) : (
                      <Bell className="size-3.5" />
                    )}
                    {processando
                      ? 'Registrando...'
                      : jaAvisado
                        ? 'Avisaremos você'
                        : 'Avisar quando estiver pronto'}
                  </button>
                </Panel>
              )
            })}
          </div>
        </section>

        {/* ── BLOCO 4: AGUARDANDO APROVAÇÃO EXTERNA ───────────────── */}

        <section className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <Lock className="size-4 text-[#6b7d86]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6b7d86]">
              Aguardando liberação externa
            </h3>
          </div>
          {cardsEspera.map((c) => {
            const Icon = c.icon
            return (
              <Panel key={c.titulo} className="overflow-hidden">
                <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center">
                  <div
                    className="grid size-12 shrink-0 place-items-center rounded-lg"
                    style={{ backgroundColor: `${c.cor}15`, color: c.cor }}
                  >
                    <Icon className="size-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-[#12232b]">{c.titulo}</h4>
                    <p className="mt-1.5 text-xs leading-5 text-[#82939a]">{c.descricao}</p>
                  </div>
                  <div className="shrink-0 rounded-lg border border-[#fef3c7] bg-[#fef3c7]/40 px-4 py-2.5 lg:max-w-[220px]">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#92400e]">
                      Status
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[#92400e]">
                      {c.motivo}
                    </p>
                  </div>
                </div>
              </Panel>
            )
          })}
        </section>
      </main>
    </AdminShell>
  )
}