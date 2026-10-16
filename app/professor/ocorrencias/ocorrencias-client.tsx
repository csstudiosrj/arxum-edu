'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, AlertCircle, BookOpen, Heart, Award, FileQuestion, ShieldAlert, Check, X, Loader2 } from 'lucide-react'
import { criarOcorrenciaProfessor, type AlunoResumo, type OcorrenciaProfessor } from '../actions'

type IconeComponente = typeof AlertCircle

const TIPOS: Array<{ key: string; label: string; icone: IconeComponente; cor: string }> = [
  { key: 'pedagogica', label: 'Pedagógica', icone: BookOpen, cor: '#3b82f6' },
  { key: 'disciplinar', label: 'Disciplinar', icone: ShieldAlert, cor: '#dc2626' },
  { key: 'saude', label: 'Saúde', icone: Heart, cor: '#d97706' },
  { key: 'elogio', label: 'Elogio', icone: Award, cor: '#0d9488' },
  { key: 'outro', label: 'Outro', icone: FileQuestion, cor: '#6b7d86' },
]

const GRAVIDADES = [
  { key: 'baixa', label: 'Baixa', style: 'bg-[#e5ecee] text-[#5e7a94]' },
  { key: 'media', label: 'Média', style: 'bg-[#fef3c7] text-[#92400e]' },
  { key: 'alta', label: 'Alta', style: 'bg-[#fee2e2] text-[#991b1b]' },
]

function tipoInfo(k: string) { return TIPOS.find((t) => t.key === k) || TIPOS[4] }
function gravInfo(k: string) { return GRAVIDADES.find((g) => g.key === k) || GRAVIDADES[0] }

function formatarData(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  } catch { return '—' }
}

