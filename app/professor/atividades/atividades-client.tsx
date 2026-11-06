'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, FileText, CheckCircle2, Clock, X, Loader2, ArrowLeft, MessageSquare, ExternalLink, Send } from 'lucide-react'
import { SectionHeading, Panel } from '@/components/admin-shell'
import { criarAtividadeProfessor, getEntregasDaAtividade, corrigirEntrega, type AtividadeProfessor, type EntregaAluno } from './actions'

export function AtividadesProfessorClient({ atividades, modulos }: { atividades: AtividadeProfessor[], modulos: any[] }) {
  const router = useRouter()
  const [novaAberta, setNovaAberta] = useState(false)
  const [atividadeSelecionada, setAtividadeSelecionada] = useState<AtividadeProfessor | null>(null)
  
  // Form nova atividade
  const [moduloId, setModuloId] = useState('')
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [prazo, setPrazo] = useState('')
  const [notaMax, setNotaMax] = useState('10')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  // Entregas
  const [entregas, setEntregas] = useState<EntregaAluno[]>([])
  const [carregandoEntregas, setCarregandoEntregas] = useState(false)
  
  // Correção
  const [corrigindo, setCorrigindo] = useState<EntregaAluno | null>(null)
  const [notaCorrecao, setNotaCorrecao] = useState('')
  const [feedback, setFeedback] = useState('')
  const [enviandoCorrecao, setEnviandoCorrecao] = useState(false)

  useEffect(() => {
    if (atividadeSelecionada) {
      setCarregandoEntregas(true)
      getEntregasDaAtividade(atividadeSelecionada.id).then(data => {
        setEntregas(data)
        setCarregandoEntregas(false)
      })
    }
  }, [atividadeSelecionada])

  async function handleCriar() {
    if (!titulo.trim()) return setErro('Informe o título.')
    if (!moduloId) return setErro('Selecione um módulo.')
    setSalvando(true)
    setErro('')
    const r = await criarAtividadeProfessor({
      modulo_id: moduloId,
      titulo,
      descricao,
      prazo_entrega: prazo,
      nota_maxima: parseFloat(notaMax)
    })
    setSalvando(false)
    if (!r.success) return setErro(r.error || 'Erro.')
    
    setNovaAberta(false)
    setTitulo(''); setDescricao(''); setPrazo(''); setModuloId('')
    router.refresh()
  }

  async function handleCorrigir() {
    if (!corrigindo) return
    const notaValor = parseFloat(notaCorrecao)
    if (isNaN(notaValor) || notaValor < 0 || notaValor > (atividadeSelecionada?.nota_maxima || 10)) {
      return alert(`A nota deve ser entre 0 e ${atividadeSelecionada?.nota_maxima || 10}.`)
    }
    
    setEnviandoCorrecao(true)
    const r = await corrigirEntrega(corrigindo.id, notaValor, feedback)
    setEnviandoCorrecao(false)
    
    if (r.success) {
      setCorrigindo(null)
      setNotaCorrecao('')
      setFeedback('')
      // Recarrega entregas
      const novas = await getEntregasDaAtividade(atividadeSelecionada!.id)
      setEntregas(novas)
    } else {
      alert(r.error)
    }
  }

  // ── VISÃO DE DETALHES DA ATIVIDADE ──
  if (atividadeSelecionada) {
    return (
      <main className="px-5 py-8 lg:px-8">
        <div className="mb-6">
          <button onClick={() => setAtividadeSelecionada(null)} className="text-sm font-semibold text-[#0d9488] hover:underline flex items-center gap-2 mb-4">
            <ArrowLeft className="size-4" /> Voltar para atividades
          </button>
          <SectionHeading eyebrow="Entregas" title={atividadeSelecionada.titulo} description={atividadeSelecionada.descricao || 'Sem descrição'} />
          <p className="text-sm font-semibold text-[#82939a] mt-2">Módulo: {atividadeSelecionada.modulo_titulo} • Nota Máxima: {atividadeSelecionada.nota_maxima}</p>
        </div>

        <Panel className="mt-8">
          <div className="border-b border-[#e5ecee] px-5 py-4">
            <h2 className="text-base font-bold text-[#12232b]">Alunos que enviaram</h2>
          </div>
          
          {carregandoEntregas ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#0d9488] size-6" /></div>
          ) : entregas.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-[#82939a]">Nenhum aluno enviou esta atividade ainda.</div>
          ) : (
            <div className="divide-y divide-[#f0f4f5]">
              {entregas.map(e => (
                <div key={e.id} className="px-5 py-4 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#243942]">{e.aluno_nome}</p>
                    <p className="text-xs text-[#82939a] mt-1 flex items-center gap-1">
                      <Clock className="size-3" /> Enviado em {e.entregue_em ? new Date(e.entregue_em).toLocaleString('pt-BR') : '—'}
                    </p>
                    {e.comentario_aluno && (
                      <p className="text-xs text-[#536871] mt-2 bg-[#f7fafb] p-2 rounded border border-[#e5ecee]"><MessageSquare className="inline size-3 mr-1"/>{e.comentario_aluno}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {e.arquivo_url && (
                      <a href={e.arquivo_url} target="_blank" rel="noopener noreferrer" className="text-xs border border-[#b8c9ce] text-[#30454e] px-3 py-1.5 rounded-lg hover:border-[#0d9488] flex items-center gap-1">
                        <ExternalLink className="size-3.5" /> Ver arquivo
                      </a>
                    )}
                    
                    {e.status === 'corrigida' ? (
                      <div className="text-right">
                        <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Corrigida</span>
                        <p className="text-sm font-bold text-[#0d9488] mt-1">Nota: {e.nota}</p>
                      </div>
                    ) : (
                      <button 
                        onClick={() => { setCorrigindo(e); setNotaCorrecao(e.nota?.toString() || ''); setFeedback(e.feedback_professor || '') }}
                        className="bg-[#0d9488] text-white text-xs px-4 py-2 rounded-lg font-bold hover:bg-[#0f766e]"
                      >
                        Corrigir
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* MODAL CORREÇÃO */}
        {corrigindo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white p-6 rounded-xl max-w-md w-full relative shadow-2xl">
              <button onClick={() => setCorrigindo(null)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"><X className="size-4" /></button>
              <h3 className="font-bold text-lg text-[#12232b] mb-1">Corrigir Atividade</h3>
              <p className="text-xs text-gray-500 mb-6">Aluno: <strong>{corrigindo.aluno_nome}</strong></p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold mb-1 block">Nota (0 a {atividadeSelecionada.nota_maxima})</label>
                  <input type="number" value={notaCorrecao} onChange={e => setNotaCorrecao(e.target.value)} className="w-full border p-2 rounded outline-none focus:border-[#0d9488]" />
                </div>
                <div>
                  <label className="text-xs font-bold mb-1 block">Feedback (Opcional)</label>
                  <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={3} placeholder="Comentário para o aluno..." className="w-full border p-2 rounded outline-none focus:border-[#0d9488] resize-none" />
                </div>
                <button onClick={handleCorrigir} disabled={enviandoCorrecao} className="w-full bg-[#0d9488] text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2 hover:bg-[#0f766e] mt-2 disabled:opacity-50">
                  {enviandoCorrecao ? <Loader2 className="animate-spin size-4" /> : <Send className="size-4" />}
                  {enviandoCorrecao ? 'Salvando...' : 'Salvar Nota'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    )
  }

  // ── VISÃO DE LISTA DE ATIVIDADES ──
  return (
    <main className="px-5 py-8 lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading eyebrow="Pedagógico" title="Atividades e Trabalhos" description="Crie tarefas e receba as entregas dos alunos." />
        <button onClick={() => setNovaAberta(true)} className="bg-[#0d9488] text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-[#0f766e]">
          <Plus className="size-4" /> Nova Atividade
        </button>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {atividades.map(a => (
          <div 
            key={a.id} 
            onClick={() => setAtividadeSelecionada(a)} 
            className="cursor-pointer rounded-xl border border-[#dce5e8] bg-white p-5 flex flex-col justify-between transition hover:border-[#0d9488]"
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="grid size-10 place-items-center rounded-lg bg-[#f0fdfa] text-[#0d9488]"><FileText className="size-5" /></div>
                <span className="text-[10px] font-bold text-[#82939a] bg-[#f0f4f5] px-2 py-1 rounded-full uppercase">{a.modulo_titulo}</span>
              </div>
              <h3 className="font-bold text-[#12232b]">{a.titulo}</h3>
              <p className="text-xs text-[#82939a] mt-1 line-clamp-2">{a.descricao || 'Sem descrição.'}</p>
            </div>
            
            <div className="mt-6 border-t border-[#e5ecee] pt-4 flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1 text-[#0d9488]"><CheckCircle2 className="size-4" /> {a.total_entregas} entregas</span>
              <span className="text-[#dc2626]">Prazo: {a.prazo_entrega ? new Date(a.prazo_entrega).toLocaleDateString('pt-BR') : 'Livre'}</span>
            </div>
          </div>
        ))}
        {atividades.length === 0 && (
          <div className="col-span-full py-12 text-center text-[#82939a] bg-white border border-[#dce5e8] rounded-xl">
            Nenhuma atividade criada ainda.
          </div>
        )}
      </div>

      {/* MODAL CRIAR ATIVIDADE */}
      {novaAberta && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <aside className="bg-white w-full max-w-md h-full p-6 relative shadow-2xl overflow-y-auto">
            <button onClick={() => setNovaAberta(false)} className="absolute right-4 top-4 text-gray-500 hover:text-gray-800"><X /></button>
            <h2 className="text-xl font-bold mb-6">Nova Atividade</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold mb-1 block">Módulo</label>
                <select value={moduloId} onChange={e => setModuloId(e.target.value)} className="w-full border p-2 rounded outline-none focus:border-[#0d9488]">
                  <option value="">Selecione o módulo...</option>
                  {modulos.map(m => <option key={m.id} value={m.id}>{m.titulo} ({m.disciplina})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold mb-1 block">Título</label>
                <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Trabalho de Frações" className="w-full border p-2 rounded outline-none focus:border-[#0d9488]" />
              </div>
              <div>
                <label className="text-xs font-bold mb-1 block">Descrição</label>
                <textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={3} className="w-full border p-2 rounded outline-none focus:border-[#0d9488] resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold mb-1 block">Prazo de Entrega</label>
                  <input type="date" value={prazo} onChange={e => setPrazo(e.target.value)} className="w-full border p-2 rounded outline-none focus:border-[#0d9488]" />
                </div>
                <div>
                  <label className="text-xs font-bold mb-1 block">Nota Máxima</label>
                  <input type="number" value={notaMax} onChange={e => setNotaMax(e.target.value)} className="w-full border p-2 rounded outline-none focus:border-[#0d9488]" />
                </div>
              </div>

              {erro && <p className="text-red-500 text-sm">{erro}</p>}
              
              <button onClick={handleCriar} disabled={salvando} className="w-full bg-[#0d9488] text-white py-3 rounded-lg font-bold flex justify-center mt-4 hover:bg-[#0f766e] disabled:opacity-50">
                {salvando ? <Loader2 className="animate-spin" /> : 'Criar Atividade'}
              </button>
            </div>
          </aside>
        </div>
      )}
    </main>
  )
}
