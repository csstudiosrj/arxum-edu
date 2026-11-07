'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, Plus, Save, CheckCircle2, AlertCircle, 
  Calculator, X, Loader2, Send, Edit2
} from 'lucide-react'
import { SectionHeading, Panel } from '@/components/admin-shell'
import { 
  criarAvaliacao, salvarNotaParcial, lancarNoDiarioOficial,
  type DadosCaderno, type Avaliacao 
} from './actions'

const PERIODOS = [
  { key: '1_bimestre', label: '1º Bimestre' },
  { key: '2_bimestre', label: '2º Bimestre' },
  { key: '3_bimestre', label: '3º Bimestre' },
  { key: '4_bimestre', label: '4º Bimestre' },
  { key: '1_semestre', label: '1º Semestre' },
  { key: '2_semestre', label: '2º Semestre' },
]

export function CadernoGridClient({
  turmaId,
  disciplina,
  periodoAtual,
  dados,
  emails
}: {
  turmaId: string
  disciplina: string
  periodoAtual: string
  dados: DadosCaderno
  emails: Record<string, string>
}) {
  const router = useRouter()
  
  // Estado local para as notas editáveis e avaliações
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>(dados.avaliacoes)
  const [notas, setNotas] = useState<Record<string, Record<string, number | null>>>(() => {
    const map: Record<string, Record<string, number | null>> = {}
    dados.alunos.forEach(a => {
      map[a.id] = {}
      dados.avaliacoes.forEach(av => { map[a.id][av.id] = null })
    })
    dados.notas.forEach(n => {
      if (map[n.aluno_id]) map[n.aluno_id][n.avaliacao_id] = n.nota
    })
    return map
  })

  // Estado para os ajustes manuais e justificativas
  const [ajustes, setAjustes] = useState<Record<string, { valor: number | null, justificativa: string }>>(() => {
    const map: Record<string, { valor: number | null, justificativa: string }> = {}
    dados.alunos.forEach(a => {
      const oficial = dados.notasOficiais[a.id]
      map[a.id] = { 
        valor: oficial?.ajuste || null, 
        justificativa: oficial?.justificativa || '' 
      }
    })
    return map
  })

  const [novaAvaliacaoAberta, setNovaAvaliacaoAberta] = useState(false)
  const [tituloNova, setTituloNova] = useState('')
  const [pesoNova, setPesoNova] = useState('1')
  const [maxNova, setMaxNova] = useState('10')
  
  const [salvando, setSalvando] = useState(false)
  const [enviandoDiario, setEnviandoDiario] = useState(false)
  const [mensagem, setMensagem] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)
  const [ajusteAberto, setAjusteAberto] = useState<string | null>(null)

  // Calcula a média de um aluno específico
  function calcularMedia(alunoId: string): number {
    let somaNotasPonderadas = 0
    let somaPesos = 0

    avaliacoes.forEach(av => {
      const notaAluno = notas[alunoId]?.[av.id]
      if (notaAluno !== null && notaAluno !== undefined) {
        somaNotasPonderadas += notaAluno * av.peso
        somaPesos += av.peso
      }
    })

    if (somaPesos === 0) return 0
    return Number((somaNotasPonderadas / somaPesos).toFixed(1))
  }

  // Calcula a nota final do aluno (com ajuste, se houver)
  function calcularNotaFinal(alunoId: string): number {
    const media = calcularMedia(alunoId)
    const ajuste = ajustes[alunoId]?.valor || 0
    let final = media + ajuste
    if (final > 10) final = 10
    if (final < 0) final = 0
    return Number(final.toFixed(1))
  }

  async function handleSalvarNota(alunoId: string, avaliacaoId: string, valor: string) {
    const notaNum = valor === '' ? null : parseFloat(valor.replace(',', '.'))
    
    // Atualiza o estado local imediatamente para o cálculo ser em tempo real
    setNotas(prev => ({
      ...prev,
      [alunoId]: { ...prev[alunoId], [avaliacaoId]: notaNum }
    }))

    // Salva no banco em background
    await salvarNotaParcial(avaliacaoId, alunoId, notaNum)
  }

  async function handleCriarAvaliacao() {
    if (!tituloNova.trim()) return setMensagem({ tipo: 'erro', texto: 'Informe o título.' })
    
    setSalvando(true)
    const r = await criarAvaliacao({
      turmaId, disciplina, periodo: periodoAtual, 
      titulo: tituloNova, 
      peso: parseFloat(pesoNova) || 1, 
      nota_maxima: parseFloat(maxNova) || 10
    })
    setSalvando(false)
    
    if (r.success) {
      setNovaAvaliacaoAberta(false)
      setTituloNova(''); setPesoNova('1'); setMaxNova('10')
      router.refresh()
    } else {
      setMensagem({ tipo: 'erro', texto: r.error || 'Erro.' })
    }
  }

  async function handleEnviarDiario() {
    if (!confirm('Deseja realmente enviar as notas finais para o Diário Oficial? A coordenação e os pais terão acesso imediato.')) return
    
    setEnviandoDiario(true)
    setMensagem(null)

    const payload = dados.alunos.map(a => {
      const media = calcularMedia(a.id)
      const final = calcularNotaFinal(a.id)
      const ajuste = final - media
      return {
        aluno_id: a.id,
        aluno_nome: a.nome,
        responsavel_email: emails[a.id] || '',
        nota_calculada: media,
        nota_final: final,
        ajuste_manual: ajuste,
        justificativa: ajustes[a.id]?.justificativa || ''
      }
    })

    const r = await lancarNoDiarioOficial({
      turmaId, disciplina, periodo: periodoAtual, notas: payload
    })
    setEnviandoDiario(false)

    if (r.success) {
      setMensagem({ tipo: 'ok', texto: 'Notas enviadas para o Diário Oficial com sucesso!' })
    } else {
      setMensagem({ tipo: 'erro', texto: r.error || 'Erro ao enviar.' })
    }
  }

  return (
    <main className="px-5 py-8 lg:px-8">
      {/* Header da Tela */}
      <div className="mb-6">
        <Link href="/professor/caderno" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--cor-primaria)] hover:underline mb-4">
          <ArrowLeft className="size-4" /> Voltar para minhas turmas
        </Link>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <SectionHeading 
            eyebrow={`${dados.turmaNome} · ${disciplina}`} 
            title="Caderno de Notas" 
            description="Crie avaliações, lance notas e envie o resultado final." 
          />
          
          <div className="flex flex-wrap items-center gap-3">
            <select 
              value={periodoAtual} 
              onChange={e => router.push(`/professor/caderno/${turmaId}/${encodeURIComponent(disciplina)}?periodo=${e.target.value}`)}
              className="rounded-lg border border-[#d5e0e3] px-3 py-2 text-sm font-semibold outline-none focus:border-[var(--cor-primaria)]"
            >
              {PERIODOS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
            
            <button 
              onClick={() => setNovaAvaliacaoAberta(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-[#b8c9ce] bg-white px-4 py-2 text-sm font-semibold text-[#30454e] hover:border-[var(--cor-primaria)]"
            >
              <Plus className="size-4" /> Nova Avaliação
            </button>

            <button 
              onClick={handleEnviarDiario}
              disabled={enviandoDiario || avaliacoes.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--cor-primaria)] px-4 py-2 text-sm font-bold text-white hover:brightness-90 disabled:opacity-50"
            >
              {enviandoDiario ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              {enviandoDiario ? 'Enviando...' : 'Enviar p/ Diário Oficial'}
            </button>
          </div>
        </div>
      </div>

      {mensagem && (
        <div className={`mb-6 rounded-lg p-3 text-sm flex items-center gap-2 ${mensagem.tipo === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {mensagem.tipo === 'ok' ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>} {mensagem.texto}
        </div>
      )}

      {/* Planilha de Notas */}
      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#fafcfc] border-b border-[#e5ecee]">
                <th className="p-4 text-xs font-bold text-[#6b7d86] uppercase tracking-wider sticky left-0 bg-[#fafcfc] min-w-[200px]">Aluno</th>
                
                {avaliacoes.map(av => (
                  <th key={av.id} className="p-4 text-center border-l border-[#e5ecee] min-w-[120px]">
                    <p className="text-xs font-bold text-[#243942] uppercase">{av.titulo}</p>
                    <p className="text-[10px] text-[#82939a] mt-0.5">Peso: {av.peso} · Máx: {av.nota_maxima}</p>
                  </th>
                ))}
                
                <th className="p-4 text-center border-l border-[#e5ecee] bg-[#f0fdfa] min-w-[100px]">
                  <p className="text-xs font-bold text-[#0f766e] uppercase flex items-center justify-center gap-1"><Calculator size={12}/> Média</p>
                </th>
                
                <th className="p-4 text-center border-l border-[#e5ecee] min-w-[100px]">
                  <p className="text-xs font-bold text-[#6b7d86] uppercase">Ajuste</p>
                </th>
                
                <th className="p-4 text-center border-l border-[#e5ecee] bg-[#fef3c7] min-w-[100px]">
                  <p className="text-xs font-bold text-[#92400e] uppercase">Nota Final</p>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f5]">
              {dados.alunos.map(aluno => {
                const media = calcularMedia(aluno.id)
                const notaFinal = calcularNotaFinal(aluno.id)
                const ajusteValor = ajustes[aluno.id]?.valor || 0
                
                return (
                  <tr key={aluno.id} className="hover:bg-[#fafcfc] transition">
                    <td className="p-4 text-sm font-semibold text-[#243942] sticky left-0 bg-white">{aluno.nome}</td>
                    
                    {avaliacoes.map(av => (
                      <td key={av.id} className="p-2 border-l border-[#e5ecee] text-center">
                        <input 
                          type="text" 
                          defaultValue={notas[aluno.id]?.[av.id] ?? ''}
                          onBlur={(e) => handleSalvarNota(aluno.id, av.id, e.target.value)}
                          className="w-16 rounded border border-[#d5e0e3] px-2 py-1.5 text-center text-sm font-semibold outline-none focus:border-[var(--cor-primaria)] focus:ring-1 focus:ring-[var(--cor-primaria)]"
                          placeholder="-"
                        />
                      </td>
                    ))}
                    
                    <td className="p-4 border-l border-[#e5ecee] text-center bg-[#f0fdfa] font-bold text-[#0f766e]">
                      {media.toFixed(1)}
                    </td>
                    
                    <td className="p-2 border-l border-[#e5ecee] text-center">
                      <button 
                        onClick={() => setAjusteAberto(aluno.id)}
                        className={`w-full rounded border px-2 py-1.5 text-sm font-semibold transition ${ajusteValor !== 0 ? 'border-[var(--cor-primaria)] text-[var(--cor-primaria)] bg-[#f0fdfa]' : 'border-[#d5e0e3] text-[#6b7d86] hover:border-[var(--cor-primaria)]'}`}
                      >
                        {ajusteValor > 0 ? `+${ajusteValor}` : ajusteValor === 0 ? '0.0' : ajusteValor}
                      </button>
                    </td>
                    
                    <td className="p-4 border-l border-[#e5ecee] text-center bg-[#fef3c7] font-bold text-[#92400e] text-lg">
                      {notaFinal.toFixed(1)}
                    </td>
                  </tr>
                )
              })}
              {dados.alunos.length === 0 && (
                <tr>
                  <td colSpan={avaliacoes.length + 4} className="p-8 text-center text-sm text-[#82939a]">
                    Nenhum aluno vinculado a esta turma ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* MODAL NOVA AVALIAÇÃO */}
      {novaAvaliacaoAberta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-[#12232b]">Nova Avaliação</h3>
              <button onClick={() => setNovaAvaliacaoAberta(false)}><X size={20}/></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold mb-1 block">Título</label>
                <input type="text" value={tituloNova} onChange={e => setTituloNova(e.target.value)} placeholder="Ex: Prova Bimestral" className="w-full rounded border p-2 text-sm outline-none focus:border-[var(--cor-primaria)]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold mb-1 block">Peso</label>
                  <input type="number" value={pesoNova} onChange={e => setPesoNova(e.target.value)} className="w-full rounded border p-2 text-sm outline-none focus:border-[var(--cor-primaria)]" />
                </div>
                <div>
                  <label className="text-xs font-bold mb-1 block">Nota Máxima</label>
                  <input type="number" value={maxNova} onChange={e => setMaxNova(e.target.value)} className="w-full rounded border p-2 text-sm outline-none focus:border-[var(--cor-primaria)]" />
                </div>
              </div>
              <button onClick={handleCriarAvaliacao} disabled={salvando} className="w-full bg-[var(--cor-primaria)] text-white py-2.5 rounded font-bold disabled:opacity-50">
                {salvando ? 'Criando...' : 'Criar Avaliação'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AJUSTE MANUAL */}
      {ajusteAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-lg text-[#12232b]">Ajuste Manual</h3>
                <p className="text-xs text-[#82939a]">Aluno: {dados.alunos.find(a => a.id === ajusteAberto)?.nome}</p>
              </div>
              <button onClick={() => setAjusteAberto(null)}><X size={20}/></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold mb-1 block">Valor do Ajuste (+ ou -)</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={ajustes[ajusteAberto]?.valor || ''} 
                  onChange={e => setAjustes({ ...ajustes, [ajusteAberto]: { ...ajustes[ajusteAberto], valor: parseFloat(e.target.value) || null } })} 
                  placeholder="Ex: 0.5 ou -0.5" 
                  className="w-full rounded border p-2 text-sm outline-none focus:border-[var(--cor-primaria)]" 
                />
              </div>
              <div>
                <label className="text-xs font-bold mb-1 block">Justificativa (Obrigatória se ajuste ≠ 0)</label>
                <textarea 
                  value={ajustes[ajusteAberto]?.justificativa || ''} 
                  onChange={e => setAjustes({ ...ajustes, [ajusteAberto]: { ...ajustes[ajusteAberto], justificativa: e.target.value } })} 
                  rows={3} 
                  placeholder="Ex: Participação em projeto extra-classe" 
                  className="w-full rounded border p-2 text-sm outline-none focus:border-[var(--cor-primaria)] resize-none" 
                />
              </div>
              <button onClick={() => setAjusteAberto(null)} className="w-full bg-[var(--cor-primaria)] text-white py-2.5 rounded font-bold">
                Confirmar Ajuste
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}