'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  AlertCircle, BarChart3, Bell, BookOpen, Building2, Calendar, ChevronDown, ChevronRight, 
  CircleDollarSign, Database, FileSignature, FileText, Globe, GraduationCap, 
  Headphones, HeartPulse, HelpCircle, Image as ImageIcon, Inbox, LayoutDashboard, LogOut, 
  Mail, Menu, Network, Palette, Plus, Search, Settings, ShieldCheck, SlidersHorizontal, 
  Sparkles, TrendingUp, UploadCloud, UserCog, Users, WalletCards, X 
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { ArxumBrand } from '@/components/arxum-brand'
import { SinoNotificacoesLoader } from '@/components/sino-notificacoes-loader'
import { SinoSuperAdmin } from '@/components/sino-super-admin'
import { createClient } from '@/lib/supabase/client'
import { getMarcaEscolaAtual } from '@/lib/auth/escola-atual'

type AdminMode = 'school' | 'super'

const COR_FALLBACK = '#0d9488'

const schoolMenuGroups = [
  {
    titulo: 'Gestão',
    items: [
      ['Visão geral', '/dashboard', LayoutDashboard],
      ['Relatórios', '/admin/relatorios', BarChart3],
      ['Financeiro', '/admin/financeiro', WalletCards],
      ['Loja', '/admin/loja', CircleDollarSign],
      ['Add-ons', '/admin/addons', Sparkles],
      ['Importação', '/admin/importacao', UploadCloud],
      ['Exportação', '/admin/exportacao', Database],
    ]
  },
  {
    titulo: 'Secretaria',
    items: [
      ['Matrículas', '/admin/matriculas', FileText],
      ['Alunos', '/admin/alunos', Users],
      ['Professores', '/admin/professores', GraduationCap],
      ['Usuários', '/admin/usuarios', UserCog],
      ['Unidades', '/admin/unidades', Network],
      ['Termos', '/admin/termos', FileSignature],
    ]
  },
  {
    titulo: 'Pedagógico',
    items: [
      ['Notas', '/admin/notas', TrendingUp],
      ['Ocorrências', '/admin/ocorrencias', AlertCircle],
      ['Recursos', '/admin/recursos', HeartPulse],
      ['Formulários', '/admin/formularios', SlidersHorizontal],
      ['Sala Virtual', '/admin/sala-virtual', BookOpen],
      ['EduFlix', '/admin/eduflix', BookOpen],
    ]
  },
  {
    titulo: 'Comunicação',
    items: [
      ['Mensagens', '/admin/mensagens', Inbox],
      ['Comunicação', '/admin/comunicacao', Bell],
      ['Agenda', '/admin/agenda', Calendar],
      ['Autorizações', '/admin/autorizacoes', ShieldCheck],
      ['Galeria', '/admin/galeria', ImageIcon],
    ]
  },
  {
    titulo: 'Site e Marca',
    items: [
      ['Site', '/admin/site', Globe],
      ['Personalização', '/admin/personalizacao', Palette],
    ]
  }
] as const

