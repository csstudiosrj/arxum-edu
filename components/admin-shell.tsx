'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, BarChart3, Bell, BookOpen, Building2, Calendar, ChevronDown, CircleDollarSign, Database, FileText, Globe, GraduationCap, Headphones, Image as ImageIcon, Inbox, LayoutDashboard, LogOut, Menu, Network, Palette, Settings, ShieldCheck, SlidersHorizontal, TrendingUp, UserCog, Users, WalletCards, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ArxumBrand } from '@/components/arxum-brand'
import { SinoNotificacoesLoader } from '@/components/sino-notificacoes-loader'
import { createClient } from '@/lib/supabase/client'
import { getMarcaEscolaAtual } from '@/lib/auth/escola-atual'

type AdminMode = 'school' | 'super'

const COR_FALLBACK = '#0d9488'

const schoolItems = [
  ['Visão geral', '/dashboard', LayoutDashboard],
  ['Relatórios', '/admin/relatorios', BarChart3],
  ['Site', '/admin/site', Globe],
  ['Personalização', '/admin/personalizacao', Palette],
  ['Unidades', '/admin/unidades', Network],
  ['Usuários', '/admin/usuarios', UserCog],
  ['Matrículas', '/admin/matriculas', FileText],
  ['Formulários', '/admin/formularios', SlidersHorizontal],
  ['Alunos', '/admin/alunos', Users],
  ['Professores', '/admin/professores', GraduationCap],
  ['Notas', '/admin/notas', TrendingUp],
  ['Ocorrências', '/admin/ocorrencias', AlertCircle],
  ['Financeiro', '/admin/financeiro', WalletCards],
  ['Comunicação', '/admin/comunicacao', Bell],
  ['Mensagens', '/admin/mensagens', Inbox],
  ['Agenda', '/admin/agenda', Calendar],
  ['Autorizações', '/admin/autorizacoes', ShieldCheck],
  ['Galeria', '/admin/galeria', ImageIcon],
  ['EduFlix', '/admin/eduflix', BookOpen],
  ['Sala virtual', '/admin/sala-virtual', BookOpen],
  ['Loja', '/admin/loja', CircleDollarSign],
  ['Exportação', '/admin/exportacao', Database],
  ['Configurações', '/admin/configuracoes', Settings],
] as const

const superItems = [
  ['Visão geral', '/super-admin', LayoutDashboard],
  ['Escolas', '/super-admin/escolas', Building2],
  ['Planos', '/super-admin/planos', WalletCards],
  ['Add-ons', '/super-admin/addons', Palette],
  ['Faturamento', '/super-admin/faturamento', CircleDollarSign],
  ['Suporte', '/super-admin/suporte', Headphones],
  ['Métricas', '/super-admin/metricas', BarChart3],
  // TODO: 'Configurações' volta quando a página for implementada.
] as const

