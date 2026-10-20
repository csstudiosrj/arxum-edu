'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, TrendingUp, Check, X, Loader2, Edit, Trash2 } from 'lucide-react'
import { lancarNotaProfessor, excluirNotaProfessor, type AlunoResumo, type NotaProfessor } from '../actions'

const TODAS_DISCIPLINAS = [
  'Matemática', 'Português', 'Física', 'Química', 'Biologia', 'História',
  'Geografia', 'Inglês', 'Espanhol', 'Artes', 'Educação Física', 'Filosofia', 'Sociologia',
]

const PERIODOS = [
  { key: '1_bimestre', label: '1º Bimestre' },
  { key: '2_bimestre', label: '2º Bimestre' },
  { key: '3_bimestre', label: '3º Bimestre' },
  { key: '4_bimestre', label: '4º Bimestre' },
  { key: '1_semestre', label: '1º Semestre' },
  { key: '2_semestre', label: '2º Semestre' },
]

function corNota(nota: number | null): string {
  if (nota === null) return 'bg-[#e5ecee] text-[#5e7a94]'
  if (nota >= 7) return 'bg-[#d1fae5] text-[#065f46]'
  if (nota >= 5) return 'bg-[#fef3c7] text-[#92400e]'
  return 'bg-[#fee2e2] text-[#991b1b]'
}

