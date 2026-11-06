'use client'

import { useState } from 'react'
import { MessageSquare, ArrowLeft, Send, Loader2, Plus } from 'lucide-react'
import { getMensagensAluno, enviarMensagemAluno, criarConversaAluno } from './actions'

export function AlunoMensagensClient({ conversasIniciais }: { conversasIniciais: any[] }) {
  const [conversas, setConversas] = useState(conversasIniciais)
  const [conversaAtiva, setConversaAtiva] = useState<any | null>(null)
  const [mensagens, setMensagens] = useState<any[]>([])
  const [carregando, setCarregando] = useState(false)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  
  // Nova conversa
  const [modalAberto, setModalAberto] = useState(false)
  const [assunto, setAssunto] = useState('')
  const [criando, setCriando] = useState(false)

  async function abrir(c: any) {
    setConversaAtiva(c)
    setCarregando(true)
    const msgs = await getMensagensAluno(c.id)
    setMensagens(msgs)
    setCarregando(false)
  }

  async function handleEnviar() {
    if (!conversaAtiva || !texto.trim()) return
    setEnviando(true)
    const r = await enviarMensagemAluno(conversaAtiva.id, texto)
    setEnviando(false)
    if (r.success) {
      setTexto('')
      const msgs = await getMensagensAluno(conversaAtiva.id)
      setMensagens(msgs)
    } else alert(r.error)
  }

  async function handleCriarConversa() {
    if (!assunto.trim()) return alert('Preencha o assunto.')
    setCriando(true)
    const r = await criarConversaAluno(assunto)
    setCriando(false)
    if (r.success) {
      setModalAberto(false)
      setAssunto('')
      window.location.reload() // Recarrega para trazer a nova conversa
    } else alert(r.error)
  }

  if (conversaAtiva) {
    return (
      <div className="flex flex-col h-[calc(100vh-120px)] bg-white rounded-xl shadow-sm border border-[#e5ecee] overflow-hidden m-6">
        <header className="bg-[#fafcfc] border-b border-[#e5ecee] px-6 py-4 flex items-center gap-4 shrink-0">
          <button onClick={() => setConversaAtiva(null)} className="p-2 hover:bg-gray-100 rounded-full transition"><ArrowLeft className="size-5" /></button>
          <div><h2 className="font-bold">{conversaAtiva.assunto}</h2><p className="text-xs text-gray-500">Conversa com a escola</p></div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#f6f8f9]">
          {carregando ? <div className="flex justify-center"><Loader2 className="animate-spin text-[#0d9488]"/></div> : 
           mensagens.length === 0 ? <div className="text-center text-sm text-gray-500">Nenhuma mensagem.</div> :
           mensagens.map(m => {
             const isEu = m.remetente_tipo === 'aluno' || m.remetente_tipo === 'responsavel'
             return (
               <div key={m.id} className={`flex flex-col max-w-[80%] ${isEu ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                 <span className="text-[10px] text-gray-400 mb-1">{m.remetente_nome} • {new Date(m.criado_em).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</span>
                 <div className={`p-3 rounded-2xl text-sm ${isEu ? 'bg-[#0d9488] text-white rounded-tr-sm' : 'bg-white border text-[#243942] rounded-tl-sm'}`}>{m.conteudo}</div>
               </div>
             )
           })
          }
        </div>

        <div className="p-4 bg-white border-t border-[#e5ecee] shrink-0">
           <div className="flex gap-2">
             <input type="text" value={texto} onChange={e => setTexto(e.target.value)} onKeyDown={e=>e.key==='Enter' && handleEnviar()} placeholder="Digite sua mensagem..." className="flex-1 border rounded-full px-4 py-2 outline-none focus:border-[#0d9488] text-sm"/>
             <button onClick={handleEnviar} disabled={enviando || !texto.trim()} className="bg-[#0d9488] text-white p-2 rounded-full hover:brightness-110 transition disabled:opacity-50"><Send className="size-5"/></button>
           </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#12232b]">Minhas Mensagens</h1>
        <button 
          onClick={() => setModalAberto(true)}
          className="flex items-center gap-2 bg-[#0d9488] text-white px-4 py-2 rounded-lg font-semibold text-sm hover:brightness-110 transition"
        >
          <Plus size={16} /> Nova Mensagem
        </button>
      </div>
      
      <div className="bg-white border border-[#e5ecee] rounded-xl overflow-hidden">
         {conversas.length === 0 ? <div className="p-10 text-center text-sm text-[#82939a]">Nenhuma conversa iniciada.</div> :
          conversas.map(c => (
            <button key={c.id} onClick={() => abrir(c)} className="w-full flex items-center gap-4 p-5 border-b border-[#f0f4f5] hover:bg-[#fafcfc] text-left transition">
              <div className="grid size-10 place-items-center rounded-full bg-[#ccfbf1] text-[#0d9488]"><MessageSquare className="size-5"/></div>
              <div className="flex-1"><p className="font-bold text-sm">{c.assunto}</p><p className="text-xs text-[#82939a]">Atualizado em: {new Date(c.atualizado_em).toLocaleDateString('pt-BR')}</p></div>
              {c.nao_lidas > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{c.nao_lidas}</span>}
            </button>
          ))
         }
      </div>

      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-[#e5ecee] flex justify-between items-center bg-[#fafcfc]">
              <h3 className="font-bold text-[#12232b]">Nova Mensagem</h3>
              <button onClick={() => setModalAberto(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-[#82939a] uppercase">Assunto</label>
                <input 
                  type="text" 
                  value={assunto}
                  onChange={e => setAssunto(e.target.value)}
                  placeholder="Ex: Dúvida sobre a matéria..."
                  className="mt-1 w-full border border-[#dce5e8] rounded-lg p-2 text-sm focus:border-[#0d9488] outline-none"
                />
              </div>
            </div>
            <div className="p-5 border-t border-[#e5ecee] bg-[#fafcfc] flex justify-end gap-2">
              <button onClick={() => setModalAberto(false)} className="px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-100 rounded-lg">Cancelar</button>
              <button onClick={handleCriarConversa} disabled={criando} className="px-4 py-2 text-sm font-semibold text-white bg-[#0d9488] hover:brightness-110 rounded-lg disabled:opacity-50">
                {criando ? 'Criando...' : 'Iniciar Conversa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}