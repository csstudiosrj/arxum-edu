'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, BookOpen, Trash2, X, Loader2, FileText, Video, ChevronDown, ChevronRight } from 'lucide-react'
import { AdminShell, SectionHeading, Panel, ActionButton } from '@/components/admin-shell'
import { criarModulo, excluirModulo, criarAula, excluirAula, type ModuloAdmin } from './actions'

const disciplinas = ['Matemática', 'Português', 'Física', 'Química', 'Biologia', 'História', 'Geografia', 'Inglês', 'Artes', 'Educação Física']
const tiposAula = [
  { key: 'video', label: 'Vídeo' },
  { key: 'pdf', label: 'PDF' },
  { key: 'texto', label: 'Texto' },
  { key: 'quiz', label: 'Quiz' },
]

export function SalaVirtualAdminClient({ modulos }: { modulos: ModuloAdmin[] }) {
  const router = useRouter()
  const [novoModuloAberto, setNovoModuloAberto] = useState(false)
  const [novaAulaModuloId, setNovaAulaModuloId] = useState<string | null>(null)
  const [expandido, setExpandido] = useState<string | null>(modulos[0]?.id || null)
  const [confirmar, setConfirmar] = useState<{ tipo: 'modulo' | 'aula'; id: string } | null>(null)

  // Form módulo
  const [tituloMod, setTituloMod] = useState('')
  const [descMod, setDescMod] = useState('')
  const [disciplinaMod, setDisciplinaMod] = useState('Matemática')
  const [serieMod, setSerieMod] = useState('')

  // Form aula
  const [tituloAula, setTituloAula] = useState('')
  const [descAula, setDescAula] = useState('')
  const [tipoAula, setTipoAula] = useState('video')
  const [urlAula, setUrlAula] = useState('')
  const [duracaoAula, setDuracaoAula] = useState('')

  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  function limparModulo() {
    setTituloMod('')
    setDescMod('')
    setDisciplinaMod('Matemática')
    setSerieMod('')
    setErro('')
  }

  function limparAula() {
    setTituloAula('')
    setDescAula('')
    setTipoAula('video')
    setUrlAula('')
    setDuracaoAula('')
    setErro('')
  }

  async function handleCriarModulo() {
    if (!tituloMod.trim()) return setErro('Informe o título do módulo.')

    setSalvando(true)
    setErro('')
    const result = await criarModulo({
      titulo: tituloMod,
      descricao: descMod,
      disciplina: disciplinaMod,
      serie: serieMod,
    })
    setSalvando(false)

    if (!result.success) return setErro(result.error || 'Erro.')

    limparModulo()
    setNovoModuloAberto(false)
    router.refresh()
  }

  async function handleCriarAula() {
    if (!novaAulaModuloId) return
    if (!tituloAula.trim()) return setErro('Informe o título da aula.')

    setSalvando(true)
    setErro('')
    const result = await criarAula(novaAulaModuloId, {
      titulo: tituloAula,
      descricao: descAula,
      tipo: tipoAula,
      conteudo_url: urlAula,
      duracao_minutos: duracaoAula ? parseInt(duracaoAula, 10) : null,
    })
    setSalvando(false)

    if (!result.success) return setErro(result.error || 'Erro.')

    limparAula()
    setNovaAulaModuloId(null)
    router.refresh()
  }

  async function handleExcluir() {
    if (!confirmar) return
    if (confirmar.tipo === 'modulo') {
      await excluirModulo(confirmar.id)
    } else {
      await excluirAula(confirmar.id)
    }
    setConfirmar(null)
    router.refresh()
  }

  const totalAulas = modulos.reduce((s, m) => s + m.aulas.length, 0)

  return (
    <AdminShell mode="school" active="Sala virtual">
      <main className="px-5 py-8 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Conteúdo"
            title="Sala de aula virtual"
            description="Organize módulos e aulas para os alunos estudarem."
          />
          <ActionButton variant="primary">
            <button onClick={() => { limparModulo(); setNovoModuloAberto(true) }} className="inline-flex items-center gap-1.5">
              <Plus className="size-4" />
              Novo módulo
            </button>
          </ActionButton>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Panel className="p-5">
            <div
              className="grid size-10 place-items-center rounded-lg"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--cor-primaria, #0d9488) 15%, white)',
                color: 'var(--cor-primaria, #0d9488)',
              }}
            >
              <BookOpen className="size-5" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Módulos</p>
            <p className="mt-1 text-2xl font-bold tracking-[-.03em]" style={{ color: 'var(--cor-primaria, #0d9488)' }}>{modulos.length}</p>
          </Panel>
          <Panel className="p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#dbeafe] text-[#3b82f6]">
              <FileText className="size-5" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Aulas</p>
            <p className="mt-1 text-2xl font-bold tracking-[-.03em] text-[#3b82f6]">{totalAulas}</p>
          </Panel>
          <Panel className="p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#fef3c7] text-[#92400e]">
              <BookOpen className="size-5" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Disciplinas</p>
            <p className="mt-1 text-2xl font-bold tracking-[-.03em] text-[#92400e]">{new Set(modulos.map((m) => m.disciplina)).size}</p>
          </Panel>
        </div>

        <Panel className="mt-8">
          {modulos.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <div
                className="grid size-14 place-items-center rounded-full"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--cor-primaria, #0d9488) 15%, white)',
                  color: 'var(--cor-primaria, #0d9488)',
                }}
              >
                <BookOpen className="size-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-[#12232b]">Nenhum módulo ainda</h3>
              <p className="mt-1 max-w-sm text-sm text-[#82939a]">
                Crie o primeiro módulo e adicione aulas para os alunos.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#f0f4f5]">
              {modulos.map((m) => {
                const aberto = expandido === m.id
                return (
                  <div key={m.id}>
                    <div className="flex items-center gap-3 px-5 py-4 transition hover:bg-[#fafcfc]">
                      <button
                        onClick={() => setExpandido(aberto ? null : m.id)}
                        className="rounded-lg p-1 text-[#6b7d86] hover:bg-[#e5ecee]"
                      >
                        {aberto ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                            style={{
                              backgroundColor: 'color-mix(in srgb, var(--cor-primaria, #0d9488) 15%, white)',
                              color: 'var(--cor-primaria, #0d9488)',
                            }}
                          >
                            {m.disciplina}
                          </span>
                          {m.serie && <span className="text-xs text-[#82939a]">{m.serie}</span>}
                        </div>
                        <h3 className="mt-1 text-sm font-semibold text-[#243942]">{m.titulo}</h3>
                        {m.descricao && <p className="mt-0.5 truncate text-xs text-[#82939a]">{m.descricao}</p>}
                      </div>
                      <span className="hidden text-xs text-[#82939a] sm:block">{m.aulas.length} aulas</span>
                      <button
                        onClick={() => { limparAula(); setNovaAulaModuloId(m.id) }}
                        className="rounded-lg border border-[#b8c9ce] bg-white px-3 py-1.5 text-xs font-semibold text-[#30454e] hover:border-[var(--cor-primaria,#0d9488)]"
                      >
                        <Plus className="mr-1 inline size-3" />
                        Aula
                      </button>
                      <button
                        onClick={() => setConfirmar({ tipo: 'modulo', id: m.id })}
                        className="rounded-lg p-1.5 text-[#6b7d86] hover:bg-[#fee2e2] hover:text-[#dc2626]"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>

                    {aberto && m.aulas.length > 0 && (
                      <div className="border-t border-[#f0f4f5] bg-[#fafcfc] px-5 py-2 pl-14">
                        {m.aulas.map((a, idx) => (
                          <div key={a.id} className="flex items-center gap-3 border-b border-[#edf1f2] py-3 last:border-0">
                            <div
                              className="grid size-7 shrink-0 place-items-center rounded-lg bg-white border border-[#e5ecee]"
                              style={{ color: 'var(--cor-primaria, #0d9488)' }}
                            >
                              {a.tipo === 'video' ? <Video className="size-3.5" /> : <FileText className="size-3.5" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm text-[#243942]">{idx + 1}. {a.titulo}</p>
                              {a.descricao && <p className="mt-0.5 truncate text-xs text-[#82939a]">{a.descricao}</p>}
                            </div>
                            {a.duracao_minutos && <span className="text-xs text-[#82939a]">{a.duracao_minutos} min</span>}
                            <button
                              onClick={() => setConfirmar({ tipo: 'aula', id: a.id })}
                              className="rounded-lg p-1.5 text-[#6b7d86] hover:bg-[#fee2e2] hover:text-[#dc2626]"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {aberto && m.aulas.length === 0 && (
                      <div className="border-t border-[#f0f4f5] bg-[#fafcfc] px-5 py-6 pl-14 text-center">
                        <p className="text-xs text-[#82939a]">Nenhuma aula ainda. Clique em "+ Aula" para adicionar.</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </Panel>
      </main>

      {novoModuloAberto && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => !salvando && setNovoModuloAberto(false)} />
          <aside className="relative z-10 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-[#e5ecee] px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-[#12232b]">Novo módulo</h2>
                <p className="mt-0.5 text-xs text-[#82939a]">Agrupa aulas de uma mesma disciplina</p>
              </div>
              <button onClick={() => setNovoModuloAberto(false)} disabled={salvando} className="rounded-lg p-2 text-[#6b7d86] hover:bg-[#f1f5f6] disabled:opacity-50">
                <X className="size-5" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Título</label>
                  <input type="text" value={tituloMod} onChange={(e) => setTituloMod(e.target.value)} placeholder="Ex: Frações" className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[var(--cor-primaria,#0d9488)]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Descrição</label>
                  <textarea value={descMod} onChange={(e) => setDescMod(e.target.value)} placeholder="Resumo do que será estudado" rows={3} className="w-full resize-none rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[var(--cor-primaria,#0d9488)]" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Disciplina</label>
                    <select value={disciplinaMod} onChange={(e) => setDisciplinaMod(e.target.value)} className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none focus:border-[var(--cor-primaria,#0d9488)]">
                      {disciplinas.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Série</label>
                    <input type="text" value={serieMod} onChange={(e) => setSerieMod(e.target.value)} placeholder="Ex: 9º Ano A" className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[var(--cor-primaria,#0d9488)]" />
                  </div>
                </div>
                {erro && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-600">{erro}</p>}
              </div>
            </div>
            <footer className="flex items-center justify-end gap-2 border-t border-[#e5ecee] bg-[#fafcfc] px-6 py-4">
              <button onClick={() => setNovoModuloAberto(false)} disabled={salvando} className="rounded-lg border border-[#b8c9ce] bg-white px-4 py-2 text-sm font-semibold text-[#30454e] disabled:opacity-50">Cancelar</button>
              <button
                onClick={handleCriarModulo}
                disabled={salvando}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:brightness-90 disabled:opacity-50"
                style={{ backgroundColor: 'var(--cor-primaria, #0d9488)' }}
              >
                {salvando ? <Loader2 className="size-4 animate-spin" /> : null}
                {salvando ? 'Salvando...' : 'Criar módulo'}
              </button>
            </footer>
          </aside>
        </div>
      )}

      {novaAulaModuloId && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => !salvando && setNovaAulaModuloId(null)} />
          <aside className="relative z-10 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-[#e5ecee] px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-[#12232b]">Nova aula</h2>
                <p className="mt-0.5 text-xs text-[#82939a]">Adicione uma aula ao módulo selecionado</p>
              </div>
              <button onClick={() => setNovaAulaModuloId(null)} disabled={salvando} className="rounded-lg p-2 text-[#6b7d86] hover:bg-[#f1f5f6] disabled:opacity-50">
                <X className="size-5" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Título</label>
                  <input type="text" value={tituloAula} onChange={(e) => setTituloAula(e.target.value)} placeholder="Ex: Introdução às frações" className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[var(--cor-primaria,#0d9488)]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Descrição</label>
                  <textarea value={descAula} onChange={(e) => setDescAula(e.target.value)} placeholder="O que o aluno vai aprender" rows={3} className="w-full resize-none rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[var(--cor-primaria,#0d9488)]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Tipo</label>
                  <div className="grid grid-cols-4 gap-2">
                    {tiposAula.map((t) => {
                      const sel = tipoAula === t.key
                      return (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() => setTipoAula(t.key)}
                          className={`rounded-lg border px-2 py-2 text-xs font-semibold transition ${sel ? '' : 'border-[#d5e0e3] bg-white text-[#6b7d86] hover:border-[var(--cor-primaria,#0d9488)]'}`}
                          style={sel ? {
                            borderColor: 'var(--cor-primaria, #0d9488)',
                            backgroundColor: 'color-mix(in srgb, var(--cor-primaria, #0d9488) 15%, white)',
                            color: 'var(--cor-primaria, #0d9488)',
                          } : undefined}
                        >
                          {t.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">URL do conteúdo</label>
                  <input type="url" value={urlAula} onChange={(e) => setUrlAula(e.target.value)} placeholder="https://..." className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[var(--cor-primaria,#0d9488)]" />
                  <p className="mt-1.5 text-xs text-[#82939a]">YouTube, Vimeo, PDF ou URL direta.</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Duração (min)</label>
                  <input type="number" value={duracaoAula} onChange={(e) => setDuracaoAula(e.target.value)} placeholder="Ex: 18" className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[var(--cor-primaria,#0d9488)]" />
                </div>
                {erro && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-600">{erro}</p>}
              </div>
            </div>
            <footer className="flex items-center justify-end gap-2 border-t border-[#e5ecee] bg-[#fafcfc] px-6 py-4">
              <button onClick={() => setNovaAulaModuloId(null)} disabled={salvando} className="rounded-lg border border-[#b8c9ce] bg-white px-4 py-2 text-sm font-semibold text-[#30454e] disabled:opacity-50">Cancelar</button>
              <button
                onClick={handleCriarAula}
                disabled={salvando}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:brightness-90 disabled:opacity-50"
                style={{ backgroundColor: 'var(--cor-primaria, #0d9488)' }}
              >
                {salvando ? <Loader2 className="size-4 animate-spin" /> : null}
                {salvando ? 'Salvando...' : 'Criar aula'}
              </button>
            </footer>
          </aside>
        </div>
      )}

      {confirmar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmar(null)} />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#fee2e2] text-[#dc2626]">
              <Trash2 className="size-5" />
            </div>
            <h3 className="mt-4 text-center text-lg font-bold text-[#12232b]">
              Excluir {confirmar.tipo === 'modulo' ? 'módulo' : 'aula'}?
            </h3>
            <p className="mt-2 text-center text-sm text-[#82939a]">
              {confirmar.tipo === 'modulo'
                ? 'Todas as aulas deste módulo serão removidas. Essa ação não pode ser desfeita.'
                : 'Essa ação não pode ser desfeita.'}
            </p>
            <div className="mt-6 flex gap-2">
              <button onClick={() => setConfirmar(null)} className="flex-1 rounded-lg border border-[#b8c9ce] bg-white px-4 py-2.5 text-sm font-semibold text-[#30454e]">Cancelar</button>
              <button onClick={handleExcluir} className="flex-1 rounded-lg bg-[#dc2626] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#b91c1c]">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  )
}