export function NotasProfessorClient({
  alunos,
  notas,
  disciplinasSugeridas,
}: {
  alunos: AlunoResumo[]
  notas: NotaProfessor[]
  disciplinasSugeridas: string[]
}) {
  const router = useRouter()
  const [busca, setBusca] = useState('')
  const [filtroDisciplina, setFiltroDisciplina] = useState('todas')
  const [novaAberta, setNovaAberta] = useState(false)
  const [editando, setEditando] = useState<NotaProfessor | null>(null)
  const [confirmarExclusao, setConfirmarExclusao] = useState<string | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  const [alunoIdx, setAlunoIdx] = useState('')
  const [disciplina, setDisciplina] = useState(disciplinasSugeridas[0] || 'Matemática')
  const [periodo, setPeriodo] = useState('1_bimestre')
  const [notaStr, setNotaStr] = useState('')
  const [faltas, setFaltas] = useState('')
  const [observacao, setObservacao] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  const disciplinasDisponiveis = disciplinasSugeridas.length > 0
    ? disciplinasSugeridas
    : TODAS_DISCIPLINAS

  const filtradas = notas.filter((n) => {
    const matchDisc = filtroDisciplina === 'todas' || n.disciplina === filtroDisciplina
    const termo = busca.toLowerCase()
    const matchBusca = busca === '' || n.aluno_nome.toLowerCase().includes(termo)
    return matchDisc && matchBusca
  })

  function limpar() {
    setAlunoIdx(''); setNotaStr(''); setFaltas(''); setObservacao(''); setErro(''); setEditando(null)
  }

  function abrirEdicao(n: NotaProfessor) {
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

  async function handleSalvar() {
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

    setEnviando(true)
    setErro('')
    
    // A ação lancarNotaProfessor já faz um upsert
    const r = await lancarNotaProfessor({
      aluno_id: aluno.id,
      aluno_nome: aluno.nome,
      responsavel_email: aluno.responsavel_email,
      disciplina,
      periodo,
      nota: notaValor,
      faltas: faltasValor,
      observacao,
    })
    
    setEnviando(false)

    if (!r.success) return setErro(r.error || 'Erro.')
    limpar()
    setNovaAberta(false)
    router.refresh()
  }

  async function handleExcluir() {
    if (!confirmarExclusao) return
    setExcluindo(true)
    const r = await excluirNotaProfessor(confirmarExclusao)
    setExcluindo(false)
    if (!r.success) {
      alert(r.error || 'Erro ao excluir.')
      return
    }
    setConfirmarExclusao(null)
    router.refresh()
  }

  return (
    <main className="px-5 py-8 lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-[#0d9488]">Pedagógico</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-.03em] text-[#12232b]">Lançar notas</h1>
          <p className="mt-2 text-sm text-[#71838b]">Registre notas e faltas dos seus alunos.</p>
        </div>
        <button
          onClick={() => { limpar(); setNovaAberta(true) }}
          className="inline-flex items-center gap-2 rounded-lg bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f766e]"
        >
          <Plus className="size-4" /> Nova nota
        </button>
      </div>

      <div className="mt-8 rounded-xl border border-[#dce5e8] bg-white">
        <div className="border-b border-[#e5ecee] px-5 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setFiltroDisciplina('todas')} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${filtroDisciplina === 'todas' ? 'bg-[#ccfbf1] text-[#0f766e]' : 'text-[#6b7d86] hover:bg-[#f1f5f6]'}`}>Todas</button>
              {disciplinasDisponiveis.slice(0, 6).map((d) => (
                <button key={d} onClick={() => setFiltroDisciplina(d)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${filtroDisciplina === d ? 'bg-[#ccfbf1] text-[#0f766e]' : 'text-[#6b7d86] hover:bg-[#f1f5f6]'}`}>{d}</button>
              ))}
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 lg:w-64">
              <Search className="size-4 text-[#9aaab0]" />
              <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar aluno" className="w-full bg-transparent text-sm outline-none placeholder:text-[#a0afb4]" />
            </div>
          </div>
        </div>

        {notas.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-[#ccfbf1] text-[#0d9488]"><TrendingUp className="size-6" /></div>
            <h3 className="mt-4 text-base font-bold text-[#12232b]">Nenhuma nota lançada</h3>
            <p className="mt-1 text-sm text-[#82939a]">Clique em "Nova nota" para começar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e5ecee] bg-[#fafcfc]">
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Aluno</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Disciplina</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Período</th>
                  <th className="px-5 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Nota</th>
                  <th className="px-5 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Faltas</th>
                  <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-[#6b7d86]">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.slice(0, 50).map((n) => (
                  <tr key={n.id} className="border-b border-[#f0f4f5] transition hover:bg-[#fafcfc]">
                    <td className="px-5 py-3 text-sm font-semibold text-[#243942]">{n.aluno_nome}</td>
                    <td className="px-5 py-3 text-sm text-[#4d626c]">{n.disciplina}</td>
                    <td className="px-5 py-3 text-sm text-[#4d626c]">{PERIODOS.find((p) => p.key === n.periodo)?.label || n.periodo}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-sm font-bold ${corNota(n.nota)}`}>
                        {n.nota !== null ? n.nota.toFixed(1) : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center text-sm text-[#4d626c]">{n.faltas}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => abrirEdicao(n)} className="rounded-lg p-1.5 text-[#0d9488] hover:bg-[#ccfbf1]" title="Editar">
                          <Edit className="size-4" />
                        </button>
                        <button onClick={() => setConfirmarExclusao(n.id)} className="rounded-lg p-1.5 text-[#6b7d86] hover:bg-[#fee2e2] hover:text-[#dc2626]" title="Excluir">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL NOVA / EDITAR NOTA */}
      {novaAberta && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => !enviando && setNovaAberta(false)} />
          <aside className="relative z-10 flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-[#e5ecee] px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-[#12232b]">{editando ? 'Editar nota' : 'Lançar nota'}</h2>
                <p className="mt-0.5 text-xs text-[#82939a]">Se já existir, será atualizada</p>
              </div>
              <button onClick={() => setNovaAberta(false)} disabled={enviando} className="rounded-lg p-2 text-[#6b7d86] hover:bg-[#f1f5f6] disabled:opacity-50"><X className="size-5" /></button>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Aluno</label>
                  <select value={alunoIdx} onChange={(e) => setAlunoIdx(e.target.value)} disabled={!!editando} className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none focus:border-[#0d9488] disabled:bg-[#f0f4f5] disabled:text-[#82939a]">
                    <option value="">Selecione</option>
                    {alunos.map((a, i) => <option key={a.id} value={String(i)}>{a.nome} {a.serie ? `— ${a.serie}` : ''}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Disciplina</label>
                    <select value={disciplina} onChange={(e) => setDisciplina(e.target.value)} disabled={!!editando} className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none focus:border-[#0d9488] disabled:bg-[#f0f4f5] disabled:text-[#82939a]">
                      {disciplinasDisponiveis.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Período</label>
                    <select value={periodo} onChange={(e) => setPeriodo(e.target.value)} disabled={!!editando} className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none focus:border-[#0d9488] disabled:bg-[#f0f4f5] disabled:text-[#82939a]">
                      {PERIODOS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Nota (0 a 10)</label>
                    <input type="text" value={notaStr} onChange={(e) => setNotaStr(e.target.value)} placeholder="Ex: 8.5" className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Faltas</label>
                    <input type="number" value={faltas} onChange={(e) => setFaltas(e.target.value)} placeholder="0" className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]" />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Observação</label>
                  <textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Comentário (opcional)" rows={3} className="w-full resize-none rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]" />
                </div>
                {erro && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-600">{erro}</p>}
              </div>
            </div>

            <footer className="flex items-center justify-end gap-2 border-t border-[#e5ecee] bg-[#fafcfc] px-6 py-4">
              <button onClick={() => setNovaAberta(false)} disabled={enviando} className="rounded-lg border border-[#b8c9ce] bg-white px-4 py-2 text-sm font-semibold text-[#30454e] disabled:opacity-50">Cancelar</button>
              <button onClick={handleSalvar} disabled={enviando} className="inline-flex items-center gap-2 rounded-lg bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f766e] disabled:opacity-50">
                {enviando ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                {enviando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Salvar nota'}
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
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#fee2e2] text-[#dc2626]"><Trash2 className="size-5" /></div>
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
    </main>
  )
}