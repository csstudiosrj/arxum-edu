'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, BookOpen, Check, CheckCircle2, ChevronRight, FileText, Loader2, Play, Save, Video } from 'lucide-react'
import { ArxumBrand } from '@/components/arxum-brand'
import type { Modulo, Aula } from './actions'
import { marcarConcluida, salvarAnotacao } from './actions'

function toEmbed(url: string): string {
  if (url.includes('youtube.com/watch')) {
    const id = new URL(url).searchParams.get('v')
    return id ? `https://www.youtube.com/embed/${id}` : url
  }
  if (url.includes('youtu.be/')) {
    const id = url.split('youtu.be/')[1]?.split('?')[0]
    return id ? `https://www.youtube.com/embed/${id}` : url
  }
  if (url.includes('vimeo.com/')) {
    const id = url.split('vimeo.com/')[1]?.split('?')[0]
    return id ? `https://player.vimeo.com/video/${id}` : url
  }
  return url
}

const iconeTipo: Record<string, typeof Video> = {
  video: Video,
  pdf: FileText,
  texto: FileText,
  quiz: BookOpen,
}

export function SalaVirtualClient({ modulos, cor }: { modulos: Modulo[]; cor?: string }) {
  const [moduloAtivo, setModuloAtivo] = useState<Modulo | null>(modulos[0] || null)
  const [aulaAtiva, setAulaAtiva] = useState<Aula | null>(modulos[0]?.aulas[0] || null)
  const [anotacao, setAnotacao] = useState(aulaAtiva?.anotacao || '')
  const [salvando, setSalvando] = useState(false)
  const [salvouAgora, setSalvouAgora] = useState(false)
  const [atualizando, setAtualizando] = useState(false)

  const estiloMarca = cor
    ? ({ '--cor-primaria': cor } as React.CSSProperties)
    : undefined

  function trocarAula(aula: Aula) {
    setAulaAtiva(aula)
    setAnotacao(aula.anotacao || '')
    setSalvouAgora(false)
  }

  function trocarModulo(m: Modulo) {
    setModuloAtivo(m)
    if (m.aulas[0]) trocarAula(m.aulas[0])
    else setAulaAtiva(null)
  }

  async function handleSalvarAnotacao() {
    if (!aulaAtiva) return
    setSalvando(true)
    await salvarAnotacao(aulaAtiva.id, anotacao)
    setSalvando(false)
    setSalvouAgora(true)
    setTimeout(() => setSalvouAgora(false), 2000)
  }

  async function handleMarcarConcluida() {
    if (!aulaAtiva) return
    setAtualizando(true)
    await marcarConcluida(aulaAtiva.id, !aulaAtiva.concluida)
    setAtualizando(false)
    setAulaAtiva({ ...aulaAtiva, concluida: !aulaAtiva.concluida })
    if (moduloAtivo) {
      setModuloAtivo({
        ...moduloAtivo,
        aulas: moduloAtivo.aulas.map((a) => (a.id === aulaAtiva.id ? { ...a, concluida: !aulaAtiva.concluida } : a)),
      })
    }
  }

  const totalAulas = moduloAtivo?.aulas.length || 0
  const concluidas = moduloAtivo?.aulas.filter((a) => a.concluida).length || 0
  const progressoPct = totalAulas > 0 ? Math.round((concluidas / totalAulas) * 100) : 0

  if (modulos.length === 0) {
    return (
      <div className="min-h-screen bg-[#070b0f] text-[#e7f1f5]" style={estiloMarca}>
        <header className="border-b border-white/[.08] bg-[#070b0f] px-6 py-4 lg:px-8">
          <div className="mx-auto flex max-w-7xl items-center gap-4">
            <Link href="/" className="text-[#8aa0ad] hover:text-white"><ArrowLeft className="size-4" /></Link>
            <ArxumBrand />
          </div>
        </header>
        <main className="mx-auto flex max-w-2xl flex-col items-center px-6 py-24 text-center">
          <div
            className="grid size-16 place-items-center rounded-full"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--cor-primaria, #0d9488) 15%, transparent)',
              color: 'var(--cor-primaria, #0d9488)',
            }}
          >
            <BookOpen className="size-7" />
          </div>
          <h1 className="mt-5 font-syne text-3xl font-bold text-white">Sala virtual vazia</h1>
          <p className="mt-3 text-sm leading-6 text-[#8aa0ad]">
            Ainda não há módulos de estudo publicados para a sua turma. Assim que a escola liberar, eles aparecerão aqui.
          </p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#070b0f] text-[#e7f1f5]" style={estiloMarca}>
      <header className="border-b border-white/[.08] bg-[#070b0f] px-6 py-4 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-[#8aa0ad] hover:text-white"><ArrowLeft className="size-4" /></Link>
            <ArxumBrand />
          </div>
          <span className="text-xs font-semibold uppercase tracking-[.18em] text-[#5e7a94]">Sala de aula virtual</span>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[260px_1fr] lg:px-8">
        <aside className="space-y-2">
          <p className="px-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#5e7a94]">Módulos</p>
          {modulos.map((m) => {
            const ativo = moduloAtivo?.id === m.id
            const totalConcluidas = m.aulas.filter((a) => a.concluida).length
            return (
              <button
                key={m.id}
                onClick={() => trocarModulo(m)}
                className={`w-full rounded-lg border px-3 py-3 text-left transition ${ativo ? '' : 'border-white/[.08] bg-[#0e151a] hover:border-white/20'}`}
                style={ativo ? {
                  borderColor: 'color-mix(in srgb, var(--cor-primaria, #0d9488) 40%, transparent)',
                  backgroundColor: 'color-mix(in srgb, var(--cor-primaria, #0d9488) 10%, transparent)',
                } : undefined}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`grid size-9 shrink-0 place-items-center rounded-lg ${ativo ? 'text-white' : 'bg-white/5 text-[#8aa0ad]'}`}
                    style={ativo ? { backgroundColor: 'var(--cor-primaria, #0d9488)' } : undefined}
                  >
                    <BookOpen className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-semibold ${ativo ? 'text-white' : 'text-[#c7d5db]'}`}>{m.titulo}</p>
                    <p className="mt-0.5 truncate text-xs text-[#82939a]">{m.disciplina}</p>
                    <p className="mt-1 text-[10px] text-[#5e7a94]">{totalConcluidas}/{m.aulas.length} concluídas</p>
                  </div>
                </div>
              </button>
            )
          })}
        </aside>

        {moduloAtivo && aulaAtiva ? (
          <section>
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-[.18em]" style={{ color: 'var(--cor-primaria, #0d9488)' }}>{moduloAtivo.disciplina}</p>
              <h1 className="mt-2 font-syne text-3xl font-bold tracking-[-.03em] text-white">{moduloAtivo.titulo}</h1>
              {moduloAtivo.descricao && <p className="mt-2 max-w-2xl text-sm leading-6 text-[#8aa0ad]">{moduloAtivo.descricao}</p>}
              <div className="mt-5 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[.06]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${progressoPct}%`, backgroundColor: 'var(--cor-primaria, #0d9488)' }}
                  />
                </div>
                <span className="shrink-0 text-xs font-semibold text-[#8aa0ad]">{progressoPct}%</span>
              </div>
            </div>

            {aulaAtiva.tipo === 'video' && aulaAtiva.conteudo_url && (
              <div className="mb-6 aspect-video w-full overflow-hidden rounded-xl border border-white/[.08] bg-black">
                {aulaAtiva.conteudo_url.includes('youtube') || aulaAtiva.conteudo_url.includes('youtu.be') || aulaAtiva.conteudo_url.includes('vimeo') ? (
                  <iframe
                    src={toEmbed(aulaAtiva.conteudo_url)}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video src={aulaAtiva.conteudo_url} controls className="h-full w-full" />
                )}
              </div>
            )}

            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-syne text-xl font-bold text-white">{aulaAtiva.titulo}</h2>
                <p className="mt-1 text-xs text-[#82939a]">
                  Aula {moduloAtivo.aulas.findIndex((a) => a.id === aulaAtiva.id) + 1} de {moduloAtivo.aulas.length}
                  {aulaAtiva.duracao_minutos ? ` · ${aulaAtiva.duracao_minutos} min` : ''}
                </p>
                {aulaAtiva.descricao && <p className="mt-3 text-sm leading-6 text-[#8aa0ad]">{aulaAtiva.descricao}</p>}
              </div>
              <button
                onClick={handleMarcarConcluida}
                disabled={atualizando}
                className={`shrink-0 inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition disabled:opacity-50 ${aulaAtiva.concluida ? '' : 'text-white hover:brightness-90'}`}
                style={aulaAtiva.concluida ? {
                  borderWidth: 1,
                  borderStyle: 'solid',
                  borderColor: 'var(--cor-primaria, #0d9488)',
                  backgroundColor: 'color-mix(in srgb, var(--cor-primaria, #0d9488) 10%, transparent)',
                  color: 'var(--cor-primaria, #0d9488)',
                } : {
                  backgroundColor: 'var(--cor-primaria, #0d9488)',
                }}
              >
                {atualizando ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                {aulaAtiva.concluida ? 'Concluída' : 'Marcar como concluída'}
              </button>
            </div>

            <div className="mb-6 rounded-xl border border-white/[.08] bg-[#0e151a] p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#5e7a94]">Minhas anotações</p>
                {salvouAgora && (
                  <span className="text-xs" style={{ color: 'var(--cor-primaria, #0d9488)' }}>Salvo!</span>
                )}
              </div>
              <textarea
                value={anotacao}
                onChange={(e) => setAnotacao(e.target.value)}
                placeholder="Faça suas anotações sobre esta aula..."
                rows={5}
                className="w-full resize-none rounded-lg border border-white/10 bg-[#0b1115] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#5e7a94] focus:border-[var(--cor-primaria,#0d9488)]"
              />
              <div className="mt-3 flex justify-end">
                <button
                  onClick={handleSalvarAnotacao}
                  disabled={salvando}
                  className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold text-white transition hover:brightness-90 disabled:opacity-50"
                  style={{ backgroundColor: 'var(--cor-primaria, #0d9488)' }}
                >
                  {salvando ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  {salvando ? 'Salvando...' : 'Salvar anotação'}
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-white/[.08] bg-[#0e151a] p-5">
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#5e7a94]">Aulas do módulo</p>
              <div className="flex flex-col divide-y divide-white/[.06]">
                {moduloAtivo.aulas.map((a, idx) => {
                  const Icone = iconeTipo[a.tipo] || Video
                  const ativa = a.id === aulaAtiva.id
                  return (
                    <button
                      key={a.id}
                      onClick={() => trocarAula(a)}
                      className={`flex items-center gap-4 py-3 text-left transition ${ativa ? 'text-white' : 'text-[#c7d5db] hover:text-white'}`}
                    >
                      <div
                        className={`grid size-8 shrink-0 place-items-center rounded-lg ${
                          a.concluida ? 'text-white' : ativa ? '' : 'bg-white/5 text-[#82939a]'
                        }`}
                        style={
                          a.concluida
                            ? { backgroundColor: 'var(--cor-primaria, #0d9488)' }
                            : ativa
                              ? {
                                  backgroundColor: 'color-mix(in srgb, var(--cor-primaria, #0d9488) 15%, transparent)',
                                  color: 'var(--cor-primaria, #0d9488)',
                                }
                              : undefined
                        }
                      >
                        {a.concluida ? <Check className="size-4" /> : <Icone className="size-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{idx + 1}. {a.titulo}</p>
                        {a.descricao && <p className="mt-0.5 truncate text-xs text-[#82939a]">{a.descricao}</p>}
                      </div>
                      {a.duracao_minutos && <span className="shrink-0 text-xs text-[#82939a]">{a.duracao_minutos} min</span>}
                      <ChevronRight className="size-4 shrink-0 text-[#5e7a94]" />
                    </button>
                  )
                })}
              </div>
            </div>
          </section>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-sm text-[#8aa0ad]">Selecione um módulo para começar.</p>
          </div>
        )}
      </main>
    </div>
  )
}