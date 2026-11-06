'use client'

import { useState } from 'react'
import { FileText, CheckCircle2, Clock, X, Loader2, ExternalLink, AlertCircle } from 'lucide-react'
import { SectionHeading, Panel } from '@/components/admin-shell'
import { enviarAtividade, type AtividadeAluno } from './actions'

export function AtividadesAlunoClient({ atividades }: { atividades: AtividadeAluno[] }) {
  const [atividadeSelecionada, setAtividadeSelecionada] = useState<AtividadeAluno | null>(null)
  
  // Form envio
  const [link, setLink] = useState('')
  const [comentario, setComentario] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  function abrirEnvio(a: AtividadeAluno) {
    setAtividadeSelecionada(a)
    setLink(a.arquivo_url || '')
    setComentario(a.comentario_aluno || '')
    setErro('')
  }

  async function handleEnviar() {
    if (!atividadeSelecionada) return
    if (!link.trim()) return setErro('Informe o link do seu arquivo (Google Drive, OneDrive, etc).')

    setEnviando(true)
    setErro('')
    const r = await enviarAtividade(atividadeSelecionada.id, link, comentario)
    setEnviando(false)

    if (!r.success) return setErro(r.error || 'Erro ao enviar.')
    
    setAtividadeSelecionada(null)
    window.location.reload()
  }

  return (
    <main className="px-5 py-8 lg:px-8">
      <SectionHeading 
        eyebrow="Pedagógico" 
        title="Minhas Atividades" 
        description="Envie seus trabalhos e acompanhe as notas." 
      />

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {atividades.map(a => {
          const isAtrasada = a.prazo_entrega && new Date(a.prazo_entrega) < new Date() && a.status_entrega === 'pendente'
          
          return (
            <Panel key={a.id} className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className={`grid size-10 place-items-center rounded-lg ${a.status_entrega === 'corrigida' ? 'bg-green-100 text-green-700' : 'bg-[#f0fdfa] text-[#0d9488]'}`}>
                    <FileText className="size-5" />
                  </div>
                  {a.status_entrega === 'pendente' && (
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${isAtrasada ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {isAtrasada ? 'Atrasada' : 'Pendente'}
                    </span>
                  )}
                  {a.status_entrega === 'entregue' && (
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full uppercase bg-blue-100 text-blue-700">Aguardando Nota</span>
                  )}
                  {a.status_entrega === 'corrigida' && (
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full uppercase bg-green-100 text-green-700">Corrigida</span>
                  )}
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#82939a]">{a.disciplina} · {a.modulo_titulo}</p>
                <h3 className="font-bold text-[#12232b] mt-1">{a.titulo}</h3>
                <p className="text-xs text-[#82939a] mt-1 line-clamp-2">{a.descricao || 'Sem instruções adicionais.'}</p>
              </div>

              <div className="mt-6 border-t border-[#e5ecee] pt-4">
                <div className="flex items-center justify-between text-xs font-semibold mb-4">
                  <span className="flex items-center gap-1 text-[#0d9488]"><Clock className="size-3.5" /> Prazo: {a.prazo_entrega ? new Date(a.prazo_entrega).toLocaleDateString('pt-BR') : 'Livre'}</span>
                  <span className="text-[#12232b]">Nota Máx: {a.nota_maxima}</span>
                </div>

                {a.status_entrega === 'corrigida' ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-green-800">Sua Nota</span>
                      <span className="text-lg font-bold text-green-700">{a.nota}</span>
                    </div>
                    {a.feedback_professor && (
                      <p className="text-xs text-green-700 leading-relaxed"><strong>Feedback:</strong> {a.feedback_professor}</p>
                    )}
                  </div>
                ) : a.status_entrega === 'entregue' ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                    <p className="text-xs font-semibold text-blue-700 mb-2">Trabalho enviado!</p>
                    <a href={a.arquivo_url!} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1">
                      <ExternalLink className="size-3" /> Ver meu envio
                    </a>
                  </div>
                ) : (
                  <button 
                    onClick={() => abrirEnvio(a)} 
                    className={`w-full py-2 rounded-lg text-sm font-bold transition ${isAtrasada ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' : 'bg-[#0d9488] text-white hover:bg-[#0f766e]'}`}
                  >
                    {isAtrasada ? 'Enviar com Atraso' : 'Enviar Atividade'}
                  </button>
                )}
              </div>
            </Panel>
          )
        })}

        {atividades.length === 0 && (
          <div className="col-span-full py-12 text-center text-[#82939a] bg-white border border-[#dce5e8] rounded-xl">
            Nenhuma atividade solicitada ainda.
          </div>
        )}
      </div>

      {/* MODAL ENVIO */}
      {atividadeSelecionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white p-6 rounded-xl max-w-md w-full relative shadow-2xl">
            <button onClick={() => setAtividadeSelecionada(null)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"><X className="size-4" /></button>
            <h3 className="font-bold text-lg text-[#12232b] mb-1">Entregar Atividade</h3>
            <p className="text-xs text-gray-500 mb-6">{atividadeSelecionada.titulo}</p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold mb-1 block">Link do Arquivo</label>
                <input 
                  type="url" 
                  value={link} 
                  onChange={e => setLink(e.target.value)} 
                  placeholder="https://drive.google.com/..." 
                  className="w-full border p-2 rounded outline-none focus:border-[#0d9488]" 
                />
                <p className="text-[10px] text-gray-400 mt-1">Cole o link do Google Drive, OneDrive ou similar.</p>
              </div>
              <div>
                <label className="text-xs font-bold mb-1 block">Comentário (Opcional)</label>
                <textarea 
                  value={comentario} 
                  onChange={e => setComentario(e.target.value)} 
                  rows={3} 
                  placeholder="Alguma observação para o professor?" 
                  className="w-full border p-2 rounded outline-none focus:border-[#0d9488] resize-none" 
                />
              </div>

              {erro && <p className="text-red-500 text-sm flex items-center gap-1"><AlertCircle className="size-4" /> {erro}</p>}
              
              <button 
                onClick={handleEnviar} 
                disabled={enviando} 
                className="w-full bg-[#0d9488] text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2 hover:bg-[#0f766e] mt-2 disabled:opacity-50"
              >
                {enviando ? <Loader2 className="animate-spin size-4" /> : <CheckCircle2 className="size-4" />}
                {enviando ? 'Enviando...' : 'Enviar Atividade'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
