'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  AlertCircle, BookOpen, Home, LogOut, Menu, TrendingUp, Users, X, type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { ArxumBrand } from '@/components/arxum-brand'
import { createClient } from '@/lib/supabase/client'

type MenuItem = readonly [string, string, LucideIcon]

const menu: MenuItem[] = [
  ['Início', '/professor', Home],
  ['Lançar notas', '/professor/notas', TrendingUp],
  ['Ocorrências', '/professor/ocorrencias', AlertCircle],
  ['Alunos', '/professor/alunos', Users],
]

export function ProfessorShell({
  children,
  professorNome,
  professorDisciplinas,
  escolaNome,
  escolaSlug,
}: {
  children: React.ReactNode
  professorNome: string
  professorDisciplinas: string[]
  escolaNome: string
  escolaSlug: string
}) {
  const [open, setOpen] = useState(false)
  const [saindo, setSaindo] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    setSaindo(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function isAtivo(href: string): boolean {
    if (href === '/professor') return pathname === '/professor'
    return pathname.startsWith(href)
  }

  const iniciais = professorNome.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()

  return (
    <div className="min-h-screen bg-[#f6f8f9] text-[#17252d]">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-[#dce5e8] bg-white px-4 py-5 transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-2">
          <ArxumBrand light={true} />
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Fechar menu"><X /></button>
        </div>

        <div className="mt-6 rounded-xl border border-[#e5ecee] bg-[#fafcfc] p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#82939a]">Portal do professor</p>
          <p className="mt-1.5 truncate text-sm font-semibold text-[#243942]">{professorNome}</p>
          {professorDisciplinas.length > 0 && (
            <p className="mt-0.5 truncate text-xs text-[#82939a]">{professorDisciplinas.slice(0, 2).join(' · ')}</p>
          )}
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
        </div>
      </aside>

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-[#dce5e8] bg-white/90 px-5 backdrop-blur lg:px-8">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir menu"><Menu /></button>
          <div className="hidden text-sm font-semibold text-[#6b7d86] sm:block">{escolaNome}</div>
          <div className="ml-auto flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-full bg-[#0d9488] text-xs font-bold text-white">
              {iniciais}
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  )
}