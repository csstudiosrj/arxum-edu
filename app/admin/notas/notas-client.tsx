'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, BookOpen, Trash2, X, Loader2, TrendingUp, Users, Check, Edit } from 'lucide-react'
import { AdminShell, SectionHeading, Panel, ActionButton } from '@/components/admin-shell'
import { lancarNota, excluirNota, type Nota, type NovaNota } from './actions'

const disciplinas = ['Matemática', 'Português', 'Física', 'Química', 'Biologia', 'História', 'Geografia', 'Inglês', 'Artes', 'Educação Física']

const periodos = [
  { key: '1_bimestre', label: '1º Bimestre' },
  { key: '2_bimestre', label: '2º Bimestre' },
  { key: '3_bimestre', label: '3º Bimestre' },
  { key: '4_bimestre', label: '4º Bimestre' },
  { key: '1_semestre', label: '1º Semestre' },
  { key: '2_semestre', label: '2º Semestre' },
]

// ── SEMÂNTICO: nota por faixa, não muda com branding ────────────────
function corNota(nota: number | null): string {
  if (nota === null) return 'bg-[#e5ecee] text-[#5e7a94]'
  if (nota >= 7) return 'bg-[#d1fae5] text-[#065f46]'
  if (nota >= 5) return 'bg-[#fef3c7] text-[#92400e]'
  return 'bg-[#fee2e2] text-[#991b1b]'
}

