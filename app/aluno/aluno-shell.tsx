'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BookOpen, Calendar, Home, LogOut, Menu, MessageSquare,
  PlayCircle, TrendingUp, Video, X, type LucideIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { ArxumBrand, ByArxum } from '@/components/arxum-brand'
import { SinoNotificacoesLoader } from '@/components/sino-notificacoes-loader'
import { createClient } from '@/lib/supabase/client'
import type { MarcaEscola } from '@/lib/auth/marca'

type MenuItem = readonly [string, string, LucideIcon]

const menu: MenuItem[] = [
  ['Início', '/aluno', Home],
  ['Boletim', '/aluno/boletim', TrendingUp],
  ['Aulas', '/aluno/aulas', Video],
  ['EduFlix', '/aluno/eduflix', PlayCircle],
  ['Agenda', '/aluno/agenda', Calendar],
  ['Comunicados', '/aluno/comunicados', MessageSquare],
]

export function AlunoShell({
  children,
  alunoNome,
  alunoSerie,
  escolaNome,
  escolaSlug,
  marca,
}: {
  children: React.ReactNode
  alunoNome: string
  alunoSerie: string
  escolaNome: string
  escolaSlug: string
  marca: MarcaEscola | null
}) {
  const [open, setOpen] = useState(false)
  const [saindo, setSaindo] = useState(false)
  const [menuAberto, setMenuAberto] = useState(false)
  const [emailUsuario, setEmailUsuario] = useState('')
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    let ativo = true
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!ativo || !data.user) return
      setEmailUsuario(data.user.email || '')
    })
    return () => { ativo = false }
  }, [])

  async function handleLogout() {
    setSaindo(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function isAtivo(href: string): boolean {
    if (href === '/aluno') return pathname === '/aluno'
    return pathname.startsWith(href)
  }

  const iniciais = alunoNome.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()
  const temBranding = marca?.usaBranding && marca.logoUrl

  return (
    <div className="min-h-screen bg-[#f6f8f9] text-[#17252d]">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-[#dce5e8] bg-white px-4 py-5 transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-2">
          {temBranding ? (
            <img src={marca!.logoUrl!} alt={marca!.nome} className="h-9 w-auto max-w-[180px] object-contain" />
          ) : (
            <ArxumBrand light={true} />
          )}
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Fechar menu"><X /></button>
        </div>

        <div className="mt-6 rounded-xl border border-[#e5ecee] bg-[#fafcfc] p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#82939a]">Portal do aluno</p>
          <p className="mt-1.5 truncate text-sm font-semibold text-[#243942]">{alunoNome}</p>
          <p className="mt-0.5 truncate text-xs text-[#82939a]">{alunoSerie} · {escolaNome}</p>
        </div>

        <div className="mt-6 flex flex-1 flex-col gap-1 overflow-y-auto">
          {menu.map(([label, href, Icon]) => (
            <Link
              key={label}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isAtivo(href) ? 'bg-[#ccfbf1] text-[#0f766e]' : 'text-[#6b7d86] hover:bg-[#f1f5f6] hover:text-[#17252d]'
              }`}
            >
              <Icon className="size-[18px]" />
              {label}
            </Link>
          ))}
        </div>

        <div className="border-t border-[#e5ecee] pt-4">
          <Link
            href={`/edu/${escolaSlug}`}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#82939a] hover:bg-[#f1f5f6] hover:text-[#17252d]"
          >
            <BookOpen className="size-[18px]" /> Site da escola
          </Link>
          <button
            onClick={handleLogout}
            disabled={saindo}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#82939a] hover:bg-[#f1f5f6] disabled:opacity-50"
          >
            <LogOut className="size-[18px]" />
            {saindo ? 'Saindo...' : 'Sair'}
          </button>
          <div className="mt-3 flex justify-center">
            <ByArxum light />
          </div>
        </div>
      </aside>

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-[#dce5e8] bg-white/90 px-5 backdrop-blur lg:px-8">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir menu"><Menu /></button>
          <div className="hidden text-sm font-semibold text-[#6b7d86] sm:block">{escolaNome}</div>
          <div className="ml-auto flex items-center gap-4">
            <SinoNotificacoesLoader papel="aluno" />

            {/* Avatar clicável com dropdown */}
            <div className="relative">
              <button
                onClick={() => setMenuAberto(!menuAberto)}
                className="grid size-9 place-items-center rounded-full bg-[#0d9488] text-xs font-bold text-white hover:ring-2 hover:ring-[#0d9488] hover:ring-offset-2 transition-all"
                aria-label="Menu da conta"
              >
                {iniciais}
              </button>
              {menuAberto && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setMenuAberto(false)} />
                  <div className="absolute right-0 top-full z-40 mt-2 w-56 rounded-xl border border-[#dce5e8] bg-white p-2 shadow-xl">
                    <div className="border-b border-[#edf1f2] px-3 py-2 mb-1">
                      <p className="truncate text-sm font-bold text-[#12232b]">{alunoNome}</p>
                      {emailUsuario && (
                        <p className="truncate text-xs text-[#82939a]">{emailUsuario}</p>
                      )}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#dc2626] hover:bg-[#fee2e2] transition"
                    >
                      <LogOut className="size-4" /> Sair da conta
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  )
}