const superMenuGroups = [
  {
    titulo: 'Administração',
    items: [
      ['Visão geral', '/super-admin', LayoutDashboard], 
      ['Escolas', '/super-admin/escolas', Building2],
      ['Planos', '/super-admin/planos', WalletCards], 
      ['Add-ons', '/super-admin/addons', Palette],
      ['Financeiro', '/super-admin/financeiro', CircleDollarSign], 
      ['Monetização', '/super-admin/monetizacao', TrendingUp],
    ]
  },
  {
    titulo: 'Sistema',
    items: [
      ['Comunicação', '/super-admin/comunicacao', Mail],
      ['Suporte', '/super-admin/suporte', Headphones],
      ['Métricas', '/super-admin/metricas', BarChart3],
      ['Configurações', '/super-admin/sistema', Settings],
    ]
  }
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
  const [emailUsuario, setEmailUsuario] = useState('')
  const [corPrimaria, setCorPrimaria] = useState(COR_FALLBACK)
  const [nomeEscola, setNomeEscola] = useState('Carregando...')
  
  // Estado para o menu do avatar
  const [menuAberto, setMenuAberto] = useState(false)
  const avatarRef = useRef<HTMLDivElement>(null)

  // Estado para a sanfona do sidebar (inicia com o grupo do item ativo aberto)
  const menuGroups = mode === 'super' ? superMenuGroups : schoolMenuGroups
  const grupoAtivo = menuGroups.find(g => g.items.some(i => i[0] === active))?.titulo
  const [gruposAbertos, setGruposAbertos] = useState<string[]>(grupoAtivo ? [grupoAtivo] : ['Gestão'])

  const router = useRouter()

  // Bugfix do Dropdown: Fecha ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(event.target as Node)) {
        setMenuAberto(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

  useEffect(() => {
    let ativo = true
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!ativo || !data.user) return
      const meta = (data.user.user_metadata || {}) as Record<string, string>
      const nome = meta.nome || meta.full_name || meta.name || data.user.email?.split('@')[0] || 'Usuário'
      setNomeUsuario(nome)
      setEmailUsuario(data.user.email || '')
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

  function toggleGrupo(titulo: string) {
    setGruposAbertos(prev => 
      prev.includes(titulo) 
        ? prev.filter(t => t !== titulo) 
        : [...prev, titulo]
    )
  }

  const cssVars = { '--cor-primaria': corPrimaria } as React.CSSProperties
  const iniciais = nomeUsuario ? iniciaisDe(nomeUsuario) : '·'

  return <div className="min-h-screen bg-[#f6f8f9] text-[#17252d]" style={cssVars}>
    
    {/* SIDEBAR SANFONA */}
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-[#dce5e8] bg-white transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-[#e5ecee] px-5">
        <ArxumBrand light={true} />
        {mode === 'super' && <span className="rounded-md bg-[#ccfbf1] px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-[#0f766e]">Admin</span>}
        <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Fechar menu"><X /></button>
      </div>
      
      <div className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        {menuGroups.map((group) => {
          const isAberto = gruposAbertos.includes(group.titulo)
          return (
            <div key={group.titulo} className="mb-2">
              <button 
                onClick={() => toggleGrupo(group.titulo)}
                className="flex w-full items-center justify-between rounded-lg px-2 py-2 hover:bg-[#f1f5f6] transition"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#82939a]">{group.titulo}</span>
                {isAberto ? <ChevronDown size={14} className="text-[#82939a]" /> : <ChevronRight size={14} className="text-[#82939a]" />}
              </button>
              
              {isAberto && (
                <div className="mt-1 flex flex-col gap-0.5 animate-in slide-in-from-top-1 fade-in duration-200">
                  {group.items.map(([label, href, Icon]) => {
                    const ativo = active === label
                    return (
                      <Link 
                        key={label} 
                        href={href} 
                        onClick={() => setOpen(false)} 
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${ativo ? '' : 'text-[#6b7d86] hover:bg-[#f1f5f6] hover:text-[#17252d]'}`} 
                        style={ativo ? { backgroundColor: `${corPrimaria}1a`, color: corPrimaria } : undefined}
                      >
                        <Icon className="size-[18px]" />{label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </aside>

    {/* CONTEÚDO PRINCIPAL */}
    <div className="flex min-h-screen flex-col lg:pl-[248px]">
      
      {/* HEADER REFORMULADO */}
      <header className="sticky top-0 z-30 flex h-[72px] shrink-0 items-center justify-between border-b border-[#dce5e8] bg-white/90 px-5 backdrop-blur lg:px-8">
        
        {/* Lado Esquerdo: Menu Mobile e Breadcrumbs */}
        <div className="flex items-center gap-4">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir menu"><Menu /></button>
          <div className="hidden sm:flex items-center gap-2 text-sm">
            <span className="text-[#82939a]">{grupoAtivo}</span>
            <ChevronRight size={14} className="text-[#d5e0e3]" />
            <span className="font-semibold text-[#12232b]">{active}</span>
          </div>
          <div className="sm:hidden text-sm font-semibold text-[#12232b]">{active}</div>
        </div>
        
        {/* Centro: Busca Global e Ajuda */}
        {mode === 'school' && (
          <div className="hidden flex-1 items-center justify-center gap-3 px-8 md:flex">
            <div className="flex w-full max-w-md items-center gap-2 rounded-lg border border-[#d5e0e3] bg-[#f6f8f9] px-3 py-2 text-sm text-[#9aaab0] transition focus-within:border-[var(--cor-primaria)] focus-within:bg-white">
              <Search className="size-4" />
              <input type="text" placeholder="Buscar aluno, fatura..." className="w-full bg-transparent outline-none placeholder:text-[#a0afb4]" />
            </div>
            <Link href="/admin/ajuda" title="Central de Ajuda" className="grid size-9 shrink-0 place-items-center rounded-lg border border-[#d5e0e3] bg-white text-[#6b7d86] transition hover:text-[var(--cor-primaria)] hover:border-[var(--cor-primaria)]">
              <HelpCircle size={18} />
            </Link>
          </div>
        )}

        {/* Lado Direito: Ações, Sino e Avatar */}
        <div className="flex items-center gap-3 sm:gap-4">
          {mode === 'school' && (
            <Link href="/admin/matriculas" className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-[var(--cor-primaria)] px-3 py-2 text-xs font-semibold text-white hover:brightness-90 transition">
              <Plus className="size-3.5" /> Nova Matrícula
            </Link>
          )}

          {mode === 'school' ? <SinoNotificacoesLoader papel="admin" /> : <SinoSuperAdmin />}
          
          {/* MENU DO AVATAR COM REF */}
          <div className="relative" ref={avatarRef}>
            <button
              onClick={() => setMenuAberto(!menuAberto)}
              className="grid size-9 place-items-center rounded-full text-xs font-bold text-white transition-all hover:brightness-110"
              style={{ backgroundColor: 'var(--cor-primaria, #0d9488)' }}
            >
              {iniciais}
            </button>
            
            {menuAberto && (
              <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-[#dce5e8] bg-white p-2 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="border-b border-[#edf1f2] px-3 py-3 mb-1">
                  <p className="truncate text-sm font-bold text-[#12232b]">{nomeUsuario}</p>
                  <p className="truncate text-xs text-[#82939a]">{emailUsuario}</p>
                </div>
                
                {mode === 'school' && (
                  <>
                    <Link href="/admin/configuracoes" onClick={() => setMenuAberto(false)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#536871] hover:bg-[#f1f5f6] transition">
                      <Settings className="size-4" /> Configurações
                    </Link>
                    <Link href="/admin/suporte" onClick={() => setMenuAberto(false)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#536871] hover:bg-[#f1f5f6] transition">
                      <Headphones className="size-4" /> Suporte ARXUM
                    </Link>
                  </>
                )}
                
                <div className="my-1 border-t border-[#edf1f2]" />
                
                <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#dc2626] hover:bg-[#fee2e2] transition">
                  <LogOut className="size-4" /> Sair da conta
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* CONTEÚDO DA PÁGINA */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  </div>
}

export function SectionHeading({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  return (
    <div>
      {eyebrow && <p className="text-xs font-bold uppercase tracking-[.18em]" style={{ color: 'var(--cor-primaria, #0d9488)' }}>{eyebrow}</p>}
      <h1 className="mt-2 text-3xl font-bold tracking-[-.03em] text-[#12232b]">{title}</h1>
      {description && <p className="mt-2 text-sm text-[#71838b]">{description}</p>}
    </div>
  )
}

export const Panel = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <section className={`rounded-xl border border-[#dce5e8] bg-white ${className}`}>{children}</section>
)

export function ActionButton({ children, variant = 'primary' }: { children: React.ReactNode; variant?: 'primary' | 'secondary' | 'ghost' }) {
  if (variant === 'primary') return <button className="rounded-lg px-3.5 py-2 text-sm font-semibold text-white transition hover:brightness-90" style={{ backgroundColor: 'var(--cor-primaria, #0d9488)' }}>{children}</button>
  if (variant === 'secondary') return <button className="rounded-lg border border-[#b8c9ce] bg-white px-3.5 py-2 text-sm font-semibold text-[#30454e] transition hover:border-[var(--cor-primaria,#0d9488)]">{children}</button>
  return <button className="rounded-lg px-3.5 py-2 text-sm font-semibold text-[#60737c] transition hover:bg-[#f1f5f6]">{children}</button>
}

export const FieldLabel = ({ children }: { children: React.ReactNode }) => <label className="mb-1.5 block text-xs font-semibold text-[#536871]">{children}</label>

const input = 'w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[var(--cor-primaria,#0d9488)]'

export function TextInput({ value, placeholder }: { value?: string; placeholder?: string }) { return <input className={input} defaultValue={value} placeholder={placeholder} /> }
export function TextArea({ value, placeholder }: { value?: string; placeholder?: string }) { return <textarea className={`${input} min-h-20 resize-none`} defaultValue={value} placeholder={placeholder} /> }
export { input }

export function SearchBox() {
  return <div className="hidden w-64 items-center gap-2 rounded-lg border border-[#d5e0e3] px-3 py-2 text-sm text-[#9aaab0] md:flex"><span>⌕</span> Buscar...</div>
}

export function TrendChart() {
  return (
    <svg viewBox="0 0 280 90" className="mt-3 h-20 w-full" role="img" aria-label="Tendência">
      <path d="M2 70 C30 58 34 65 55 54 S87 52 105 60 S132 43 150 48 S177 24 195 31 S225 18 246 28 S270 10 278 15" fill="none" stroke="var(--cor-primaria, #0d9488)" strokeWidth="3" strokeLinecap="round"/>
      <path d="M2 70 C30 58 34 65 55 54 S87 52 105 60 S132 43 150 48 S177 24 195 31 S225 18 246 28 S270 10 278 15 V90 H2Z" fill="var(--cor-primaria, #0d9488)" opacity=".08" />
    </svg>
  )
}

export function AvatarInitial({ text }: { text: string }) {
  return <div className="grid size-8 shrink-0 place-items-center rounded-full bg-[#dcecf0] text-[10px] font-bold text-[#236176]">{text}</div>
}