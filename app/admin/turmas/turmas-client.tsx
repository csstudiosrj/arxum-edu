'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Plus, Users, BookOpen, X, Loader2, Check, Search, 
  UserPlus, Trash2, ArrowRight, UserCheck
} from 'lucide-react'
import { AdminShell, SectionHeading, Panel } from '@/components/admin-shell'
import { 
  criarTurma, getAlunosDaTurma, getProfessoresDaTurma, 
  vincularAluno, vincularProfessor, desvincularProfessor, getTurmas,
  type Turma, type AlunoSimples, type ProfessorSimples, type ProfessorTurma 
} from './actions'

export function TurmasClient({ 
  turmasIniciais, alunosSemTurma, professores 
}: { 
  turmasIniciais: Turma[], alunosSemTurma: AlunoSimples[], professores: ProfessorSimples[] 
}) {
  const router = useRouter()
  const [turmas, setTurmas] = useState(turmasIniciais)
  const [novaTurmaAberta, setNovaTurmaAberta] = useState(false)
  const [turmaSelecionada, setTurmaSelecionada] = useState<Turma | null>(null)
  
  // Form Nova Turma
  const [nome, setNome] = useState('')
  const [serie, setSerie] = useState('')
  const [turno, setTurno] = useState('Manhã')
  const [anoLetivo, setAnoLetivo] = useState('2026')
  const [capacidade, setCapacidade] = useState('30')
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState('')

  // Detalhes da Turma
  const [abaDetalhe, setAbaDetalhe] = useState<'alunos' | 'professores'>('alunos')
  const [alunosDaTurma, setAlunosDaTurma] = useState<AlunoSimples[]>([])
  const [professoresDaTurma, setProfessoresDaTurma] = useState<ProfessorTurma[]>([])
  const [carregandoDetalhes, setCarregandoDetalhes] = useState(false)
  
  // Busca para adicionar aluno
  const [buscaAluno, setBuscaAluno] = useState('')
  
  // Form Vincular Professor
  const [professorId, setProfessorId] = useState('')
  const [disciplina, setDisciplina] = useState('')

  useEffect(() => {
    if (turmaSelecionada) {
      setCarregandoDetalhes(true)
      Promise.all([
        getAlunosDaTurma(turmaSelecionada.id),
        getProfessoresDaTurma(turmaSelecionada.id)
      ]).then(([alunos, profs]) => {
        setAlunosDaTurma(alunos)
        setProfessoresDaTurma(profs)
        setCarregandoDetalhes(false)
      })
    }
  }, [turmaSelecionada])

  async function handleCriarTurma() {
    if (!nome.trim() || !serie.trim()) return setErro('Preencha nome e série.')
    setProcessando(true)
    setErro('')
    const r = await criarTurma({ 
      nome, serie, turno, ano_letivo: anoLetivo, 
      capacidade_maxima: parseInt(capacidade) || 30 
    })
    setProcessando(false)
    if (r.success) {
      setNovaTurmaAberta(false)
      setNome(''); setSerie(''); setCapacidade('30')
      const novas = await getTurmas()
      setTurmas(novas)
      router.refresh()
    } else {
      setErro(r.error || 'Erro.')
    }
  }

  async function handleVincularAluno(alunoId: string) {
    if (!turmaSelecionada) return
    const r = await vincularAluno(alunoId, turmaSelecionada.id)
    if (r.success) {
      const novosAlunos = await getAlunosDaTurma(turmaSelecionada.id)
      setAlunosDaTurma(novosAlunos)
      router.refresh()
    } else alert(r.error)
  }

  async function handleRemoverAluno(alunoId: string) {
    if (!turmaSelecionada) return
    const r = await vincularAluno(alunoId, null)
    if (r.success) {
      const novosAlunos = await getAlunosDaTurma(turmaSelecionada.id)
      setAlunosDaTurma(novosAlunos)
      router.refresh()
    } else alert(r.error)
  }

  async function handleVincularProfessor() {
    if (!turmaSelecionada || !professorId || !disciplina.trim()) return alert('Preencha os dados.')
    const r = await vincularProfessor(turmaSelecionada.id, professorId, disciplina)
    if (r.success) {
      const novosProfs = await getProfessoresDaTurma(turmaSelecionada.id)
      setProfessoresDaTurma(novosProfs)
      setProfessorId(''); setDisciplina('')
      router.refresh()
    } else alert(r.error)
  }

  const alunosFiltrados = alunosSemTurma.filter(a => a.nome.toLowerCase().includes(buscaAluno.toLowerCase()))

  return (
    <AdminShell mode="school" active="Turmas">
      <main className="px-5 py-8 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Secretaria"
            title="Gestão de Turmas"
            description="Organize os alunos, turnos e professores por turma."
          />
          <button
            onClick={() => { setNome(''); setSerie(''); setErro(''); setNovaTurmaAberta(true) }}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:brightness-90"
            style={{ backgroundColor: 'var(--cor-primaria, #0d9488)' }}
          >
            <Plus className="size-4" /> Nova Turma
          </button>
        </div>

        {turmas.length === 0 ? (
          <div className="mt-8 rounded-xl border border-[#dce5e8] bg-white p-12 text-center">
            <Users className="mx-auto text-[#a0afb4]" size={32} />
            <h3 className="mt-4 text-lg font-bold text-[#12232b]">Nenhuma turma criada</h3>
            <p className="mt-1 text-sm text-[#82939a]">Crie a primeira turma para começar a organizar seus alunos.</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {turmas.map(t => (
              <Panel 
                key={t.id} 
                onClick={() => setTurmaSelecionada(t)}
                className="p-5 cursor-pointer hover:border-[var(--cor-primaria)] transition"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="grid size-10 place-items-center rounded-lg bg-[#f0fdfa] text-[#0d9488]"><BookOpen size={20}/></div>
                  <span className="text-[10px] font-bold text-[#82939a] bg-[#f0f4f5] px-2 py-1 rounded-full">{t.ano_letivo}</span>
                </div>
                <h3 className="font-bold text-[#12232b] text-lg">{t.nome}</h3>
                <p className="text-sm text-[#82939a] mt-1">{t.serie} · {t.turno}</p>
                
                <div className="mt-4 border-t border-[#e5ecee] pt-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#536871]">Ocupação</span>
                  <span className={`text-xs font-bold ${t.ocupacao_atual >= t.capacidade_maxima ? 'text-red-600' : 'text-[#0d9488]'}`}>
                    {t.ocupacao_atual} / {t.capacidade_maxima} vagas
                  </span>
                </div>
              </Panel>
            ))}
          </div>
        )}

        {/* MODAL CRIAR TURMA */}
        {novaTurmaAberta && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#e5ecee] bg-[#fafcfc] px-5 py-4">
                <h3 className="font-bold text-[#12232b]">Nova Turma</h3>
                <button onClick={() => setNovaTurmaAberta(false)} className="text-[#82939a] hover:text-[#12232b]"><X size={20}/></button>
              </div>
              <div className="p-5 space-y-4">
                {erro && <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{erro}</p>}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#536871]">Nome da Turma</label>
                  <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: 9º Ano A" className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[var(--cor-primaria)]" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#536871]">Série (Base)</label>
                    <input type="text" value={serie} onChange={e => setSerie(e.target.value)} placeholder="Ex: 9º Ano" className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[var(--cor-primaria)]" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#536871]">Capacidade (Vagas)</label>
                    <input type="number" value={capacidade} onChange={e => setCapacidade(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[var(--cor-primaria)]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#536871]">Turno</label>
                    <select value={turno} onChange={e => setTurno(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm outline-none">
                      <option value="Manhã">Manhã</option>
                      <option value="Tarde">Tarde</option>
                      <option value="Noite">Noite</option>
                      <option value="Integral">Integral</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#536871]">Ano Letivo</label>
                    <input type="text" value={anoLetivo} onChange={e => setAnoLetivo(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm outline-none" />
                  </div>
                </div>
              </div>
              <div className="p-5 border-t bg-[#fafcfc] flex justify-end gap-2">
                <button onClick={() => setNovaTurmaAberta(false)} className="px-4 py-2 text-sm text-[#536871]">Cancelar</button>
                <button onClick={handleCriarTurma} disabled={processando} className="px-4 py-2 text-sm font-semibold text-white bg-[var(--cor-primaria)] rounded disabled:opacity-50">{processando ? 'Criando...' : 'Criar Turma'}</button>
              </div>
            </div>
          </div>
        )}

        {/* DRAWER DETALHES DA TURMA */}
        {turmaSelecionada && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/40" onClick={() => setTurmaSelecionada(null)} />
            <aside className="relative z-10 w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col">
              <header className="flex items-center justify-between border-b border-[#e5ecee] bg-[#fafcfc] px-6 py-4">
                <div>
                  <h2 className="text-xl font-bold text-[#12232b]">{turmaSelecionada.nome}</h2>
                  <p className="text-xs text-[#82939a]">{turmaSelecionada.serie} · {turmaSelecionada.turno}</p>
                </div>
                <button onClick={() => setTurmaSelecionada(null)} className="p-2 text-[#82939a] hover:bg-[#f1f5f6] rounded-lg"><X size={20}/></button>
              </header>

              <div className="flex gap-1 border-b border-[#e5ecee] px-6 pt-2">
                <button onClick={() => setAbaDetalhe('alunos')} className={`px-4 py-2 text-sm font-semibold border-b-2 ${abaDetalhe === 'alunos' ? 'border-[var(--cor-primaria)] text-[var(--cor-primaria)]' : 'border-transparent text-[#6b7d86]'}`}>Alunos</button>
                <button onClick={() => setAbaDetalhe('professores')} className={`px-4 py-2 text-sm font-semibold border-b-2 ${abaDetalhe === 'professores' ? 'border-[var(--cor-primaria)] text-[var(--cor-primaria)]' : 'border-transparent text-[#6b7d86]'}`}>Professores</button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {carregandoDetalhes ? (
                  <div className="flex justify-center py-8"><Loader2 className="animate-spin text-[var(--cor-primaria)]" /></div>
                ) : abaDetalhe === 'alunos' ? (
                  <>
                    <div className="rounded-lg border border-[#e5ecee] bg-[#fafcfc] p-4">
                      <p className="text-xs font-bold text-[#536871] uppercase mb-2">Adicionar aluno à turma</p>
                      <div className="flex gap-2">
                        <div className="flex-1 flex items-center border rounded-lg bg-white px-3">
                          <Search size={16} className="text-[#82939a]" />
                          <input type="text" placeholder="Buscar aluno sem turma..." value={buscaAluno} onChange={e => setBuscaAluno(e.target.value)} className="w-full text-sm outline-none px-2 py-2" />
                        </div>
                      </div>
                      <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                        {alunosFiltrados.map(a => (
                          <div key={a.id} className="flex items-center justify-between bg-white border p-2 rounded text-sm">
                            <span>{a.nome} <span className="text-xs text-gray-400">({a.serie || 'S/ série'})</span></span>
                            <button onClick={() => handleVincularAluno(a.id)} className="text-[var(--cor-primaria)] hover:bg-[#f0fdfa] px-2 py-1 rounded font-semibold text-xs flex items-center gap-1"><UserPlus size={14}/> Adicionar</button>
                          </div>
                        ))}
                        {alunosFiltrados.length === 0 && buscaAluno && <p className="text-xs text-center py-2 text-gray-400">Nenhum aluno encontrado.</p>}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-[#12232b] mb-2">Alunos na Turma ({alunosDaTurma.length} / {turmaSelecionada.capacidade_maxima})</h3>
                      <div className="border rounded-lg divide-y">
                        {alunosDaTurma.map(a => (
                          <div key={a.id} className="flex items-center justify-between p-3 hover:bg-[#fafcfc]">
                            <div className="flex items-center gap-2">
                              <div className="size-7 rounded-full bg-[#ccfbf1] text-[#0f766e] flex items-center justify-center text-[10px] font-bold">{a.nome.substring(0,2).toUpperCase()}</div>
                              <span className="text-sm font-semibold">{a.nome}</span>
                            </div>
                            <button onClick={() => handleRemoverAluno(a.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded"><Trash2 size={16}/></button>
                          </div>
                        ))}
                        {alunosDaTurma.length === 0 && <p className="text-xs text-center py-4 text-gray-400">Nenhum aluno nesta turma ainda.</p>}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-lg border border-[#e5ecee] bg-[#fafcfc] p-4 space-y-3">
                      <p className="text-xs font-bold text-[#536871] uppercase">Vincular Professor / Disciplina</p>
                      <div className="grid grid-cols-2 gap-3">
                        <select value={professorId} onChange={e => setProfessorId(e.target.value)} className="rounded border px-3 py-2 text-sm outline-none">
                          <option value="">Selecione o Professor...</option>
                          {professores.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                        </select>
                        <input type="text" placeholder="Disciplina (ex: Matemática)" value={disciplina} onChange={e => setDisciplina(e.target.value)} className="rounded border px-3 py-2 text-sm outline-none" />
                      </div>
                      <button onClick={handleVincularProfessor} className="w-full bg-[var(--cor-primaria)] text-white py-2 rounded font-semibold text-sm">Vincular</button>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-[#12232b] mb-2">Professores da Turma</h3>
                      <div className="border rounded-lg divide-y">
                        {professoresDaTurma.map(p => (
                          <div key={p.id} className="flex items-center justify-between p-3">
                            <div>
                              <p className="text-sm font-semibold">{p.nome}</p>
                              <p className="text-xs text-[var(--cor-primaria)] font-medium">{p.disciplina}</p>
                            </div>
                            <button onClick={() => desvincularProfessor(p.id).then(() => getProfessoresDaTurma(turmaSelecionada.id).then(setProfessoresDaTurma))} className="text-red-500 hover:bg-red-50 p-1.5 rounded"><Trash2 size={16}/></button>
                          </div>
                        ))}
                        {professoresDaTurma.length === 0 && <p className="text-xs text-center py-4 text-gray-400">Nenhum professor vinculado.</p>}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </aside>
          </div>
        )}
      </main>
    </AdminShell>
  )
}