export function OcorrenciasProfessorClient({
  alunos,
  ocorrencias,
  professorNome,
}: {
  alunos: AlunoResumo[]
  ocorrencias: OcorrenciaProfessor[]
  professorNome: string
}) {
  const router = useRouter()
  const [busca, setBusca] = useState('')
  const [minhasApenas, setMinhasApenas] = useState(false)
  const [novaAberta, setNovaAberta] = useState(false)

  const [alunoIdx, setAlunoIdx] = useState('')
  const [tipo, setTipo] = useState('pedagogica')
  const [gravidade, setGravidade] = useState('baixa')
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [providencias, setProvidencias] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  const filtradas = ocorrencias.filter((o) => {
    if (minhasApenas && o.autor_nome !== professorNome) return false
    const termo = busca.toLowerCase()
    return busca === '' || o.aluno_nome.toLowerCase().includes(termo) || o.titulo.toLowerCase().includes(termo)
  })

  function limpar() { setAlunoIdx(''); setTipo('pedagogica'); setGravidade('baixa'); setTitulo(''); setDescricao(''); setProvidencias(''); setErro('') }

  async function handleCriar() {
    if (!alunoIdx) return setErro('Selecione o aluno.')
    if (!titulo.trim()) return setErro('Informe o título.')
    if (!descricao.trim()) return setErro('Informe a descrição.')

    const aluno = alunos[parseInt(alunoIdx, 10)]
    if (!aluno) return setErro('Aluno inválido.')

    setEnviando(true)
    setErro('')
    const r = await criarOcorrenciaProfessor({
      aluno_id: aluno.id,
      aluno_nome: aluno.nome,
      responsavel_email: aluno.responsavel_email,
      tipo,
      gravidade,
      titulo,
      descricao,
      providencias,
    })
    setEnviando(false)

    if (!r.success) return setErro(r.error || 'Erro.')
    limpar()
    setNovaAberta(false)
    router.refresh()
  }

  return (
    <main className="px-5 py-8 lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-[#0d9488]">Pedagógico</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-.03em] text-[#12232b]">Ocorrências</h1>
          <p className="mt-2 text-sm text-[#71838b]">Registre ocorrências pedagógicas, disciplinares e de saúde.</p>
        </div>
        <button
          onClick={() => { limpar(); setNovaAberta(true) }}
          className="inline-flex items-center gap-2 rounded-lg bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f766e]"
        >
          <Plus className="size-4" /> Nova ocorrência
        </button>
      </div>

      <div className="mt-8 rounded-xl border border-[#dce5e8] bg-white">
        <div className="border-b border-[#e5ecee] px-5 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setMinhasApenas(false)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${!minhasApenas ? 'bg-[#ccfbf1] text-[#0f766e]' : 'text-[#6b7d86] hover:bg-[#f1f5f6]'}`}>Todas</button>
              <button onClick={() => setMinhasApenas(true)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${minhasApenas ? 'bg-[#ccfbf1] text-[#0f766e]' : 'text-[#6b7d86] hover:bg-[#f1f5f6]'}`}>Minhas</button>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 lg:w-64">
              <Search className="size-4 text-[#9aaab0]" />
              <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar aluno ou título" className="w-full bg-transparent text-sm outline-none placeholder:text-[#a0afb4]" />
            </div>
          </div>
        </div>

        {filtradas.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-[#ccfbf1] text-[#0d9488]"><AlertCircle className="size-6" /></div>
            <h3 className="mt-4 text-base font-bold text-[#12232b]">Nenhuma ocorrência</h3>
            <p className="mt-1 text-sm text-[#82939a]">Registre a primeira ocorrência clicando em "Nova ocorrência".</p>
          </div>
        ) : (
          <div className="divide-y divide-[#f0f4f5]">
            {filtradas.map((o) => {
              const info = tipoInfo(o.tipo)
              const grav = gravInfo(o.gravidade)
              const Icone = info.icone
              return (
                <div key={o.id} className="flex items-start gap-4 px-5 py-4">
                  <div className="grid size-10 shrink-0 place-items-center rounded-lg" style={{ backgroundColor: `${info.cor}15`, color: info.cor }}>
                    <Icone className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-[#243942]">{o.titulo}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${grav.style}`}>{grav.label}</span>
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${info.cor}15`, color: info.cor }}>{info.label}</span>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-[#536871]">{o.aluno_nome}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#82939a]">{o.descricao}</p>
                    <p className="mt-1 text-[11px] text-[#a0afb4]">Por {o.autor_nome} · {formatarData(o.criado_em)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {novaAberta && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => !enviando && setNovaAberta(false)} />
          <aside className="relative z-10 flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-[#e5ecee] px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-[#12232b]">Nova ocorrência</h2>
                <p className="mt-0.5 text-xs text-[#82939a]">O responsável verá no portal</p>
              </div>
              <button onClick={() => setNovaAberta(false)} disabled={enviando} className="rounded-lg p-2 text-[#6b7d86] hover:bg-[#f1f5f6] disabled:opacity-50"><X className="size-5" /></button>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Aluno</label>
                  <select value={alunoIdx} onChange={(e) => setAlunoIdx(e.target.value)} className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none focus:border-[#0d9488]">
                    <option value="">Selecione</option>
                    {alunos.map((a, i) => <option key={a.id} value={String(i)}>{a.nome} {a.serie ? `— ${a.serie}` : ''}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Tipo</label>
                  <div className="grid grid-cols-3 gap-2">
                    {TIPOS.map((t) => {
                      const Icone = t.icone
                      return (
                        <button key={t.key} type="button" onClick={() => setTipo(t.key)} className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-semibold transition ${tipo === t.key ? 'border-[#0d9488] bg-[#ccfbf1] text-[#0f766e]' : 'border-[#d5e0e3] bg-white text-[#6b7d86] hover:border-[#0d9488]'}`}>
                          <Icone className="size-3.5" />{t.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Gravidade</label>
                  <div className="grid grid-cols-3 gap-2">
                    {GRAVIDADES.map((g) => (
                      <button key={g.key} type="button" onClick={() => setGravidade(g.key)} className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${gravidade === g.key ? 'border-[#0d9488] bg-[#ccfbf1] text-[#0f766e]' : 'border-[#d5e0e3] bg-white text-[#6b7d86] hover:border-[#0d9488]'}`}>
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Título</label>
                  <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Conversa durante a aula" className="w-full rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Descrição</label>
                  <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={4} placeholder="O que aconteceu" className="w-full resize-none rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#536871]">Providências (opcional)</label>
                  <textarea value={providencias} onChange={(e) => setProvidencias(e.target.value)} rows={3} placeholder="O que foi feito" className="w-full resize-none rounded-lg border border-[#d5e0e3] bg-white px-3 py-2 text-sm text-[#243942] outline-none placeholder:text-[#a0afb4] focus:border-[#0d9488]" />
                </div>
                {erro && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-600">{erro}</p>}
              </div>
            </div>

            <footer className="flex items-center justify-end gap-2 border-t border-[#e5ecee] bg-[#fafcfc] px-6 py-4">
              <button onClick={() => setNovaAberta(false)} disabled={enviando} className="rounded-lg border border-[#b8c9ce] bg-white px-4 py-2 text-sm font-semibold text-[#30454e] disabled:opacity-50">Cancelar</button>
              <button onClick={handleCriar} disabled={enviando} className="inline-flex items-center gap-2 rounded-lg bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f766e] disabled:opacity-50">
                {enviando ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                {enviando ? 'Salvando...' : 'Registrar'}
              </button>
            </footer>
          </aside>
        </div>
      )}
    </main>
  )
}