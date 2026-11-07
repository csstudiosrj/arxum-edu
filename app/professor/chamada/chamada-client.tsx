'use client'

import { useState, useEffect } from 'react'
import { Calendar, Check, X, Loader2, Save, UserCheck, UserX, Search } from 'lucide-react'
import { getChamadaDoDia, salvarChamada, type AlunoChamada, type RegistroChamada } from './actions'

const TODAS_DISCIPLINAS = [
  'Matemática', 'Português', 'Física', 'Química', 'Biologia', 'História',
  'Geografia', 'Inglês', 'Espanhol', 'Artes', 'Educação Física', 'Filosofia', 'Sociologia',
]

export function ChamadaClient({
  alunos,
  disciplinasSugeridas,
}: {
  alunos: AlunoChamada[]
  disciplinasSugeridas: string[]
}) {
  const hoje = new Date().toISOString().split('T')[0]
  
  const [disciplina, setDisciplina] = useState(disciplinasSugeridas[0] || 'Matemática')
  const [dataAula, setDataAula] = useState(hoje)
  const [busca, setBusca] = useState('')
  
  const [chamada, setChamada] = useState<Record<string, 'presente' | 'falta'>>({})
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)

  const disciplinasDisponiveis = disciplinasSugeridas.length > 0 ? disciplinasSugeridas : TODAS_DISCIPLINAS

  // Carrega a chamada sempre que mudar a disciplina ou a data
  useEffect(() => {
    let ativo = true
    setCarregando(true)
    getChamadaDoDia(disciplina, dataAula).then((mapa) => {
      if (!ativo) return
      // Inicializa todos como presente se não houver registro salvo
      const inicial: Record<string, 'presente' | 'falta'> = {}
      alunos.forEach((a) => {
        inicial[a.id] = mapa[a.id] || 'presente'
      })
      setChamada(inicial)
      setCarregando(false)
    })
    return () => { ativo = false }
  }, [disciplina, dataAula, alunos])

  function toggleStatus(alunoId: string) {
    setChamada((atual) => ({
      ...atual,
      [alunoId]: atual[alunoId] === 'presente' ? 'falta' : 'presente',
    }))
    setMensagem(null)
  }

  async function handleSalvar() {
    setSalvando(true)
    setMensagem(null)

    const registros: RegistroChamada[] = alunos.map((a) => ({
      aluno_id: a.id,
      aluno_nome: a.nome,
      status: chamada[a.id] || 'presente',
    }))

    const r = await salvarChamada(disciplina, dataAula, registros)
    setSalvando(false)

    if (r.success) {
      setMensagem({ tipo: 'ok', texto: 'Chamada salva com sucesso!' })
      setTimeout(() => setMensagem(null), 3000)
    } else {
      setMensagem({ tipo: 'erro', texto: r.error || 'Erro ao salvar.' })
    }
  }

  const alunosFiltrados = alunos.filter(a => a.nome.toLowerCase().includes(busca.toLowerCase()))
  const totalPresentes = Object.values(chamada).filter(s => s === 'presente').length
  const totalFaltas = Object.values(chamada).filter(s => s === 'falta').length

  return (
    <main className="px-5 py-8 lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em]" style={{ color: 'var(--cor-primaria, #0d9488)' }}>Pedagógico</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-.03em] text-[#12232b]">Diário de Classe</h1>
          <p className="mt-2 text-sm text-[#71838b]">Faça a chamada diária dos seus alunos.</p>
        </div>
        <button
          onClick={handleSalvar}
          disabled={salvando || carregando}
          className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-90 disabled:opacity-50"
          style={{ backgroundColor: 'var(--cor-primaria, #0d9488)' }}
        >
          {salvando ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {salvando ? 'Salvando...' : 'Salvar Chamada'}
        </button>
      </div>

      {mensagem && (
        <div className={`mt-6 rounded-lg border px-4 py-3 text-sm ${mensagem.tipo === 'ok' ? 'border-[#d1fae5] bg-[#d1fae5]/40 text-[#065f46]' : 'border-[#fee2e2] bg-[#fee2e2]/40 text-[#991b1b]'}`}>
          {mensagem.texto}
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Controles de disciplina e data */}
        <div className="col-span-full flex flex-wrap items-center gap-4 rounded-xl border border-[#dce5e8] bg-white p-4">
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-[#82939a]" />
            <input
              type="date"
              value={dataAula}
              onChange={(e) => setDataAula(e.target.value)}
              className="rounded-lg border border-[#d5e0e3] px-3 py-2 text-sm outline-none focus:border-[var(--cor-primaria)]"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#536871]">Disciplina:</span>
            <select
              value={disciplina}
              onChange={(e) => setDisciplina(e.target.value)}
              className="rounded-lg border border-[#d5e0e3] px-3 py-2 text-sm outline-none focus:border-[var(--cor-primaria)]"
            >
              {disciplinasDisponiveis.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="ml-auto flex items-center gap-4 text-sm font-semibold">
            <span className="text-[#065f46] bg-[#d1fae5] px-3 py-1 rounded-full">{totalPresentes} Presentes</span>
            <span className="text-[#991b1b] bg-[#fee2e2] px-3 py-1 rounded-full">{totalFaltas} Faltas</span>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-[#dce5e8] bg-white">
        <div className="border-b border-[#e5ecee] px-5 py-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-[#12232b]">Lista de Chamada</h2>
          <div className="flex items-center gap-2 rounded-lg border border-[#d5e0e3] bg-white px-3 py-1.5 w-64">
            <Search className="size-4 text-[#9aaab0]" />
            <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar aluno..." className="w-full bg-transparent text-sm outline-none placeholder:text-[#a0afb4]" />
          </div>
        </div>

        {carregando ? (
          <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin text-[var(--cor-primaria)]" /></div>
        ) : alunosFiltrados.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#82939a]">Nenhum aluno encontrado.</div>
        ) : (
          <div className="divide-y divide-[#f0f4f5]">
            {alunosFiltrados.map((aluno) => {
              const status = chamada[aluno.id] || 'presente'
              const isPresente = status === 'presente'
              return (
                <div key={aluno.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 transition hover:bg-[#fafcfc]">
                  <div className="flex items-center gap-3">
                    <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#ccfbf1] text-[#0f766e] text-xs font-bold">
                      {aluno.nome.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#243942]">{aluno.nome}</p>
                      <p className="text-xs text-[#82939a]">{aluno.serie || '—'} {aluno.turno ? `· ${aluno.turno}` : ''}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleStatus(aluno.id)}
                      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition border-2 ${
                        isPresente
                          ? 'border-[#065f46] bg-[#d1fae5] text-[#065f46]'
                          : 'border-[#991b1b] bg-[#fee2e2] text-[#991b1b]'
                      }`}
                    >
                      {isPresente ? <><UserCheck size={16}/> Presente</> : <><UserX size={16}/> Falta</>}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}