function iniciaisDe(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return 'AR'
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

export function AdminShell({ children, mode = 'school', active = 'Visão geral' }: { children: React.ReactNode; mode?: AdminMode; active?: string }) {
  const [open, setOpen] = useState(false)
  const [saindo, setSaindo] = useState(false)
  const [nomeUsuario, setNomeUsuario] = useState('')
  const [papelUsuario, setPapelUsuario] = useState('')
  const [corPrimaria, setCorPrimaria] = useState(COR_FALLBACK)
  const [nomeEscola, setNomeEscola] = useState('Carregando...')
  const router = useRouter()
  const items = mode === 'super' ? superItems : schoolItems

  // Nome da escola + cor primária
  useEffect(() => {
    if (mode === 'super') {
      setNomeEscola('Painel ARXUM')
      setCorPrimaria(COR_FALLBACK)
      return
    }
    let ativo = true
    getMarcaEscolaAtual().then((m) => {
      if (!ativo) return
      setNomeEscola(m.nome)
      setCorPrimaria(m.corPrimaria || COR_FALLBACK)
    })
    return () => { ativo = false }
  }, [mode])

  // Usuário logado
  useEffect(() => {
    let ativo = true
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!ativo || !data.user) return
      const meta = (data.user.user_metadata || {}) as Record<string, string>
      const nome = meta.nome || meta.full_name || meta.name || data.user.email?.split('@')[0] || 'Usuário'
      setNomeUsuario(nome)
      setPapelUsuario(mode === 'super' ? 'Super admin' : (meta.cargo || 'Administrador(a)'))
    })
    return () => { ativo = false }
  }, [mode])

  async function handleLogout() {
    setSaindo(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const cssVars = { '--cor-primaria': corPrimaria } as React.CSSProperties
  const iniciais = nomeUsuario ? iniciaisDe(nomeUsuario) : '·'

  return <div className="min-h-screen bg-[#f6f8f9] text-[#17252d]" style={cssVars}>
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-[#dce5e8] bg-white px-4 py-5 transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between px-2">
        <ArxumBrand light={true} />
        {mode === 'super' && <span className="rounded-md bg-[#ccfbf1] px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-[#0f766e]">Admin</span>}
        <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Fechar menu"><X /></button>
      </div>
      <div className="mt-8 flex flex-1 flex-col gap-1 overflow-y-auto">
        {items.map(([label, href, Icon]) => {
          const ativo = active === label
          return (
            <Link
              key={label}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                ativo ? '' : 'text-[#6b7d86] hover:bg-[#f1f5f6] hover:text-[#17252d]'
              }`}
              style={ativo ? { backgroundColor: `${corPrimaria}1a`, color: corPrimaria } : undefined}
            >
              <Icon className="size-[18px]" />
              {label}
            </Link>
          )
        })}
      </div>
      <div className="border-t border-[#e5ecee] pt-4">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="grid size-8 place-items-center rounded-full bg-[#173f5f] text-xs font-bold text-white">
            {iniciais}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{nomeUsuario || 'Carregando...'}</p>
            <p className="truncate text-xs text-[#82939a]">
              {papelUsuario || (mode === 'super' ? 'Super admin' : 'Administrador(a)')}
            </p>
          </div>
          <ChevronDown className="size-4 text-[#8da0a8]" />
        </div>
        <button onClick={handleLogout} disabled={saindo} className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#82939a] hover:bg-[#f1f5f6] disabled:opacity-50">
          <LogOut className="size-[18px]" />
          {saindo ? 'Saindo...' : 'Sair'}
        </button>
      </div>
    </aside>
    <div className="lg:pl-[248px]">
      <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-[#dce5e8] bg-white/90 px-5 backdrop-blur lg:px-8">
        <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir menu"><Menu /></button>
        <div className="hidden text-sm font-semibold text-[#6b7d86] sm:block">{nomeEscola}</div>
        <div className="ml-auto flex items-center gap-4">
          {mode === 'school'
            ? <SinoNotificacoesLoader papel="admin" />
            : <div className="p-2"><Bell className="size-[19px] text-[#71838b]" /></div>}
          <div className="grid size-9 place-items-center rounded-full bg-[#173f5f] text-xs font-bold text-white">
            {iniciais}
          </div>
        </div>
      </header>
      {children}
    </div>
  </div>
}

export function SectionHeading({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  return (
    <div>
      {eyebrow && (
        <p
          className="text-xs font-bold uppercase tracking-[.18em]"
          style={{ color: 'var(--cor-primaria, #0d9488)' }}
        >
          {eyebrow}
        </p>
      )}
      <h1 className="mt-2 text-3xl font-bold tracking-[-.03em] text-[#12232b]">{title}</h1>
      {description && <p className="mt-2 text-sm text-[#71838b]">{description}</p>}
    </div>
  )
}

export const Panel = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <section className={`rounded-xl border border-[#dce5e8] bg-white ${className}`}>{children}</section>
)

export function ActionButton({ children, variant = 'primary' }: { children: React.ReactNode; variant?: 'primary' | 'secondary' | 'ghost' }) {
  if (variant === 'primary') {
    return (
      <button
        className="rounded-lg px-3.5 py-2 text-sm font-semibold text-white transition hover:brightness-90"
        style={{ backgroundColor: 'var(--cor-primaria, #0d9488)' }}
      >
        {children}
      </button>
    )
  }
  if (variant === 'secondary') {
    return (
      <button
        className="rounded-lg border border-[#b8c9ce] bg-white px-3.5 py-2 text-sm font-semibold text-[#30454e] transition hover:border-[#0d9488] hover:text-[#0f766e]"
      >
        {children}
      </button>
    )
  }
  return (
    <button className="rounded-lg px-3.5 py-2 text-sm font-semibold text-[#60737c] transition hover:bg-[#f1f5f6]">
      {children}
    </button>
  )
}

export const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">{children}</label>
)

const input = 'w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/10'

export function TextInput({ value, placeholder }: { value?: string; placeholder?: string }) {
  return <input className={input} defaultValue={value} placeholder={placeholder} />
}
export function TextArea({ value, placeholder }: { value?: string; placeholder?: string }) {
  return <textarea className={`${input} min-h-20 resize-none`} defaultValue={value} placeholder={placeholder} />
}
export { input }

export function SearchBox() {
  return (
    <div className="hidden w-64 items-center gap-2 rounded-lg border border-[#d5e0e3] px-3 py-2 text-sm text-[#9aaab0] md:flex">
      <span>⌕</span> Buscar...
    </div>
  )
}

export function TrendChart() {
  return (
    <svg viewBox="0 0 280 90" className="mt-3 h-20 w-full" role="img" aria-label="Tendência">
      <path
        d="M2 70 C30 58 34 65 55 54 S87 52 105 60 S132 43 150 48 S177 24 195 31 S225 18 246 28 S270 10 278 15"
        fill="none"
        stroke="var(--cor-primaria, #0d9488)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M2 70 C30 58 34 65 55 54 S87 52 105 60 S132 43 150 48 S177 24 195 31 S225 18 246 28 S270 10 278 15 V90 H2Z"
        fill="var(--cor-primaria, #0d9488)"
        opacity=".08"
      />
    </svg>
  )
}

export function AvatarInitial({ text }: { text: string }) {
  return <div className="grid size-8 shrink-0 place-items-center rounded-full bg-[#dcecf0] text-[10px] font-bold text-[#236176]">{text}</div>
}