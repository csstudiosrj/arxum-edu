'use client'

import Link from 'next/link'
import { AlertCircle, ArrowRight, BookOpen, TrendingUp, Users } from 'lucide-react'
import type { AlunoResumo, NotaProfessor } from './actions'

const periodosLabel: Record<string, string> = {
  '1_bimestre': '1º Bim', '2_bimestre': '2º Bim', '3_bimestre': '3º Bim', '4_bimestre': '4º Bim',
  '1_semestre': '1º Sem', '2_semestre': '2º Sem',
}

function corNota(nota: number | null): string {
  if (nota === null) return 'text-[#82939a]'
  if (nota >= 7) return 'text-[#065f46]'
  if (nota >= 5) return 'text-[#92400e]'
  return 'text-[#991b1b]'
}

export function ProfessorDashboard({
  professorNome,
  disciplinas,
  totalAlunos,
  totalNotas,
  minhasOcorrencias,
  notasRecentes,
  alunosRecentes,
}: {
  professorNome: string
  disciplinas: string[]
  totalAlunos: number
  totalNotas: number
  minhasOcorrencias: number
  notasRecentes: NotaProfessor[]
  alunosRecentes: AlunoResumo[]
}) {
  return (
    <main className="px-5 py-8 lg:px-8">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[.18em]" style={{ color: 'var(--cor-primaria, #0d9488)' }}>Olá, {professorNome.split(' ')[0]}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-.03em] text-[#12232b]">Painel do professor</h1>
        <p className="mt-2 text-sm text-[#71838b]">
          {disciplinas.length > 0
            ? `Você leciona ${disciplinas.slice(0, 3).join(', ')}${disciplinas.length > 3 ? ` e mais ${disciplinas.length - 3}` : ''}.`
            : 'Bem-vindo ao seu painel.'}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[#dce5e8] bg-white p-5">
          <div
            className="grid size-10 place-items-center rounded-lg"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--cor-primaria, #0d9488) 15%, white)',
              color: 'var(--cor-primaria, #0d9488)',
            }}
          >
            <Users className="size-5" />
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Alunos</p>
          <p className="mt-1 text-3xl font-bold tracking-[-.03em]" style={{ color: 'var(--cor-primaria, #0d9488)' }}>{totalAlunos}</p>
          <p className="mt-1 text-xs text-[#82939a]">na escola</p>
        </div>
        <div className="rounded-xl border border-[#dce5e8] bg-white p-5">
          <div className="grid size-10 place-items-center rounded-lg bg-[#dbeafe] text-[#3b82f6]"><TrendingUp className="size-5" /></div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Notas lançadas</p>
          <p className="mt-1 text-3xl font-bold tracking-[-.03em] text-[#3b82f6]">{totalNotas}</p>
          <p className="mt-1 text-xs text-[#82939a]">na escola</p>
        </div>
        <div className="rounded-xl border border-[#dce5e8] bg-white p-5">
          <div className="grid size-10 place-items-center rounded-lg bg-[#fee2e2] text-[#dc2626]"><AlertCircle className="size-5" /></div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Minhas ocorrências</p>
          <p className="mt-1 text-3xl font-bold tracking-[-.03em] text-[#dc2626]">{minhasOcorrencias}</p>
          <p className="mt-1 text-xs text-[#82939a]">registradas</p>
        </div>
        <div className="rounded-xl border border-[#dce5e8] bg-white p-5">
          <div className="grid size-10 place-items-center rounded-lg bg-[#ede9fe] text-[#5b21b6]"><BookOpen className="size-5" /></div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Disciplinas</p>
          <p className="mt-1 text-3xl font-bold tracking-[-.03em] text-[#5b21b6]">{disciplinas.length}</p>
          <p className="mt-1 text-xs text-[#82939a]">lecionadas</p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-4">
        {[
          { label: 'Lançar notas', href: '/professor/notas', icon: TrendingUp },
          { label: 'Registrar ocorrência', href: '/professor/ocorrencias', icon: AlertCircle },
          { label: 'Ver alunos', href: '/professor/alunos', icon: Users },
          { label: 'Disciplinas', href: '/professor/notas', icon: BookOpen },
        ].map((a) => (
          <Link
            key={a.label}
            href={a.href}
            className="group flex items-center gap-3 rounded-xl border border-[#dce5e8] bg-white px-4 py-3.5 transition hover:border-[var(--cor-primaria,#0d9488)] hover:bg-black/[0.02]"
          >
            <div
              className="grid size-9 place-items-center rounded-lg"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--cor-primaria, #0d9488) 15%, white)',
                color: 'var(--cor-primaria, #0d9488)',
              }}
            >
              <a.icon className="size-[18px]" />
            </div>
            <span className="flex-1 text-sm font-semibold text-[#30454e] transition">{a.label}</span>
            <ArrowRight className="size-4 text-[#a0afb4] transition group-hover:text-[var(--cor-primaria,#0d9488)]" />
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-[#dce5e8] bg-white">
          <div className="flex items-center justify-between border-b border-[#e5ecee] px-5 py-4">
            <h2 className="text-base font-bold text-[#12232b]">Notas recentes</h2>
            <Link href="/professor/notas" className="text-sm font-medium transition hover:brightness-90" style={{ color: 'var(--cor-primaria, #0d9488)' }}>
              Ver todas <ArrowRight className="ml-1 inline size-3.5" />
            </Link>
          </div>
          {notasRecentes.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-[#82939a]">Nenhuma nota lançada ainda.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#f0f4f5]">
              {notasRecentes.map((n) => (
                <div key={n.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#243942]">{n.aluno_nome}</p>
                    <p className="mt-0.5 text-xs text-[#82939a]">{n.disciplina} · {periodosLabel[n.periodo] || n.periodo}</p>
                  </div>
                  <span className={`text-sm font-bold ${corNota(n.nota)}`}>
                    {n.nota !== null ? n.nota.toFixed(1) : '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-[#dce5e8] bg-white">
          <div className="flex items-center justify-between border-b border-[#e5ecee] px-5 py-4">
            <h2 className="text-base font-bold text-[#12232b]">Alunos</h2>
            <Link href="/professor/alunos" className="text-sm font-medium transition hover:brightness-90" style={{ color: 'var(--cor-primaria, #0d9488)' }}>
              Ver todos <ArrowRight className="ml-1 inline size-3.5" />
            </Link>
          </div>
          {alunosRecentes.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-[#82939a]">Nenhum aluno cadastrado.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#f0f4f5]">
              {alunosRecentes.map((a) => (
                <div key={a.id} className="flex items-center gap-3 px-5 py-3">
                  <div
                    className="grid size-8 shrink-0 place-items-center rounded-full text-[10px] font-bold"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--cor-primaria, #0d9488) 15%, white)',
                      color: 'var(--cor-primaria, #0d9488)',
                    }}
                  >
                    {a.nome.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#243942]">{a.nome}</p>
                    <p className="mt-0.5 text-xs text-[#82939a]">{a.serie || '—'} · {a.turno || '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}