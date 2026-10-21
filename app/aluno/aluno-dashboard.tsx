'use client'

import Link from 'next/link'
import {
  ArrowRight, BookOpen, Calendar, Clock, MessageSquare, TrendingUp, Video,
} from 'lucide-react'
import type { NotaAluno, EventoAluno, ComunicadoAluno, AulaPendente } from './actions'

const tipoEvento: Record<string, { cor: string; label: string }> = {
  prova: { cor: '#3b82f6', label: 'Prova' },
  reuniao: { cor: '#7c3aed', label: 'Reunião' },
  passeio: { cor: '#0d9488', label: 'Passeio' },
  feriado: { cor: '#d97706', label: 'Feriado' },
  evento: { cor: '#dc2626', label: 'Evento' },
  outro: { cor: '#6b7d86', label: 'Outro' },
}

const setorStyles: Record<string, string> = {
  'Coordenação': 'bg-[#dbeafe] text-[#1e40af]',
  'Secretaria': 'bg-[#ccfbf1] text-[#0f766e]',
  'Financeiro': 'bg-[#fef3c7] text-[#92400e]',
  'Direção': 'bg-[#ede9fe] text-[#5b21b6]',
}

function formatarData(iso: string): string {
  try {
    return new Date(iso + (iso.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('pt-BR')
  } catch {
    return '—'
  }
}

function diaMes(iso: string): { dia: string; mes: string } {
  try {
    const d = new Date(iso + 'T12:00:00')
    return {
      dia: String(d.getDate()).padStart(2, '0'),
      mes: d.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', ''),
    }
  } catch {
    return { dia: '--', mes: '---' }
  }
}

function corNota(nota: number | null): string {
  if (nota === null) return 'text-[#82939a]'
  if (nota >= 7) return 'text-[#065f46]'
  if (nota >= 5) return 'text-[#92400e]'
  return 'text-[#991b1b]'
}

export function AlunoDashboard({
  alunoNome,
  notas,
  eventos,
  comunicados,
  aulas,
}: {
  alunoNome: string
  notas: NotaAluno[]
  eventos: EventoAluno[]
  comunicados: ComunicadoAluno[]
  aulas: AulaPendente[]
}) {
  const notasValidas = notas.filter((n) => n.nota !== null)
  const media = notasValidas.length > 0
    ? notasValidas.reduce((s, n) => s + (n.nota || 0), 0) / notasValidas.length
    : null

  const aulasConcluidas = aulas.filter((a) => a.concluida).length
  const aulasPendentes = aulas.filter((a) => !a.concluida).slice(0, 4)
  const comunicadosNaoLidos = comunicados.filter((c) => !c.lido)

  return (
    <main className="px-5 py-8 lg:px-8">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[.18em]" style={{ color: 'var(--cor-primaria, #0d9488)' }}>Olá, {alunoNome.split(' ')[0]}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-.03em] text-[#12232b]">Seu painel</h1>
        <p className="mt-2 text-sm text-[#71838b]">Acompanhe seu desempenho, aulas e novidades da escola.</p>
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
            <TrendingUp className="size-5" />
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Média geral</p>
          <p className={`mt-1 text-3xl font-bold tracking-[-.03em] ${corNota(media)}`}>
            {media !== null ? media.toFixed(1) : '—'}
          </p>
          <p className="mt-1 text-xs text-[#82939a]">{notasValidas.length} avaliações</p>
        </div>

        <div className="rounded-xl border border-[#dce5e8] bg-white p-5">
          <div className="grid size-10 place-items-center rounded-lg bg-[#dbeafe] text-[#3b82f6]">
            <Video className="size-5" />
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Aulas</p>
          <p className="mt-1 text-3xl font-bold tracking-[-.03em] text-[#3b82f6]">
            {aulasConcluidas}/{aulas.length}
          </p>
          <p className="mt-1 text-xs text-[#82939a]">concluídas</p>
        </div>

        <div className="rounded-xl border border-[#dce5e8] bg-white p-5">
          <div className="grid size-10 place-items-center rounded-lg bg-[#fef3c7] text-[#92400e]">
            <Calendar className="size-5" />
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Próximos eventos</p>
          <p className="mt-1 text-3xl font-bold tracking-[-.03em] text-[#92400e]">{eventos.length}</p>
          <p className="mt-1 text-xs text-[#82939a]">agendados</p>
        </div>

        <div className="rounded-xl border border-[#dce5e8] bg-white p-5">
          <div className="grid size-10 place-items-center rounded-lg bg-[#fee2e2] text-[#dc2626]">
            <MessageSquare className="size-5" />
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Comunicados novos</p>
          <p className="mt-1 text-3xl font-bold tracking-[-.03em] text-[#dc2626]">{comunicadosNaoLidos.length}</p>
          <p className="mt-1 text-xs text-[#82939a]">para ler</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#12232b]">Continue estudando</h2>
            <Link href="/aluno/aulas" className="text-sm font-medium transition hover:brightness-90" style={{ color: 'var(--cor-primaria, #0d9488)' }}>
              Ver todas <ArrowRight className="ml-1 inline size-3.5" />
            </Link>
          </div>

          {aulasPendentes.length === 0 ? (
            <div className="rounded-xl border border-[#dce5e8] bg-white p-8 text-center">
              <Video className="mx-auto text-[#a0afb4]" size={28} />
              <p className="mt-3 text-sm text-[#82939a]">
                {aulas.length === 0 ? 'Nenhuma aula disponível ainda.' : 'Você concluiu todas as aulas!'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {aulasPendentes.map((a) => (
                <Link
                  key={a.id}
                  href="/aluno/aulas"
                  className="group flex items-center gap-4 rounded-xl border border-[#dce5e8] bg-white p-4 transition hover:border-[var(--cor-primaria,#0d9488)]"
                >
                  <div
                    className="grid size-10 shrink-0 place-items-center rounded-lg"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--cor-primaria, #0d9488) 15%, white)',
                      color: 'var(--cor-primaria, #0d9488)',
                    }}
                  >
                    <Video className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--cor-primaria, #0d9488)' }}>{a.disciplina}</p>
                    <h3 className="mt-0.5 truncate text-sm font-semibold text-[#243942]">{a.titulo}</h3>
                    <p className="mt-0.5 truncate text-xs text-[#82939a]">
                      {a.modulo_titulo}{a.duracao_minutos ? ` · ${a.duracao_minutos} min` : ''}
                    </p>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-[#a0afb4] transition group-hover:text-[var(--cor-primaria,#0d9488)]" />
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#12232b]">Próximos eventos</h2>
            <Link href="/aluno/agenda" className="text-sm font-medium transition hover:brightness-90" style={{ color: 'var(--cor-primaria, #0d9488)' }}>
              Ver agenda <ArrowRight className="ml-1 inline size-3.5" />
            </Link>
          </div>

          {eventos.length === 0 ? (
            <div className="rounded-xl border border-[#dce5e8] bg-white p-8 text-center">
              <Calendar className="mx-auto text-[#a0afb4]" size={28} />
              <p className="mt-3 text-sm text-[#82939a]">Nenhum evento agendado.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {eventos.slice(0, 5).map((e) => {
                const info = tipoEvento[e.tipo] || tipoEvento.outro
                const dt = diaMes(e.data_evento)
                return (
                  <article key={e.id} className="flex items-center gap-3 rounded-xl border border-[#dce5e8] bg-white p-3">
                    <div className="w-11 shrink-0 rounded-lg py-1.5 text-center" style={{ backgroundColor: `${info.cor}15` }}>
                      <strong className="block text-base font-bold" style={{ color: info.cor }}>{dt.dia}</strong>
                      <span className="text-[9px] font-bold" style={{ color: info.cor }}>{dt.mes}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-semibold text-[#243942]">{e.titulo}</h4>
                      <p className="mt-0.5 truncate text-xs text-[#82939a]">
                        {e.hora_evento ? `${e.hora_evento} · ` : ''}{info.label}
                      </p>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#12232b]">Comunicados recentes</h2>
          <Link href="/aluno/comunicados" className="text-sm font-medium transition hover:brightness-90" style={{ color: 'var(--cor-primaria, #0d9488)' }}>
            Ver todos <ArrowRight className="ml-1 inline size-3.5" />
          </Link>
        </div>

        {comunicados.length === 0 ? (
          <div className="rounded-xl border border-[#dce5e8] bg-white p-8 text-center">
            <MessageSquare className="mx-auto text-[#a0afb4]" size={28} />
            <p className="mt-3 text-sm text-[#82939a]">Nenhum comunicado ainda.</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {comunicados.slice(0, 3).map((c) => {
              const temEstiloSetor = !!setorStyles[c.setor]
              return (
                <Link
                  key={c.id}
                  href="/aluno/comunicados"
                  className={`rounded-xl border bg-white p-4 transition hover:border-[var(--cor-primaria,#0d9488)] ${!c.lido ? 'border-[#dc2626]/30' : 'border-[#dce5e8]'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-bold ${setorStyles[c.setor] || ''}`}
                      style={!temEstiloSetor ? {
                        backgroundColor: 'color-mix(in srgb, var(--cor-primaria, #0d9488) 15%, white)',
                        color: 'var(--cor-primaria, #0d9488)',
                      } : undefined}
                    >
                      {c.setor}
                    </span>
                    <span className="text-xs text-[#82939a]">{formatarData(c.criado_em)}</span>
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-[#243942]">
                    {!c.lido && <span className="mr-2 inline-block size-2 rounded-full bg-[#dc2626]" />}
                    {c.titulo}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#82939a]">{c.mensagem}</p>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}