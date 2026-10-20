'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, Play, Eye, Users, TrendingUp, Video, Edit, Trash2, X, Loader2, Check, EyeOff } from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import { criarVideoaula, atualizarVideoaula, alternarPublicacao, excluirVideoaula, type Videoaula } from './actions'

const disciplinas = ['Matemática', 'Português', 'Física', 'Química', 'Biologia', 'História', 'Geografia', 'Inglês', 'Artes', 'Educação Física', 'Filosofia', 'Sociologia']

function formatarDuracao(minutos: number | null): string {
  if (!minutos) return '—'
  return `${minutos} min`
}

export function EduflixAdminClient({ videoaulas }: { videoaulas: Videoaula[] }) {
  const router = useRouter()
  const [busca, setBusca] = useState('')
  const [filtroDisciplina, setFiltroDisciplina] = useState('Todas')
  const [novoAberto, setNovoAberto] = useState(false)
  const [editando, setEditando] = useState<Videoaula | null>(null)
  const [confirmarExclusao, setConfirmarExclusao] = useState<string | null>(null)
  const [processando, setProcessando] = useState<string | null>(null)

  // Form states
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [disciplina, setDisciplina] = useState('Matemática')
  const [serie, setSerie] = useState('')
  const [duracao, setDuracao] = useState('')
  const [url, setUrl] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const filtradas = videoaulas.filter((v) => {
    const matchDisc = filtroDisciplina === 'Todas' || v.disciplina === filtroDisciplina
    const matchBusca = busca === '' || v.titulo.toLowerCase().includes(busca.toLowerCase())
    return matchDisc && matchBusca
  })

  const publicadas = videoaulas.filter(v => v.publicado).length
  const totalViews = videoaulas.reduce((acc, v) => acc + (v.visualizacoes || 0), 0)

  function limpar() {
    setTitulo('')
    setDescricao('')
    setDisciplina('Matemática')
    setSerie('')
    setDuracao('')
    setUrl('')
    setErro('')
    setEditando(null)
  }

  function abrirEdicao(v: Videoaula) {
    setTitulo(v.titulo)
    setDescricao(v.descricao || '')
    setDisciplina(v.disciplina)
    setSerie(v.serie || '')
    setDuracao(v.duracao_minutos ? String(v.duracao_minutos) : '')
    setUrl(v.video_url)
    setEditando(v)
    setNovoAberto(true)
    setErro('')
  }

  async function handleSalvar() {
    if (!titulo.trim()) return setErro('Informe o título.')
    if (!url.trim()) return setErro('Informe a URL do vídeo.')

    setSalvando(true)
    setErro('')
    
    const payload = {
      titulo,
      descricao,
      disciplina,
      serie,
      duracao_minutos: duracao ? parseInt(duracao, 10) : null,
      video_url: url
    }

    if (editando) {
      const r = await atualizarVideoaula(editando.id, payload)
      setSalvando(false)
      if (!r.success) return setErro(r.error || 'Erro.')
    } else {
      const r = await criarVideoaula(payload)
      setSalvando(false)
      if (!r.success) return setErro(r.error || 'Erro.')
    }

    limpar()
    setNovoAberto(false)
    router.refresh()
  }

  async function handleTogglePublicado(v: Videoaula) {
    setProcessando(v.id)
    await alternarPublicacao(v.id, !v.publicado)
    setProcessando(null)
    router.refresh()
  }

  async function handleExcluir() {
    if (!confirmarExclusao) return
    setProcessando(confirmarExclusao)
    const r = await excluirVideoaula(confirmarExclusao)
    setProcessando(null)
    if (!r.success) {
      alert(r.error || 'Erro ao excluir.')
      return
    }
    setConfirmarExclusao(null)
    router.refresh()
  }

  return (
    <AdminShell mode="school" active="EduFlix">
      <main className="px-5 py-8 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Conteúdo"
            title="EduFlix"
            description="Gerencie as videoaulas disponíveis para os alunos."
          />
          <button
            onClick={() => { limpar(); setNovoAberto(true) }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0f766e]"
          >
            <Plus className="size-4" />
            Publicar videoaula
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Panel className="p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#ccfbf1] text-[#0d9488]"><Video className="size-5" /></div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Videoaulas</p>
            <p className="mt-1 text-2xl font-bold tracking-[-.03em] text-[#0d9488]">{videoaulas.length}</p>
            <p className="mt-1 text-xs text-[#82939a]">{publicadas} publicadas</p>
          </Panel>
          <Panel className="p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#dbeafe] text-[#3b82f6]"><Eye className="size-5" /></div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Visualizações</p>
            <p className="mt-1 text-2xl font-bold tracking-[-.03em] text-[#3b82f6]">{totalViews.toLocaleString('pt-BR')}</p>
          </Panel>
          <Panel className="p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#d1fae5] text-[#065f46]"><TrendingUp className="size-5" /></div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Conclusão média</p>
            <p className="mt-1 text-2xl font-bold tracking-[-.03em] text-[#065f46]">78%</p>
          </Panel>
          <Panel className="p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#fef3c7] text-[#92400e]"><Users className="size-5" /></div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Alunos assistindo</p>
            <p className="mt-1 text-2xl font-bold tracking-[-.03em] text-[#92400e]">142</p>
          </Panel>
        </div>

        <Panel className="mt-8">
          <div className="border-b border-[#e5ecee] px-5 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => setFiltroDisciplina('Todas')} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${filtroDisciplina === 'Todas' ? 'bg-[#ccfbf1] text-[#0f766e]' : 'text-[#6b7d86] hover:bg-[#f1f5f6]'}`}>Todas</button>
                {disciplinas.slice(0, 6).map((d) => (
                  <button key={d} onClick={() => setFiltroDisciplina(d)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${filtroDisciplina === d ? 'bg-[#ccfbf1] text-[#0f766e]' : 'text-[#6b7d86] hover:bg-[#f1f5f6]'}`}>{d}</button>
                ))}
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 lg:w-64">
                <Search className="size-4 text-[#9aaab0]" />
                <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar videoaula" className="w-full bg-transparent text-sm outline-none placeholder:text-[#a0afb4]" />
              </div>
            </div>
          </div>

          {filtradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <div className="grid size-14 place-items-center rounded-full bg-[#ccfbf1] text-[#0d9488]"><Video className="size-6" /></div>
              <h3 className="mt-4 text-base font-bold text-[#12232b]">Nenhuma videoaula</h3>
              <p className="mt-1 max-w-sm text-sm text-[#82939a]">Publique a primeira videoaula para os alunos.</p>
            </div>
          ) : (
            <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtradas.map((v) => (
                <div key={v.id} className={`group overflow-hidden rounded-xl border bg-white transition hover:border-[#0d9488] ${!v.publicado ? 'opacity-60 border-[#e5ecee]' : 'border-[#e5ecee]'}`}>
                  <div className="relative flex aspect-video items-center justify-center bg-[#0e151a]">
                    <div className="grid size-12 place-items-center rounded-full bg-white/10 backdrop-blur transition group-hover:scale-110">
                      <Play className="size-5 fill-white text-white" />
                    </div>
                    {!v.publicado && (
                      <span className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">Rascunho</span>
                    )}
                    <span className="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">{formatarDuracao(v.duracao_minutos)}</span>
                  </div>
                  <div className="p-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#0d9488]">{v.disciplina}</span>
                    <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-[#243942]">{v.titulo}</h3>
                    <p className="mt-1 text-xs text-[#82939a]">{v.serie || 'Todas as séries'}</p>
                    <div className="mt-3 flex items-center justify-between border-t border-[#edf1f2] pt-3 text-xs text-[#82939a]">
                      <span className="flex items-center gap-1"><Eye className="size-3.5" /> {v.visualizacoes}</span>
                      <div className="flex gap-1">
                        <button onClick={() => handleTogglePublicado(v)} disabled={processando === v.id} className="rounded p-1 hover:bg-[#e5ecee] disabled:opacity-50" title={v.publicado ? 'Despublicar' : 'Publicar'}>
                          {v.publicado ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                        </button>
                        <button onClick={() => abrirEdicao(v)} className="rounded p-1 hover:bg-[#e5ecee]" title="Editar">
                          <Edit className="size-3.5" />
                        </button>
                        <button onClick={() => setConfirmarExclusao(v.id)} className="rounded p-1 hover:bg-[#fee2e2] hover:text-[#dc2626]" title="Excluir">
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </main>

      {/* MODAL CRIAR / EDITAR */}
      {novoAberto && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => !salvando && setNovoAberto(false)} />
          <aside className="relative z-10 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-[#e5ecee] px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-[#12232b]">{editando ? 'Editar videoaula' : 'Publicar videoaula'}</h2>
                <p className="mt-0.5 text-xs text-[#82939a]">Aparecerá no portal do aluno</p>
              </div>
              <button onClick={() => setNovoAberto(false)} disabled={salvando} className="rounded-lg p-2 text-[#6b7d86] hover:bg-[#f1f5f6] disabled:opacity-50"><X className="size-5" /></button>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Título</label>
                  <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Introdução às frações" className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Descrição</label>
                  <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} placeholder="Resumo da aula (opcional)" className="w-full resize-none rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">URL do vídeo (YouTube, Vimeo, MP4)</label>
                  <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Disciplina</label>
                    <select value={disciplina} onChange={(e) => setDisciplina(e.target.value)} className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none focus:border-[#0d9488]">
                      {disciplinas.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Série / Turma</label>
                    <input type="text" value={serie} onChange={(e) => setSerie(e.target.value)} placeholder="Ex: 9º Ano A" className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]" />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Duração (minutos)</label>
                  <input type="number" value={duracao} onChange={(e) => setDuracao(e.target.value)} placeholder="Ex: 18" className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]" />
                </div>
                {erro && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-600">{erro}</p>}
              </div>
            </div>

            <footer className="flex items-center justify-end gap-2 border-t border-[#e5ecee] bg-[#fafcfc] px-6 py-4">
              <button onClick={() => setNovoAberto(false)} disabled={salvando} className="rounded-lg border border-[#b8c9ce] bg-white px-4 py-2 text-sm font-semibold text-[#30454e] disabled:opacity-50">Cancelar</button>
              <button onClick={handleSalvar} disabled={salvando} className="inline-flex items-center gap-2 rounded-lg bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f766e] disabled:opacity-50">
                {salvando ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Publicar'}
              </button>
            </footer>
          </aside>
        </div>
      )}

      {/* MODAL EXCLUIR */}
      {confirmarExclusao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => !processando && setConfirmarExclusao(null)} />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#fee2e2] text-[#dc2626]"><Trash2 className="size-5" /></div>
            <h3 className="mt-4 text-center text-lg font-bold text-[#12232b]">Excluir videoaula?</h3>
            <p className="mt-2 text-center text-sm text-[#82939a]">Essa ação não pode ser desfeita.</p>
            <div className="mt-6 flex gap-2">
              <button onClick={() => setConfirmarExclusao(null)} disabled={!!processando} className="flex-1 rounded-lg border border-[#b8c9ce] bg-white px-4 py-2.5 text-sm font-semibold text-[#30454e] disabled:opacity-50">Cancelar</button>
              <button onClick={handleExcluir} disabled={!!processando} className="flex-1 rounded-lg bg-[#dc2626] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#b91c1c] disabled:opacity-50">
                {processando ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  )
}