export function NotasClient({ notas, alunos }: { notas: Nota[]; alunos: Array<{ id: string; nome: string; responsavel_email: string }> }) {
  const router = useRouter()
  const [filtroAluno, setFiltroAluno] = useState('todos')
  const [filtroPeriodo, setFiltroPeriodo] = useState('todos')
  const [busca, setBusca] = useState('')
  const [novaAberta, setNovaAberta] = useState(false)
  const [editando, setEditando] = useState<Nota | null>(null)
  const [confirmarExclusao, setConfirmarExclusao] = useState<string | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  const [alunoIdx, setAlunoIdx] = useState('')
  const [disciplina, setDisciplina] = useState('Matemática')
  const [periodo, setPeriodo] = useState('1_bimestre')
  const [notaStr, setNotaStr] = useState('')
  const [faltas, setFaltas] = useState('')
  const [observacao, setObservacao] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const filtradas = notas.filter((n) => {
    const matchAluno = filtroAluno === 'todos' || n.aluno_nome === filtroAluno
    const matchPeriodo = filtroPeriodo === 'todos' || n.periodo === filtroPeriodo
    const termo = busca.toLowerCase()
    const matchBusca = busca === '' || n.aluno_nome.toLowerCase().includes(termo) || n.disciplina.toLowerCase().includes(termo)
    return matchAluno && matchPeriodo && matchBusca
  })

  const alunosUnicos = Array.from(new Set(notas.map((n) => n.aluno_nome))).sort()
  const mediaGeral = notas.filter((n) => n.nota !== null).reduce((s, n) => s + (n.nota || 0), 0) / Math.max(1, notas.filter((n) => n.nota !== null).length)

  function limpar() {
    setAlunoIdx('')
    setDisciplina('Matemática')
    setPeriodo('1_bimestre')
    setNotaStr('')
    setFaltas('')
    setObservacao('')
    setErro('')
    setEditando(null)
  }

  function abrirEdicao(n: Nota) {
    // Encontra o index do aluno na lista para setar no select
    const idx = alunos.findIndex((a) => a.id === n.aluno_id)
    setAlunoIdx(String(idx))
    setDisciplina(n.disciplina)
    setPeriodo(n.periodo)
    setNotaStr(n.nota !== null ? n.nota.toString() : '')
    setFaltas(n.faltas.toString())
    setObservacao(n.observacao || '')
    setEditando(n)
    setNovaAberta(true)
    setErro('')
  }

  async function handleLancar() {
    if (!alunoIdx) return setErro('Selecione o aluno.')
    const aluno = alunos[parseInt(alunoIdx, 10)]
    if (!aluno) return setErro('Aluno inválido.')

    let notaValor: number | null = null
    if (notaStr.trim()) {
      notaValor = parseFloat(notaStr.replace(',', '.'))
      if (isNaN(notaValor) || notaValor < 0 || notaValor > 10) return setErro('Nota deve estar entre 0 e 10.')
    }

    const faltasValor = faltas.trim() ? parseInt(faltas, 10) : 0
    if (isNaN(faltasValor) || faltasValor < 0) return setErro('Faltas inválidas.')

    setSalvando(true)
    setErro('')
    
    // O upsert na action já resolve se for nova ou edição
    const result = await lancarNota({
      aluno_id: aluno.id,
      aluno_nome: aluno.nome,
      responsavel_email: aluno.responsavel_email,
      disciplina,
      periodo,
      nota: notaValor,
      faltas: faltasValor,
      observacao,
    })
    setSalvando(false)

    if (!result.success) return setErro(result.error || 'Erro.')

    limpar()
    setNovaAberta(false)
    router.refresh()
  }

  async function handleExcluir() {
    if (!confirmarExclusao) return
    setExcluindo(true)
    const r = await excluirNota(confirmarExclusao)
    setExcluindo(false)
    if (!r.success) {
      alert(r.error || 'Erro ao excluir.')
      return
    }
    setConfirmarExclusao(null)
    router.refresh()
  }

  return (
    <AdminShell mode="school" active="Notas">
      <main className="px-5 py-8 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Pedagógico"
            title="Boletim escolar"
            description="Lance notas e faltas por aluno, disciplina e período."
          />
          <ActionButton variant="primary">
            <button onClick={() => { limpar(); setNovaAberta(true) }} className="inline-flex items-center gap-1.5">
              <Plus className="size-4" />
              Lançar nota
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
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Notas lançadas</p>
            <p className="mt-1 text-2xl font-bold tracking-[-.03em]" style={{ color: 'var(--cor-primaria, #0d9488)' }}>{notas.length}</p>
          </Panel>
          <Panel className="p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#dbeafe] text-[#3b82f6]">
              <Users className="size-5" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Alunos avaliados</p>
            <p className="mt-1 text-2xl font-bold tracking-[-.03em] text-[#3b82f6]">{alunosUnicos.length}</p>
          </Panel>
          <Panel className="p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-[#d1fae5] text-[#065f46]">
              <TrendingUp className="size-5" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6b7d86]">Média geral</p>
            <p className="mt-1 text-2xl font-bold tracking-[-.03em] text-[#065f46]">{isNaN(mediaGeral) ? '—' : mediaGeral.toFixed(1)}</p>
          </Panel>
        </div>

        <Panel className="mt-8">
          <div className="border-b border-[#e5ecee] px-5 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                <select value={filtroAluno} onChange={(e) => setFiltroAluno(e.target.value)} className="rounded-lg border border-[#d5e0e3] bg-white px-3 py-1.5 text-xs font-semibold text-[#6b7d86] outline-none focus:border-[var(--cor-primaria,#0d9488)]">
                  <option value="todos">Todos os alunos</option>
                  {alunosUnicos.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
                <select value={filtroPeriodo} onChange={(e) => setFiltroPeriodo(e.target.value)} className="rounded-lg border border-[#d5e0e3] bg-white px-3 py-1.5 text-xs font-semibold text-[#6b7d86] outline-none focus:border-[var(--cor-primaria,#0d9488)]">
                  <option value="todos">Todos os períodos</option>
                  {periodos.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 lg:w-64">
                <Search className="size-4 text-[#9aaab0]" />
                <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar aluno ou disciplina" className="w-full bg-transparent text-sm outline-none placeholder:text-[#a0afb4]" />
              </div>
            </div>
          </div>

          {notas.length === 0 ? (
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
              <h3 className="mt-4 text-base font-bold text-[#12232b]">Nenhuma nota lançada</h3>
              <p className="mt-1 max-w-sm text-sm text-[#82939a]">Clique em "Lançar nota" para começar a preencher o boletim.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#e5ecee] bg-[#fafcfc]">
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Aluno</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Disciplina</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Período</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Nota</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Faltas</th>
                    <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.length === 0 ? (
                    <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-[#82939a]">Nenhuma nota encontrada.</td></tr>
                  ) : (
                    filtradas.map((n) => {
                      const periodoLabel = periodos.find((p) => p.key === n.periodo)?.label || n.periodo
                      return (
                        <tr key={n.id} className="border-b border-[#f0f4f5] transition hover:bg-[#fafcfc]">
                          <td className="px-5 py-3.5 text-sm font-semibold text-[#243942]">{n.aluno_nome}</td>
                          <td className="px-5 py-3.5 text-sm text-[#4d626c]">{n.disciplina}</td>
                          <td className="px-5 py-3.5 text-sm text-[#4d626c]">{periodoLabel}</td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-sm font-bold ${corNota(n.nota)}`}>
                              {n.nota !== null ? n.nota.toFixed(1) : '—'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-sm text-[#4d626c]">{n.faltas}</td>
                          <td className="px-5 py-3.5">
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => abrirEdicao(n)}
                                className="rounded-lg p-1.5 transition hover:brightness-90"
                                style={{ color: 'var(--cor-primaria, #0d9488)' }}
                                title="Editar"
                              >
                                <Edit className="size-4" />
                              </button>
                              <button onClick={() => setConfirmarExclusao(n.id)} className="rounded-lg p-1.5 text-[#6b7d86] hover:bg-[#fee2e2] hover:text-[#dc2626]" title="Excluir">
                                <Trash2 className="size-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </main>

      {/* MODAL NOVA NOTA / EDITAR */}
      {novaAberta && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => !salvando && setNovaAberta(false)} />
          <aside className="relative z-10 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-[#e5ecee] px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-[#12232b]">{editando ? 'Editar nota' : 'Lançar nota'}</h2>
                <p className="mt-0.5 text-xs text-[#82939a]">Se a nota já existir, ela será atualizada</p>
              </div>
              <button onClick={() => setNovaAberta(false)} disabled={salvando} className="rounded-lg p-2 text-[#6b7d86] hover:bg-[#f1f5f6] disabled:opacity-50">
                <X className="size-5" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Aluno</label>
                  <select value={alunoIdx} onChange={(e) => setAlunoIdx(e.target.value)} disabled={!!editando} className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none focus:border-[var(--cor-primaria,#0d9488)] disabled:bg-[#f0f4f5] disabled:text-[#82939a]">
                    <option value="">Selecione</option>
                    {alunos.map((a, i) => <option key={a.id} value={String(i)}>{a.nome}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Disciplina</label>
                    <select value={disciplina} onChange={(e) => setDisciplina(e.target.value)} disabled={!!editando} className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none focus:border-[var(--cor-primaria,#0d9488)] disabled:bg-[#f0f4f5] disabled:text-[#82939a]">
                      {disciplinas.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Período</label>
                    <select value={periodo} onChange={(e) => setPeriodo(e.target.value)} disabled={!!editando} className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none focus:border-[var(--cor-primaria,#0d9488)] disabled:bg-[#f0f4f5] disabled:text-[#82939a]">
                      {periodos.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Nota (0 a 10)</label>
                    <input type="text" value={notaStr} onChange={(e) => setNotaStr(e.target.value)} placeholder="Ex: 8.5" className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[var(--cor-primaria,#0d9488)]" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Faltas</label>
                    <input type="number" value={faltas} onChange={(e) => setFaltas(e.target.value)} placeholder="0" className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[var(--cor-primaria,#0d9488)]" />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Observação</label>
                  <textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Comentário sobre o desempenho (opcional)" rows={3} className="w-full resize-none rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[var(--cor-primaria,#0d9488)]" />
                </div>
                {erro && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-600">{erro}</p>}
              </div>
            </div>
            <footer className="flex items-center justify-end gap-2 border-t border-[#e5ecee] bg-[#fafcfc] px-6 py-4">
              <button onClick={() => setNovaAberta(false)} disabled={salvando} className="rounded-lg border border-[#b8c9ce] bg-white px-4 py-2 text-sm font-semibold text-[#30454e] disabled:opacity-50">Cancelar</button>
              <button
                onClick={handleLancar}
                disabled={salvando}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:brightness-90 disabled:opacity-50"
                style={{ backgroundColor: 'var(--cor-primaria, #0d9488)' }}
              >
                {salvando ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Salvar nota'}
              </button>
            </footer>
          </aside>
        </div>
      )}

      {/* MODAL EXCLUIR */}
      {confirmarExclusao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => !excluindo && setConfirmarExclusao(null)} />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#fee2e2] text-[#dc2626]">
              <Trash2 className="size-5" />
            </div>
            <h3 className="mt-4 text-center text-lg font-bold text-[#12232b]">Excluir nota?</h3>
            <p className="mt-2 text-center text-sm text-[#82939a]">Essa ação não pode ser desfeita.</p>
            <div className="mt-6 flex gap-2">
              <button onClick={() => setConfirmarExclusao(null)} disabled={excluindo} className="flex-1 rounded-lg border border-[#b8c9ce] bg-white px-4 py-2.5 text-sm font-semibold text-[#30454e] disabled:opacity-50">Cancelar</button>
              <button onClick={handleExcluir} disabled={excluindo} className="flex-1 rounded-lg bg-[#dc2626] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#b91c1c] disabled:opacity-50">
                {excluindo ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  )
}